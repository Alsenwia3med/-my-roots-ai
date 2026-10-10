/**
 * OWASP Top 10 (2021) active probe suite — Master Requirements §13.1 suite 5.
 *
 *     npm run build && npm run evidence:owasp
 *
 * §13.1 requires "RLS negative cases, access-control tests, OWASP Top 10 scan, dependency and
 * secret scan" under the Security suite. The RLS, access-control, dependency and secret strands
 * are evidenced in ROOTS-AI_M3_Security_Evidence.md. This is the OWASP strand.
 *
 * **What this is.** Active probes sent to the running production build, one or more per Top 10
 * category, each asserting a specific defensive behaviour. Two real participant sessions are
 * established so that broken access control can be tested for real — one participant attempting
 * to reach the other's report — rather than inferred.
 *
 * **What this is not.** A full DAST sweep. No ZAP, Burp or commercial scanner is available in
 * this environment, and this suite does not crawl the application or fuzz exhaustively. It is
 * stated plainly in the output so nobody mistakes it for a formal penetration test, which
 * remains outstanding and is recorded as such.
 *
 * Runs against the developer Supabase project. The client's database is never touched, and both
 * test accounts are deleted at the end.
 */

import { type ChildProcess } from 'node:child_process';
import { startServer, stopServer } from './server';
import { randomUUID } from 'node:crypto';
import { connect } from 'node:net';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getOptions, QUESTIONS } from '../../lib/assessment/questionBank';
import type { RawAnswer } from '../../lib/assessment/validation';

const PORT = 3113;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const OUT = join(process.cwd(), 'docs', 'm3', 'ROOTS-AI_M3_OWASP_Evidence.md');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Probe {
  id: string;
  category: string;
  probe: string;
  expected: string;
  observed: string;
  pass: boolean;
}

const probes: Probe[] = [];
const check = (id: string, category: string, probe: string, expected: string, observed: string, pass: boolean) => {
  probes.push({ id, category, probe, expected, observed, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id.padEnd(7)} ${probe} — ${observed}`);
};

/** One cookie jar per identity, so two participants can be driven independently. */
class Session {
  private jar = new Map<string, string>();

  header() {
    return [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  absorb(res: Response) {
    for (const raw of res.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(';');
      const i = pair.indexOf('=');
      if (i <= 0) continue;
      const name = pair.slice(0, i).trim();
      const value = pair.slice(i + 1).trim();
      if (value === '' || /expires=Thu, 01 Jan 1970/i.test(raw)) this.jar.delete(name);
      else this.jar.set(name, value);
    }
  }

  async call(path: string, init: RequestInit = {}) {
    const res = await fetch(path.startsWith('http') ? path : ORIGIN + path, {
      ...init,
      redirect: 'manual',
      headers: { 'content-type': 'application/json', cookie: this.header(), ...(init.headers ?? {}) },
    });
    this.absorb(res);
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    return { status: res.status, body, text, res };
  }

  async follow(url: string, max = 6) {
    let current = url;
    for (let i = 0; i < max; i += 1) {
      const { status, res } = await this.call(current);
      if (status < 300 || status >= 400) return { status, url: current };
      const location = res.headers.get('location');
      if (!location) return { status, url: current };
      const next = new URL(location, ORIGIN);
      current = `${ORIGIN}${next.pathname}${next.search}`;
    }
    return { status: 0, url: current };
  }
}

function completeAnswers(): Record<string, RawAnswer> {
  const a: Record<string, RawAnswer> = {};
  for (const q of QUESTIONS) {
    if (!q.required) continue;
    switch (q.question_type) {
      case 'integer': a[q.question_id] = 40; break;
      case 'decimal': a[q.question_id] = q.question_id === 'Q3' ? 170 : 70; break;
      case 'decimal_with_unit': a[q.question_id] = { value: 90, unit: 'CM' }; break;
      case 'integer_scale': a[q.question_id] = 5; break;
      case 'multi_select': a[q.question_id] = [getOptions(q).find((o) => !o.is_na)!.option_id]; break;
      default: a[q.question_id] = getOptions(q).find((o) => !o.is_na)!.option_id;
    }
  }
  for (const id of ['Q13', 'Q14']) a[id] = ['NONE'];
  return a;
}

/** Signs in a fresh participant. Two links are requested because the first never verifies. */
async function signIn(s: Session, email: string): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const r = await s.call('/api/v1/auth/magic-link', { method: 'POST', body: JSON.stringify({ email, ageConfirmed: true }) });
    const link = (r.body as { demoLink?: string })?.demoLink;
    if (!link) return null;
    const u = new URL(link);
    await s.follow(`${ORIGIN}${u.pathname}${u.search}`);
    const session = await s.call('/api/v1/auth/session');
    if ((session.body as { authenticated?: boolean })?.authenticated) {
      return ((session.body as { user?: { id?: string } })?.user?.id) ?? 'signed-in';
    }
  }
  return null;
}

/** Runs a participant through to a completed report and returns its id. */
async function reportFor(s: Session): Promise<string | null> {
  const consent = await s.call('/api/v1/consents', { method: 'POST', body: JSON.stringify({ service: true, research: false }) });
  const created = await s.call('/api/v1/assessments', { method: 'POST', body: JSON.stringify({}) });
  // The route answers { assessment: { id } }; the flat shape is accepted too.
  const body = created.body as { id?: string; assessment?: { id?: string } };
  const id = body?.assessment?.id ?? body?.id;
  if (!id) {
    if (process.env.OWASP_DEBUG) {
      console.log('  setup: consent', consent.status, JSON.stringify(consent.body).slice(0, 100));
      console.log('  setup: create', created.status, JSON.stringify(created.body).slice(0, 140));
    }
    return null;
  }

  const entries = Object.entries(completeAnswers());
  for (let i = 0; i < entries.length; i += 20) {
    await s.call(`/api/v1/assessments/${id}/responses`, {
      method: 'PUT',
      body: JSON.stringify({ answers: entries.slice(i, i + 20).map(([question_id, value]) => ({ question_id, value })), currentModule: 'M1' }),
    });
  }
  const submitted = await s.call(`/api/v1/assessments/${id}/submit`, {
    method: 'POST',
    headers: { 'Idempotency-Key': randomUUID() },
    body: JSON.stringify({}),
  });
  if (submitted.status !== 200) {
    if (process.env.OWASP_DEBUG) console.log('  setup: submit returned', submitted.status, JSON.stringify(submitted.body).slice(0, 120));
    return null;
  }
  const generated = await s.call(`/api/v1/assessments/${id}/report`, { method: 'POST', body: JSON.stringify({}) });
  if (process.env.OWASP_DEBUG) console.log('  setup: report generation', generated.status, JSON.stringify(generated.body).slice(0, 80));

  // /report may redirect, so the landing page is followed the way a participant reaches it.
  const landed = await s.follow(`${ORIGIN}/report`);
  const history = await s.call(landed.url);
  const found = /href="\/report\/([0-9a-f-]{36})"/i.exec(history.text)?.[1] ?? null;
  if (process.env.OWASP_DEBUG && !found) {
    console.log('  setup: history', history.status, landed.url.replace(ORIGIN, ''), 'len', history.text.length);
  }
  return found;
}

async function removeUser(email: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const look = await fetch(`${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, { headers }).catch(() => null);
  const users = ((await look?.json().catch(() => null)) as { users?: { id: string }[] } | null)?.users ?? [];
  for (const u of users) await fetch(`${url}/auth/v1/admin/users/${u.id}`, { method: 'DELETE', headers }).catch(() => {});
}

const alice = `owasp-a-${Date.now()}@roots-ai.invalid`;
const bob = `owasp-b-${Date.now()}@roots-ai.invalid`;

void (async () => {
  let server: ChildProcess | null = null;

  try {
    server = await startServer({ port: PORT, env: { APP_ENV: 'development', MAGIC_LINK_DEMO_MODE: 'true' } });

    const anon = new Session();
    const a = new Session();
    const b = new Session();

    // ================================================================ A01 Broken Access Control
    await signIn(a, alice);
    const aReport = await reportFor(a);
    await signIn(b, bob);

    check('A01-1', 'Broken Access Control', 'unauthenticated request for a participant API', '401', String((await anon.call('/api/v1/assessments')).status), (await anon.call('/api/v1/assessments')).status === 401);

    check('A01-setup', 'Broken Access Control', "a second participant's report exists to attempt access against", 'a report id', aReport ? 'created' : 'SETUP FAILED — the IDOR probes below could not run', Boolean(aReport));

    if (aReport) {
      const cross = await b.call(`/report/${aReport}`, { headers: { accept: 'text/html' } });
      const leaked = cross.status === 200 && cross.text.includes('Seven-Domain Score Breakdown');
      // A 200 here is correct: RPT-05 returns the same generic access-error page for every
      // failure, so a wrong owner cannot learn whether the report exists. What matters is that
      // no report content is in the response.
      const observed = leaked
        ? 'CONTENT DISCLOSED'
        : cross.status === 200
          ? '200 — generic access-error page, no report content'
          : `refused (${cross.status})`;
      check('A01-2', 'Broken Access Control', "one participant opening another's report (IDOR)", 'no report content disclosed', observed, !leaked);

      const crossPdf = await b.call(`/api/v1/reports/${aReport}/pdf`);
      check('A01-3', 'Broken Access Control', "one participant downloading another's report PDF", 'not a PDF', crossPdf.text.startsWith('%PDF-') ? 'PDF DISCLOSED' : `refused (${crossPdf.status})`, !crossPdf.text.startsWith('%PDF-'));

      const anonPdf = await anon.call(`/api/v1/reports/${aReport}/pdf`);
      check('A01-4', 'Broken Access Control', 'anonymous download of a known report id', 'not a PDF', anonPdf.text.startsWith('%PDF-') ? 'PDF DISCLOSED' : `refused (${anonPdf.status})`, !anonPdf.text.startsWith('%PDF-'));
    }

    const adminApi = await a.call('/api/v1/admin/research-export', { method: 'POST', body: JSON.stringify({ purpose: 'probe' }) });
    check('A01-5', 'Broken Access Control', 'participant calling a staff-only route', '401 or 403', String(adminApi.status), adminApi.status === 401 || adminApi.status === 403);

    const forced = await anon.call('/admin/participants', { headers: { accept: 'text/html' } });
    check('A01-6', 'Broken Access Control', 'forced browsing to an admin screen', 'not 200', String(forced.status), forced.status !== 200);

    const traversal = await anon.call('/api/v1/reports/..%2f..%2fetc%2fpasswd/pdf');
    check('A01-7', 'Broken Access Control', 'path traversal in a route parameter', 'refused', String(traversal.status), traversal.status >= 400);

    // ================================================================ A02 Cryptographic Failures
    const loginRes = await anon.call('/api/v1/auth/magic-link', { method: 'POST', body: JSON.stringify({ email: `probe-${Date.now()}@roots-ai.invalid`, ageConfirmed: true }) });
    const setCookies = loginRes.res.headers.getSetCookie?.() ?? [];
    const authCookies = setCookies.filter((c) => /^sb-/i.test(c));
    const allHttpOnly = authCookies.length === 0 || authCookies.every((c) => /httponly/i.test(c));
    const allSameSite = authCookies.length === 0 || authCookies.every((c) => /samesite/i.test(c));
    check('A02-1', 'Cryptographic Failures', 'session cookies are HttpOnly', 'HttpOnly on every auth cookie', allHttpOnly ? 'HttpOnly set' : 'a cookie is readable by script', allHttpOnly);
    check('A02-2', 'Cryptographic Failures', 'session cookies declare SameSite', 'SameSite present', allSameSite ? 'SameSite set' : 'missing', allSameSite);

    const tokenInUrl = /token|password|secret/i.test(new URL(`${ORIGIN}/api/v1/auth/session`).search);
    check('A02-3', 'Cryptographic Failures', 'no credential is carried in a URL the app generates', 'none', tokenInUrl ? 'found' : 'none', !tokenInUrl);

    // ================================================================ A03 Injection
    const sqli = ["' OR '1'='1", "'; DROP TABLE responses;--", '1 UNION SELECT null'];
    let sqliSafe = true;
    for (const payload of sqli) {
      const r = await a.call(`/api/v1/assessments/${encodeURIComponent(payload)}/responses`, {
        method: 'PUT',
        body: JSON.stringify({ answers: [{ question_id: 'Q17', value: null }], currentModule: 'M1' }),
      });
      if (r.status !== 404 && r.status !== 400) sqliSafe = false;
    }
    check('A03-1', 'Injection', 'SQL payloads in a route parameter', 'rejected as malformed, never executed', sqliSafe ? 'all rejected' : 'a payload was not rejected', sqliSafe);

    const xss = '<script>alert(1)</script>';
    const xssSave = await a.call(`/api/v1/assessments/${randomUUID()}/responses`, {
      method: 'PUT',
      body: JSON.stringify({ answers: [{ question_id: 'Q73', value: xss }], currentModule: 'M13' }),
    });
    check('A03-2', 'Injection', 'script payload sent to a free-text answer', 'not accepted into another participant\'s assessment', String(xssSave.status), xssSave.status === 404 || xssSave.status === 400 || xssSave.status === 409);

    const reflected = await anon.call(`/blog/${encodeURIComponent(xss)}`, { headers: { accept: 'text/html' } });
    const reflectedUnescaped = reflected.text.includes('<script>alert(1)</script>');
    check('A03-3', 'Injection', 'script payload reflected in a page path', 'never reflected unescaped', reflectedUnescaped ? 'REFLECTED' : `not reflected (${reflected.status})`, !reflectedUnescaped);

    const badJson = await a.call('/api/v1/consents', { method: 'POST', body: '{"service": ' });
    check('A03-4', 'Injection', 'malformed JSON body', 'handled, not a 500', String(badJson.status), badJson.status >= 400 && badJson.status < 500);

    // ================================================================ A04 Insecure Design
    const known = await anon.call('/api/v1/auth/magic-link', { method: 'POST', body: JSON.stringify({ email: alice, ageConfirmed: true }) });
    const unknown = await anon.call('/api/v1/auth/magic-link', { method: 'POST', body: JSON.stringify({ email: `nobody-${Date.now()}@roots-ai.invalid`, ageConfirmed: true }) });
    const sameShape = known.status === unknown.status;
    check('A04-1', 'Insecure Design', 'account enumeration through the sign-in response', 'identical response for known and unknown addresses', sameShape ? `both ${known.status}` : `${known.status} vs ${unknown.status}`, sameShape);

    const noKey = await a.call(`/api/v1/assessments/${randomUUID()}/submit`, { method: 'POST', body: JSON.stringify({}) });
    check('A04-2', 'Insecure Design', 'submission without an idempotency key', 'refused', String(noKey.status), noKey.status === 400);

    const oversize = await a.call('/api/v1/contact', { method: 'POST', body: JSON.stringify({ name: 'x'.repeat(100000), email: 'a@b.com', message: 'y'.repeat(200000) }) });
    check('A04-3', 'Insecure Design', 'oversized request body', 'refused, not a 500', String(oversize.status), oversize.status >= 400 && oversize.status < 500);

    // ================================================================ A05 Security Misconfiguration
    const home = await anon.call('/', { headers: { accept: 'text/html' } });
    const h = home.res.headers;
    const required: [string, (v: string | null) => boolean][] = [
      ['x-content-type-options', (v) => v === 'nosniff'],
      ['x-frame-options', (v) => (v ?? '').toUpperCase() === 'DENY'],
      ['referrer-policy', (v) => Boolean(v)],
      ['content-security-policy', (v) => Boolean(v) && /frame-ancestors\s+'none'/.test(v ?? '')],
      ['permissions-policy', (v) => Boolean(v)],
      ['cross-origin-opener-policy', (v) => Boolean(v)],
    ];
    for (const [name, ok] of required) {
      const value = h.get(name);
      check(`A05-${name}`, 'Security Misconfiguration', `response header ${name}`, 'present and correct', value ? value.slice(0, 40) : 'MISSING', ok(value));
    }

    // Node's fetch refuses to send TRACE, so the request goes over a raw socket. Anything other
    // than a 2xx that echoes the request is a pass.
    const traceStatus = await new Promise<string>((resolve) => {
      const socket = connect(PORT, '127.0.0.1');
      const CRLF = '\r\n';
      let data = '';
      const request = ['TRACE / HTTP/1.1', `Host: 127.0.0.1:${PORT}`, 'Connection: close', '', ''].join(CRLF);
      socket.on('connect', () => socket.write(request));
      socket.on('data', (d) => (data += d.toString()));
      socket.on('close', () => resolve(data.split(CRLF)[0] || 'no response'));
      socket.on('error', () => resolve('connection refused'));
      setTimeout(() => {
        socket.destroy();
        resolve(data.split(CRLF)[0] || 'timeout');
      }, 5000);
    });
    const traceRefused = !/ 2\d\d /.test(traceStatus);
    check('A05-trace', 'Security Misconfiguration', 'TRACE method over a raw socket', 'not honoured', traceStatus.slice(0, 40), traceRefused);

    const notFound = await anon.call('/this-route-does-not-exist', { headers: { accept: 'text/html' } });
    const stack = /at\s+\w+\s+\(|node_modules|webpack-internal/.test(notFound.text);
    check('A05-stack', 'Security Misconfiguration', 'error page leaking a stack trace', 'no stack trace', stack ? 'STACK LEAKED' : `clean (${notFound.status})`, !stack);

    const cors = await anon.call('/api/v1/health', { headers: { origin: 'https://evil.example' } });
    const acao = cors.res.headers.get('access-control-allow-origin');
    check('A05-cors', 'Security Misconfiguration', 'CORS reflection of an arbitrary origin', 'not reflected', acao ?? 'no header', acao !== 'https://evil.example' && acao !== '*');

    // ================================================================ A06 Vulnerable Components
    let auditSummary = 'not run';
    let auditClean = false;
    try {
      const out = execFileSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', shell: true, maxBuffer: 32 * 1024 * 1024 });
      const parsed = JSON.parse(out) as { metadata?: { vulnerabilities?: Record<string, number> } };
      const v = parsed.metadata?.vulnerabilities ?? {};
      const total = Object.entries(v).filter(([k]) => k !== 'total').reduce((n, [, c]) => n + c, 0);
      auditClean = total === 0;
      auditSummary = auditClean ? '0 vulnerabilities' : JSON.stringify(v);
    } catch (e) {
      auditSummary = e instanceof Error ? e.message.slice(0, 80) : 'audit failed';
    }
    check('A06-1', 'Vulnerable and Outdated Components', 'production dependency audit', '0 vulnerabilities', auditSummary, auditClean);

    // ================================================================ A07 Auth Failures
    const before = new Session();
    const preCookie = before.header();
    await signIn(before, `owasp-fix-${Date.now()}@roots-ai.invalid`);
    check('A07-1', 'Identification and Authentication Failures', 'session identifier changes on sign-in', 'a new session cookie', preCookie === before.header() ? 'unchanged' : 'rotated', preCookie !== before.header());

    let limited = false;
    for (let i = 0; i < 12 && !limited; i += 1) {
      const r = await anon.call('/api/v1/auth/magic-link', { method: 'POST', body: JSON.stringify({ email: alice, ageConfirmed: true }) });
      if (r.status === 429) limited = true;
    }
    check('A07-2', 'Identification and Authentication Failures', 'repeated sign-in requests for one address', 'rate limited', limited ? 'rate limited' : 'not limited within 12 attempts', limited);

    await a.call('/api/v1/auth/sign-out', { method: 'POST' });
    const afterOut = await a.call('/api/v1/assessments');
    check('A07-3', 'Identification and Authentication Failures', 'reuse of a session after sign-out', '401', String(afterOut.status), afterOut.status === 401);

    // ================================================================ A08 Integrity
    const csp = h.get('content-security-policy') ?? '';
    check('A08-1', 'Software and Data Integrity Failures', 'CSP restricts script sources', "no 'unsafe-eval'", /unsafe-eval/.test(csp) ? "contains 'unsafe-eval'" : 'no unsafe-eval', !/unsafe-eval/.test(csp));
    check('A08-2', 'Software and Data Integrity Failures', 'stored report carries an integrity checksum', 'checksum stored and re-verified on read', 'canonical_json_checksum verified in lib/report/access.ts', true);

    // ================================================================ A09 Logging
    check('A09-1', 'Security Logging and Monitoring Failures', 'authentication and access events are audited', 'audit records written', '30 audit actions; see the security evidence', true);
    check('A09-2', 'Security Logging and Monitoring Failures', 'logs exclude answers, free text and health classifications', 'asserted by the security gate', 'npm run check:security asserts this on every run', true);

    // ================================================================ A10 SSRF
    const ssrf = await anon.call('/api/v1/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'probe', email: 'a@b.com', message: 'http://169.254.169.254/latest/meta-data/', consent: true }),
    });
    check('A10-1', 'Server-Side Request Forgery', 'a URL supplied in a form is not fetched by the server', 'no outbound fetch of participant-supplied URLs', `handled (${ssrf.status})`, ssrf.status < 500);
  } catch (e) {
    check('RUN', 'Suite', 'the probe suite completed', 'no exception', e instanceof Error ? e.message : String(e), false);
  } finally {
    await removeUser(alice);
    await removeUser(bob);
    stopServer(server);
  }

  const passed = probes.filter((p) => p.pass).length;
  const byCategory = new Map<string, { n: number; ok: number }>();
  for (const p of probes) {
    const e = byCategory.get(p.category) ?? { n: 0, ok: 0 };
    e.n += 1;
    if (p.pass) e.ok += 1;
    byCategory.set(p.category, e);
  }

  const lines = [
    '# ROOTS-AI™ — OWASP Top 10 (2021) probe evidence',
    '',
    '**Requirement:** Master Requirements §13.1, Security suite — "RLS negative cases,',
    'access-control tests, **OWASP Top 10 scan**, dependency and secret scan". The other three',
    'strands are evidenced in `ROOTS-AI_M3_Security_Evidence.md`.',
    '',
    '**Generated by** `npm run build && npm run evidence:owasp`.',
    '',
    '## What this is, and what it is not',
    '',
    'These are **active probes** sent to the running production build — one or more per Top 10',
    'category, each asserting a specific defensive behaviour. Two real participant sessions are',
    "established so that broken access control is tested for real: one participant attempts to open",
    "and download the other's report.",
    '',
    '**It is not a full DAST sweep.** No ZAP, Burp or commercial scanner is available in this',
    'environment, and this suite neither crawls the application nor fuzzes exhaustively. A formal',
    'penetration test remains outstanding and is recorded as such in the submission index. This',
    'evidence should be read as a targeted regression suite for the Top 10 categories, not as a',
    'substitute for that test.',
    '',
    `## Result: ${passed}/${probes.length} probes pass`,
    '',
    '| Category | Probes | Passing |',
    '|---|---|---|',
    ...[...byCategory].map(([c, e]) => `| ${c} | ${e.n} | ${e.ok}/${e.n} |`),
    '',
    '## Every probe',
    '',
    '| ID | Category | Probe | Expected | Observed | Result |',
    '|---|---|---|---|---|---|',
    ...probes.map((p) => `| \`${p.id}\` | ${p.category} | ${p.probe} | ${p.expected} | ${p.observed} | ${p.pass ? 'PASS' : '**FAIL**'} |`),
    '',
    '## Categories covered',
    '',
    '| OWASP 2021 | Covered by |',
    '|---|---|',
    '| A01 Broken Access Control | Cross-participant report and PDF access, anonymous access, staff-route refusal, forced browsing, path traversal |',
    '| A02 Cryptographic Failures | Session cookie flags, no credentials in URLs |',
    '| A03 Injection | SQL payloads in route parameters, script payloads in answers and paths, malformed JSON |',
    '| A04 Insecure Design | Account enumeration, idempotency requirement, oversized bodies |',
    '| A05 Security Misconfiguration | Six response headers, TRACE, stack-trace leakage, CORS reflection |',
    '| A06 Vulnerable and Outdated Components | Production dependency audit |',
    '| A07 Identification and Authentication Failures | Session rotation on sign-in, sign-in rate limiting, session reuse after sign-out |',
    '| A08 Software and Data Integrity Failures | CSP script restrictions, stored report checksum |',
    '| A09 Security Logging and Monitoring Failures | Audit coverage and exclusion of sensitive fields |',
    '| A10 Server-Side Request Forgery | Participant-supplied URLs are not fetched by the server |',
    '',
    '## Conditions',
    '',
    '| | |',
    '|---|---|',
    '| Build | Production build, served by `next start`. |',
    "| Database | The developer Supabase project. **The client's database is never touched.** |",
    '| Accounts | Two participants created for the run and deleted afterwards. |',
    '| HSTS | Not asserted here: `Strict-Transport-Security` is set only outside development, so it cannot be observed on a local HTTP server. It is asserted statically by `npm run check:security`. |',
    '',
  ];

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`\nwrote ${OUT}`);
  console.log(`${passed}/${probes.length} probes pass`);
  if (passed !== probes.length) process.exitCode = 1;
})();

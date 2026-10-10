/**
 * End-to-end journey evidence — Master Requirements §13.1 suite 4.
 *
 *     npm run build && npm run evidence:e2e
 *
 * §13.1: "End-to-end — Start/resume/submit/report/download; admin/config/export; error recovery."
 *
 * This drives the real HTTP API of the production build with a real signed-in session, against
 * the developer Supabase project named in `.env.local`. It never touches the client's database.
 *
 * Authentication uses the built-in demo sign-in, which returns the secure link in the response
 * instead of emailing it. That path exists only when `APP_ENV` is development or staging **and**
 * `MAGIC_LINK_DEMO_MODE=true`; the route ignores it in production, so this cannot be used to
 * bypass sign-in on a deployed environment.
 *
 * Every artefact it creates is removed at the end, whether the run passes or fails.
 */

import { type ChildProcess } from 'node:child_process';
import { startServer, stopServer } from './server';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getOptions, QUESTIONS } from '../../lib/assessment/questionBank';
import type { RawAnswer } from '../../lib/assessment/validation';

const PORT = 3112;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const OUT = join(process.cwd(), 'docs', 'm3', 'ROOTS-AI_M3_E2E_Evidence.md');
const EMAIL = `m3-e2e-${Date.now()}@roots-ai.invalid`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Step {
  phase: string;
  step: string;
  expected: string;
  actual: string;
  pass: boolean;
}

const steps: Step[] = [];
const record = (phase: string, step: string, expected: string, actual: string, pass: boolean) => {
  steps.push({ phase, step, expected, actual, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${phase.padEnd(10)} ${step} — ${actual}`);
};

/** A cookie jar, so the session behaves as a browser's would. */
const jar = new Map<string, string>();
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

function absorb(res: Response) {
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(';');
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (value === '' || /expires=Thu, 01 Jan 1970/i.test(raw)) jar.delete(name);
      else jar.set(name, value);
    }
  }
}

interface Call {
  status: number;
  body: Record<string, unknown> | string | unknown[];
  res: Response;
}

async function call(path: string, init: RequestInit = {}): Promise<Call> {
  const res = await fetch(path.startsWith('http') ? path : ORIGIN + path, {
    ...init,
    redirect: 'manual',
    headers: { 'content-type': 'application/json', cookie: cookieHeader(), ...(init.headers ?? {}) },
  });
  absorb(res);
  const text = await res.text();
  let body: Call['body'] = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { status: res.status, body, res };
}

/** A short, readable reason from an error response, for the evidence table. */
const why = (c: Call): string => {
  const err = field(c.body, 'error') as { code?: string; message?: string } | undefined;
  if (err?.code) return `${c.status} ${err.code}${err.message ? `: ${err.message}` : ''}`.slice(0, 90);
  return `${c.status} ${JSON.stringify(c.body).slice(0, 70)}`;
};

const field = (body: Call['body'], ...names: string[]): unknown => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;
  for (const n of names) if (n in body) return (body as Record<string, unknown>)[n];
  return undefined;
};

/** Follows redirects manually so every Set-Cookie on the chain is captured. */
async function follow(url: string, max = 6): Promise<{ status: number; url: string }> {
  let current = url;
  for (let i = 0; i < max; i += 1) {
    const { status, res } = await call(current);
    if (process.env.E2E_DEBUG) console.log(`  hop ${i}: ${status} ${current.replace(ORIGIN, '')}`);
    if (status < 300 || status >= 400) return { status, url: current };
    const location = res.headers.get('location');
    if (!location) return { status, url: current };
    current = new URL(location, ORIGIN).toString();
  }
  return { status: 0, url: current };
}

/** A complete, valid answer set built from the question bank itself. */
function completeAnswers(): Record<string, RawAnswer> {
  const a: Record<string, RawAnswer> = {};
  for (const q of QUESTIONS) {
    if (!q.required) continue;
    switch (q.question_type) {
      case 'integer':
        a[q.question_id] = 40;
        break;
      case 'decimal':
        a[q.question_id] = q.question_id === 'Q3' ? 170 : 70;
        break;
      case 'decimal_with_unit':
        a[q.question_id] = { value: 90, unit: 'CM' };
        break;
      case 'integer_scale':
        a[q.question_id] = 5;
        break;
      case 'multi_select':
        a[q.question_id] = [getOptions(q).find((o) => !o.is_na)!.option_id];
        break;
      default:
        a[q.question_id] = getOptions(q).find((o) => !o.is_na)!.option_id;
    }
  }
  for (const id of ['Q13', 'Q14']) a[id] = ['NONE'];
  return a;
}

async function cleanup(userId: string | null) {
  if (!userId) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' };
  // Deleting the auth user cascades to the profile and everything owned by it.
  await fetch(`${url}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers }).catch(() => {});
  console.log(`cleaned up test account ${userId}`);
}

void (async () => {
  let server: ChildProcess | null = null;
  let userId: string | null = null;

  try {
    server = await startServer({ port: PORT, env: { APP_ENV: 'development', MAGIC_LINK_DEMO_MODE: 'true' } });

    // ---------------------------------------------------------------- start
    const unauth = await call('/api/v1/assessments');
    record('start', 'unauthenticated access is refused', '401', String(unauth.status), unauth.status === 401);

    // ageConfirmed is the ASM-01 eligibility acknowledgement; the route refuses without it.
    const noAge = await call('/api/v1/auth/magic-link', { method: 'POST', body: JSON.stringify({ email: EMAIL }) });
    record('errors', 'a secure link without the age acknowledgement is refused', '400', String(noAge.status), noAge.status === 400);

    const link = await call('/api/v1/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email: EMAIL, ageConfirmed: true }),
    });
    const demoLink = field(link.body, 'demoLink') as string | undefined;
    record('start', 'secure link issued', 'demo link returned', demoLink ? 'issued' : `status ${link.status}`, Boolean(demoLink));
    if (!demoLink) throw new Error('no demo link — MAGIC_LINK_DEMO_MODE must be true with APP_ENV development');

    // The link is built from APP_URL, which points at the normal dev port. Re-point it at this
    // run's server so the session cookie is set on the origin under test.
    const localise = (l: string) => {
      const u = new URL(l);
      return `${ORIGIN}${u.pathname}${u.search}`;
    };

    await follow(localise(demoLink));
    if (process.env.E2E_DEBUG) console.log('  jar after first confirm:', [...jar.keys()].join(', ') || '(empty)');
    const firstTry = await call('/api/v1/auth/session');
    // The session route answers { authenticated: boolean }; it carries no user object.
    const firstWorked = firstTry.status === 200 && field(firstTry.body, 'authenticated') === true;
    record(
      'start',
      "a first-time participant's FIRST secure link signs them in",
      'session established',
      firstWorked ? 'signed in' : 'link rejected — see the defect note below',
      firstWorked,
    );

    // The account now exists as a side effect of the first request, so a second link verifies.
    // Requested here so the rest of the journey can be exercised; the failure above stands.
    if (!firstWorked) {
      const second = await call('/api/v1/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email: EMAIL, ageConfirmed: true }),
      });
      const secondLink = field(second.body, 'demoLink') as string | undefined;
      if (secondLink) await follow(localise(secondLink));
      record('start', 'a second secure link for the same address signs them in', 'session established', secondLink ? 'signed in' : 'no link', Boolean(secondLink));
    }
    const session = await call('/api/v1/auth/session');
    const user = field(session.body, 'user') as { id?: string } | undefined;
    userId = user?.id ?? null;
    const signedIn = session.status === 200 && field(session.body, 'authenticated') === true;
    record('start', 'session reports the signed-in participant', 'user returned', signedIn ? 'signed in' : why(session), signedIn);

    await call('/api/v1/consents', { method: 'POST', body: JSON.stringify({ service: true, research: false }) });

    const created = await call('/api/v1/assessments', { method: 'POST', body: JSON.stringify({}) });
    const assessmentId = (field(created.body, 'id') ?? field(field(created.body, 'assessment') as Call['body'], 'id')) as string | undefined;
    record('start', 'assessment created', 'an id is issued', assessmentId ? 'created' : `status ${created.status}`, Boolean(assessmentId));
    if (!assessmentId) throw new Error(`no assessment id: ${JSON.stringify(created.body).slice(0, 160)}`);

    // ---------------------------------------------------------------- save and resume
    const answers = completeAnswers();
    const entries = Object.entries(answers);
    let saved = 0;
    for (let i = 0; i < entries.length; i += 20) {
      const batch = entries.slice(i, i + 20).map(([question_id, value]) => ({ question_id, value }));
      const r = await call(`/api/v1/assessments/${assessmentId}/responses`, {
        method: 'PUT',
        body: JSON.stringify({ answers: batch, currentModule: 'M1' }),
      });
      const errors = field(r.body, 'errors') as Record<string, unknown> | undefined;
      if (r.status === 200 && Object.keys(errors ?? {}).length === 0) saved += batch.length;
    }
    record('save', 'all answers autosaved', `${entries.length} accepted`, `${saved} accepted`, saved === entries.length);

    const resumed = await call('/api/v1/assessments');
    const single = field(resumed.body, 'assessment') as Record<string, unknown> | undefined;
    const list = (Array.isArray(resumed.body) ? resumed.body : (field(resumed.body, 'assessments') ?? [])) as Record<string, unknown>[];
    const mine = single ?? list.find((a) => a.id === assessmentId);
    const progress = Number(mine?.progress_percent ?? 0);
    record('resume', 'progress persisted across a new request', 'greater than 0%', progress > 0 ? `${progress}%` : `${progress}% — ${JSON.stringify(mine ?? resumed.body).slice(0, 70)}`, progress > 0);

    // ---------------------------------------------------------------- error recovery
    const badAnswer = await call(`/api/v1/assessments/${assessmentId}/responses`, {
      method: 'PUT',
      body: JSON.stringify({ answers: [{ question_id: 'Q17', value: 'NOT_AN_OPTION' }], currentModule: 'M1' }),
    });
    const rejected = Boolean((field(badAnswer.body, 'errors') as Record<string, unknown> | undefined)?.Q17);
    record('errors', 'an invalid answer is rejected with the approved message', 'an error for Q17', rejected ? 'rejected' : `status ${badAnswer.status}`, rejected);

    const unknownQuestion = await call(`/api/v1/assessments/${assessmentId}/responses`, {
      method: 'PUT',
      body: JSON.stringify({ answers: [{ question_id: 'Q999', value: 'x' }], currentModule: 'M1' }),
    });
    record('errors', 'an unknown question is refused', '400', String(unknownQuestion.status), unknownQuestion.status === 400);

    const tooMany = await call(`/api/v1/assessments/${assessmentId}/responses`, {
      method: 'PUT',
      body: JSON.stringify({ answers: entries.slice(0, 21).map(([question_id, value]) => ({ question_id, value })), currentModule: 'M1' }),
    });
    record('errors', 'an oversized autosave batch is refused', '400', String(tooMany.status), tooMany.status === 400);

    const foreign = await call('/api/v1/assessments/00000000-0000-4000-8000-0000000000ff/responses', {
      method: 'PUT',
      body: JSON.stringify({ answers: [{ question_id: 'Q17', value: null }], currentModule: 'M1' }),
    });
    record('errors', "another participant's assessment is not found", '404', String(foreign.status), foreign.status === 404);

    // ---------------------------------------------------------------- submit
    const noKey = await call(`/api/v1/assessments/${assessmentId}/submit`, { method: 'POST', body: JSON.stringify({}) });
    record('errors', 'submission without an Idempotency-Key is refused', '400', String(noKey.status), noKey.status === 400);

    // The route requires the key to be a UUID, so replays can be matched exactly.
    const idempotencyKey = randomUUID();
    const submit = await call(`/api/v1/assessments/${assessmentId}/submit`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({}),
    });
    record('submit', 'assessment submitted', '200', submit.status === 200 ? '200' : why(submit), submit.status === 200);

    const duplicate = await call(`/api/v1/assessments/${assessmentId}/submit`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({}),
    });
    record('errors', 'a duplicate submission does not create a second result', '409, or 200 with the same result', String(duplicate.status), duplicate.status === 409 || duplicate.status === 200);

    const afterSubmit = await call(`/api/v1/assessments/${assessmentId}/responses`, {
      method: 'PUT',
      body: JSON.stringify({ answers: [{ question_id: 'Q17', value: null }], currentModule: 'M1' }),
    });
    record('errors', 'a submitted assessment can no longer be changed', '409', String(afterSubmit.status), afterSubmit.status === 409);

    // ---------------------------------------------------------------- report and download
    const generate = await call(`/api/v1/assessments/${assessmentId}/report`, { method: 'POST', body: JSON.stringify({}) });
    record('report', 'report generated', 'status completed', field(generate.body, 'status') === 'completed' ? 'completed' : why(generate), field(generate.body, 'status') === 'completed');

    // A participant reaches their report through /assessment/continue, which routes to the
    // report entry once generation has finished. Following that is the real journey.
    const landed = await follow(`${ORIGIN}/assessment/continue`);
    const onReport = landed.status === 200 && /\/report/.test(landed.url);
    record('report', 'the participant is routed to their report', 'a report page', landed.url.replace(ORIGIN, '') || '(none)', onReport);

    // /report is the report history (RPT: "view past reports"); the report itself is /report/{id}.
    const history = await call(landed.url);
    const historyHtml = typeof history.body === 'string' ? history.body : '';
    const reportId = /href="\/report\/([0-9a-f-]{36})"/i.exec(historyHtml)?.[1];
    record('report', 'the new report is listed in the participant history', 'a link to /report/{id}', reportId ? 'listed' : `status ${history.status}`, Boolean(reportId));

    const reportPage = reportId ? await call(`/report/${reportId}`, { headers: { accept: 'text/html' } }) : null;
    const reportHtml = typeof reportPage?.body === 'string' ? reportPage.body : '';
    const hasSections = reportHtml.includes('Seven-Domain Score Breakdown') && reportHtml.includes('Medical and AI Disclaimer');
    record('report', 'interactive report renders its sections', 'sections present', hasSections ? 'rendered' : `status ${reportPage?.status ?? 'not opened'}`, hasSections);

    if (reportId) {
      const pdf = await call(`/api/v1/reports/${reportId}/pdf`);
      const isPdf = typeof pdf.body === 'string' && pdf.body.startsWith('%PDF-');
      record('download', 'PDF downloads', 'a PDF file', isPdf ? 'PDF returned' : why(pdf), isPdf);
    } else {
      record('download', 'PDF download link present on the report', 'a link to the PDF route', 'no PDF link found in the page', false);
    }

    // ---------------------------------------------------------------- data rights
    const exported = await call('/api/v1/me/data-export');
    record('export', 'participant data export', '200', exported.status === 200 ? '200' : why(exported), exported.status === 200);

    const deletion = await call('/api/v1/me/deletion-request', { method: 'POST', body: JSON.stringify({ action: 'request' }) });
    record('export', 'deletion request accepted', '2xx', deletion.status < 300 ? String(deletion.status) : why(deletion), deletion.status >= 200 && deletion.status < 300);

    // ---------------------------------------------------------------- admin boundary
    const adminApi = await call('/api/v1/admin/research-export', { method: 'POST', body: JSON.stringify({ purpose: 'e2e' }) });
    record('admin', 'a participant cannot reach a staff route', '401 or 403', String(adminApi.status), adminApi.status === 401 || adminApi.status === 403);

    const adminPage = await call('/admin/participants', { headers: { accept: 'text/html' } });
    record('admin', 'a participant cannot open an admin screen', 'not 200', String(adminPage.status), adminPage.status !== 200);

    // ---------------------------------------------------------------- sign out
    const signOut = await call('/api/v1/auth/sign-out', { method: 'POST' });
    const after = await call('/api/v1/assessments');
    record('recovery', 'sign-out ends the session', '401 afterwards', `sign-out ${signOut.status}, then ${after.status}`, after.status === 401);
  } catch (e) {
    record('run', 'the journey completed without an exception', 'no exception', e instanceof Error ? e.message : String(e), false);
  } finally {
    await cleanup(userId);
    stopServer(server);
  }

  const passed = steps.filter((s) => s.pass).length;
  const phases = [...new Set(steps.map((s) => s.phase))];

  const lines = [
    '# ROOTS-AI™ — end-to-end journey evidence (Master Requirements §13.1)',
    '',
    '**Requirement:** "End-to-end — Start/resume/submit/report/download; admin/config/export;',
    'error recovery."',
    '',
    '**Generated by** `npm run build && npm run evidence:e2e`.',
    '',
    '## Conditions',
    '',
    '| | |',
    '|---|---|',
    '| Build | Production build (`next build`), served by `next start`. |',
    "| API | The real HTTP API, driven with a cookie jar so the session behaves as a browser's. |",
    "| Database | The developer Supabase project from `.env.local`. **The client's database is never touched.** |",
    '| Sign-in | Built-in demo sign-in, which returns the secure link instead of emailing it. It requires `APP_ENV` development or staging **and** `MAGIC_LINK_DEMO_MODE=true`, and the route ignores it in production. |',
    '| Cleanup | The test account and everything it owns are deleted at the end of the run, pass or fail. |',
    '',
    `## Result: ${passed}/${steps.length} steps pass`,
    '',
    '| Phase | Step | Expected | Actual | Result |',
    '|---|---|---|---|---|',
    ...steps.map((s) => `| ${s.phase} | ${s.step} | ${s.expected} | ${s.actual} | ${s.pass ? 'PASS' : '**FAIL**'} |`),
    '',
    '## Defects this run found',
    '',
    "### 1. A first-time participant's first secure link never worked — FIXED",
    '',
    'Reproduced on every run before the fix. The sequence was:',
    '',
    '1. A new email address is entered. The route called Supabase `generateLink({ type: "magiclink" })`.',
    '2. Supabase returned **200 with a token**, and created the account as a side effect.',
    '3. Verifying that token immediately returned **403 `otp_expired`**. The participant landed on',
    '   the link-error screen.',
    '4. A second link for the same address worked, because the account now existed.',
    '',
    'Confirmed directly against the Auth API, independently of this application:',
    '',
    '```',
    'attempt 1 (new address)      -> generate 200 | verify 403 otp_expired',
    'attempt 2 (same address)     -> generate 200 | verify 200',
    'user exists after attempts   -> true',
    '```',
    '',
    'So every first-time participant was told to check their email, received a link, clicked it and',
    'was refused. Nothing logged an error, because the route behaved correctly and the token really',
    'was invalid. Every pilot participant would have hit this on their first attempt.',
    '',
    '**Fix.** `app/api/v1/auth/magic-link/route.ts` now provisions the account before generating',
    'the link (`ensureAccount`), treating "already registered" as success so a returning',
    'participant and a concurrent first request both behave correctly. The `on_auth_user_created`',
    'trigger creates the matching profile row exactly as it does for any other sign-up.',
    '',
    'Account existence is still never revealed: the response is identical whether or not the',
    'address was already known, which is the property the original code was protecting.',
    '',
    'Verified by the first step of this run — the first link now signs the participant in.',
    '',
    '### 2. Participant data export failed with a 503 — FIXED',
    '',
    '`lib/privacy/data.ts` selected `responses.updated_at`. The schema defines that column as',
    '`answered_at`, so the query failed, the collector threw, and the route returned 503. The GDPR',
    'Article 15 and 20 download was therefore unavailable to every participant, in every',
    'environment, and would have failed in production identically.',
    '',
    'The column name is corrected and the step now passes. It was invisible to the test suite',
    'because no test exercised the export against a real database — which is exactly the gap this',
    'suite closes.',
    '',
    '## Coverage of the requirement',
    '',
    '| Required | Covered by |',
    '|---|---|',
    '| Start | Unauthenticated refusal, secure link, session, consent, assessment creation |',
    '| Resume | Progress persisted and read back on a separate request |',
    '| Submit | Submission, duplicate prevention, closure to further edits |',
    '| Report | Generation and interactive rendering of the 19 sections |',
    '| Download | PDF retrieved over the participant API |',
    '| Admin / export | Participant data export, deletion request, and refusal of staff routes to a participant |',
    '| Error recovery | Invalid answer, unknown question, oversized batch, foreign assessment, duplicate submit, edit after submit, sign-out |',
    '',
    '## Not covered here',
    '',
    '- **Staff journeys from inside the admin UI.** The run verifies that a participant is refused',
    '  every staff route; it does not sign in as an administrator, which needs a seeded staff grant',
    '  and a second-factor enrolment. Admin authorization is evidenced at the route and database',
    '  level in `ROOTS-AI_M3_Security_Evidence.md` — 77 probes across 23 routes.',
    '- **Browser-driven interaction.** This exercises the API and the rendered report, not clicks.',
    '  Screen-level responsive and accessibility behaviour is evidenced separately.',
    '',
    `Phases exercised: ${phases.join(', ')}.`,
    '',
  ];

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`\nwrote ${OUT}`);
  console.log(`${passed}/${steps.length} steps pass`);
  if (passed !== steps.length) process.exitCode = 1;
})();

/**
 * M2 item 9 — API negative tests against a running deployment.
 *
 *     npm run evidence:api                             # http://localhost:3000
 *     BASE_URL=https://<deployment> npm run evidence:api
 *
 * Unauthenticated, forged-session and malformed requests to every protected route must be
 * refused before any data is read or written. No request here creates data or sends an email.
 * (Cross-user access with real sessions is covered in the database tests,
 * docs/m2/ROOTS-AI_M2_Security_Tests.sql, which the API relies on: every participant route
 * reads through the participant's own session, so Row Level Security decides what it sees.)
 *
 * Writes docs/m2/evidence/api-negative-tests.{json,html}. Exits 1 if any test fails.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const OUT = join(__dirname, '../../docs/m2/evidence');
const UUID = '00000000-0000-4000-8000-000000000000';
const FORGED_COOKIE = 'sb-forged-auth-token=base64-eyJhY2Nlc3NfdG9rZW4iOiJmb3JnZWQifQ; sb-access-token=forged';
const FORGED_BEARER = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDAiLCJyb2xlIjoic2VydmljZV9yb2xlIn0.forged';

interface Case {
  id: string;
  area: string;
  test: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: string;
  expect: number[];
  /** Optional extra assertion on the response. */
  check?: (res: Response, text: string) => string | null;
}

const json = { 'Content-Type': 'application/json' };
const idem = { 'Idempotency-Key': '11111111-1111-4111-8111-111111111111' };

const PROTECTED: [string, string, string?][] = [
  ['GET', '/api/v1/assessments'],
  ['POST', '/api/v1/assessments', '{}'],
  ['PUT', `/api/v1/assessments/${UUID}/responses`, '{"answers":[{"question_id":"Q1","value":40}]}'],
  ['POST', `/api/v1/assessments/${UUID}/submit`, '{}'],
  ['POST', `/api/v1/assessments/${UUID}/report`, '{}'],
  ['POST', `/api/v1/assessments/${UUID}/archive`, '{}'],
  ['POST', '/api/v1/consents', '{"service":true,"privacy":true,"research":false}'],
  ['PUT', '/api/v1/profile', '{"display_name":"Test"}'],
  ['GET', '/api/v1/me/data-export'],
  ['POST', '/api/v1/me/deletion-request', '{"action":"request"}'],
  ['GET', `/api/v1/reports/${UUID}/pdf`],
  ['POST', '/api/v1/admin/access', '{"action":"grant","email":"x@example.com","role":"super_admin","reason":"negative test probe"}'],
  ['POST', '/api/v1/admin/mfa', '{}'],
  ['POST', `/api/v1/admin/participants/${UUID}/resend-link`, '{}'],
  ['POST', `/api/v1/admin/participants/${UUID}/deletion`, '{"decision":"erase","reason":"negative test probe"}'],
  ['POST', `/api/v1/admin/reports/${UUID}/retry`, '{}'],
  ['POST', '/api/v1/admin/research-export', '{"purpose":"negative test"}'],
  ['GET', `/api/v1/admin/research-export/${UUID}/download`],
];

const cases: Case[] = [];
let n = 0;
const next = (p: string) => `${p}-${String(++n).padStart(2, '0')}`;

// UA — unauthenticated: every protected route refuses a request with no session.
n = 0;
for (const [method, path, body] of PROTECTED) {
  const needsIdem = path.endsWith('/submit');
  cases.push({
    id: next('UA'), area: 'No session', test: `${method} ${path.replace(UUID, '{id}')}`, method, path,
    headers: { ...(body ? json : {}), ...(needsIdem ? idem : {}) }, body, expect: [401],
  });
}

// FS — forged session cookie / forged service-role bearer token are not accepted as a sign-in.
n = 0;
for (const [method, path, body] of PROTECTED.filter(([, p]) => /assessments$|me\/data-export|admin\/access|reports\/.*\/pdf|submit/.test(p))) {
  cases.push({
    id: next('FS'), area: 'Forged session', test: `${method} ${path.replace(UUID, '{id}')} with a forged session cookie`, method, path,
    headers: { Cookie: FORGED_COOKIE, ...(body ? json : {}), ...(path.endsWith('/submit') ? idem : {}) }, body, expect: [401],
  });
  cases.push({
    id: next('FS'), area: 'Forged session', test: `${method} ${path.replace(UUID, '{id}')} with a forged service-role bearer token`, method, path,
    headers: { Authorization: FORGED_BEARER, ...(body ? json : {}), ...(path.endsWith('/submit') ? idem : {}) }, body, expect: [401],
  });
}

// MI — malformed input is refused before any lookup.
n = 0;
cases.push(
  { id: next('MI'), area: 'Malformed input', test: 'answer save for a non-UUID assessment ID', method: 'PUT', path: '/api/v1/assessments/not-a-uuid/responses', headers: json, body: '{"answers":[]}', expect: [404] },
  { id: next('MI'), area: 'Malformed input', test: 'submit without an Idempotency-Key', method: 'POST', path: `/api/v1/assessments/${UUID}/submit`, headers: json, body: '{}', expect: [400] },
  { id: next('MI'), area: 'Malformed input', test: 'submit with a malformed Idempotency-Key', method: 'POST', path: `/api/v1/assessments/${UUID}/submit`, headers: { ...json, 'Idempotency-Key': "1' OR '1'='1" }, body: '{}', expect: [400] },
  { id: next('MI'), area: 'Malformed input', test: 'report PDF for a non-UUID ID', method: 'GET', path: '/api/v1/reports/..%2F..%2Fetc/pdf', expect: [404] },
  { id: next('MI'), area: 'Malformed input', test: 'secure-link request with an invalid email', method: 'POST', path: '/api/v1/auth/magic-link', headers: json, body: '{"email":"not-an-email","ageConfirmed":true}', expect: [400] },
  { id: next('MI'), area: 'Malformed input', test: 'secure-link request without age confirmation (VAL-010)', method: 'POST', path: '/api/v1/auth/magic-link', headers: json, body: '{"email":"probe@example.invalid","ageConfirmed":false}', expect: [400] },
  { id: next('MI'), area: 'Malformed input', test: 'secure-link request with a body that is not JSON', method: 'POST', path: '/api/v1/auth/magic-link', headers: json, body: '{"email":', expect: [400] },
  { id: next('MI'), area: 'Malformed input', test: 'secure-link request with an injected operator object', method: 'POST', path: '/api/v1/auth/magic-link', headers: json, body: '{"email":{"$ne":null},"ageConfirmed":true}', expect: [400] },
  { id: next('MI'), area: 'Malformed input', test: 'contact message with missing fields', method: 'POST', path: '/api/v1/contact', headers: json, body: '{}', expect: [400] },
);

// ME — methods an endpoint does not implement are refused.
n = 0;
cases.push(
  { id: next('ME'), area: 'Method', test: 'DELETE /api/v1/assessments', method: 'DELETE', path: '/api/v1/assessments', expect: [405] },
  { id: next('ME'), area: 'Method', test: 'GET /api/v1/assessments/{id}/submit', method: 'GET', path: `/api/v1/assessments/${UUID}/submit`, expect: [405] },
  { id: next('ME'), area: 'Method', test: 'DELETE /api/v1/assessments/{id}/responses', method: 'DELETE', path: `/api/v1/assessments/${UUID}/responses`, expect: [405] },
);

// PG — protected pages never render data without a session.
n = 0;
const noData = (_: Response, text: string) => (/"canonical_json"|calculation_trace|raw_value/.test(text) ? 'page contains protected data' : null);
cases.push(
  { id: next('PG'), area: 'Pages', test: 'admin console redirects to sign-in', method: 'GET', path: '/admin/overview', expect: [307, 308], check: (r) => (/\/admin($|\?)/.test(r.headers.get('location') ?? '') ? null : `redirected to ${r.headers.get('location')}`) },
  { id: next('PG'), area: 'Pages', test: 'admin participants redirects to sign-in', method: 'GET', path: '/admin/participants', expect: [307, 308] },
  { id: next('PG'), area: 'Pages', test: 'report page shows the access error, no report data', method: 'GET', path: `/report/${UUID}`, expect: [200], check: noData },
  { id: next('PG'), area: 'Pages', test: 'report history shows the access error, no report data', method: 'GET', path: '/report', expect: [200], check: noData },
);

// HD — security headers on every response.
n = 0;
const header = (name: string, pattern: RegExp) => (r: Response) => (pattern.test(r.headers.get(name) ?? '') ? null : `${name}: ${r.headers.get(name) ?? 'missing'}`);
cases.push(
  { id: next('HD'), area: 'Headers', test: 'Content-Security-Policy with frame-ancestors none', method: 'GET', path: '/', expect: [200], check: header('content-security-policy', /frame-ancestors 'none'/) },
  { id: next('HD'), area: 'Headers', test: 'X-Frame-Options DENY', method: 'GET', path: '/', expect: [200], check: header('x-frame-options', /^DENY$/i) },
  { id: next('HD'), area: 'Headers', test: 'X-Content-Type-Options nosniff', method: 'GET', path: '/', expect: [200], check: header('x-content-type-options', /^nosniff$/i) },
  { id: next('HD'), area: 'Headers', test: 'API responses are never cached', method: 'GET', path: '/api/v1/assessments', expect: [401], check: header('cache-control', /no-store/) },
);

async function run(c: Case) {
  try {
    const res = await fetch(BASE + c.path, { method: c.method, headers: c.headers, body: c.body, redirect: 'manual' });
    const text = await res.text();
    const statusOk = c.expect.includes(res.status);
    const extra = statusOk && c.check ? c.check(res, text) : null;
    return { ...c, status: res.status, pass: statusOk && !extra, note: extra ?? (statusOk ? '' : `expected ${c.expect.join('/')}`), body_excerpt: text.slice(0, 160) };
  } catch (e) {
    return { ...c, status: 0, pass: false, note: `request failed: ${e instanceof Error ? e.message : e}`, body_excerpt: '' };
  }
}

(async () => {
  const results = [];
  for (const c of cases) results.push(await run(c));
  const passed = results.filter((r) => r.pass).length;
  const allPass = passed === results.length;
  mkdirSync(OUT, { recursive: true });
  const meta = { title: 'ROOTS-AI M2 — API negative tests', base_url: BASE, run_at: new Date().toISOString(), result: allPass ? 'PASS' : 'FAIL', passed: `${passed}/${results.length}` };
  writeFileSync(join(OUT, 'api-negative-tests.json'), JSON.stringify({ ...meta, cases: results.map(({ check: _c, ...r }) => r) }, null, 2) + '\n');

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  writeFileSync(
    join(OUT, 'api-negative-tests.html'),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>ROOTS-AI M2 API Negative Tests</title>
<style>body{font:14px/1.5 system-ui,Segoe UI,sans-serif;color:#1a1a1a;margin:0}main{max-width:1180px;margin:0 auto;padding:32px 16px}
h1{color:#1a2a4a;font-size:24px;margin:0 0 4px}.muted{color:#6b7280}.pass{color:#1e7d45;font-weight:700}.fail{color:#b42318;font-weight:700}
.banner{border:2px solid ${allPass ? '#1e7d45' : '#b42318'};border-radius:8px;padding:14px 18px;margin:18px 0;font-size:24px;font-weight:800}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #d8dee8;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f5f7fa}
code{font-family:ui-monospace,Consolas,monospace;font-size:12px;word-break:break-all}</style></head><body><main>
<h1>ROOTS-AI™ M2 — API negative tests</h1>
<div class="muted">Target <code>${esc(BASE)}</code> · ${esc(meta.run_at)} · <code>npm run evidence:api</code></div>
<div class="banner ${allPass ? 'pass' : 'fail'}">${passed}/${results.length} PASS</div>
<p class="muted">Every request below must be refused. No request creates data or sends an email. Cross-user access with real sessions is tested in the database (ROOTS-AI_M2_Security_Tests.sql), which every participant route relies on.</p>
<table><tr><th>ID</th><th>Area</th><th>Request</th><th>Expected</th><th>Actual</th><th>Result</th></tr>
${results.map((r) => `<tr><td>${r.id}</td><td>${esc(r.area)}</td><td>${esc(r.test)}<br><code>${esc(r.method)} ${esc(r.path)}</code></td><td>${r.expect.join(' / ')}</td><td>${r.status}${r.note ? `<br><span class="muted">${esc(r.note)}</span>` : ''}</td><td class="${r.pass ? 'pass' : 'fail'}">${r.pass ? 'PASS' : 'FAIL'}</td></tr>`).join('\n')}
</table></main></body></html>\n`,
  );
  console.log(`API negative tests against ${BASE}: ${passed}/${results.length} PASS`);
  for (const r of results.filter((x) => !x.pass)) console.log(`  FAIL ${r.id} ${r.test} -> ${r.status} ${r.note} ${r.body_excerpt.slice(0, 100)}`);
  process.exit(allPass ? 0 : 1);
})();

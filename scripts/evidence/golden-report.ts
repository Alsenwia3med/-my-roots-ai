/**
 * M2 item 8 — Golden Test evidence report.
 *
 *     npm run evidence:golden
 *
 * Runs all 30 canonical Golden Tests from C-02 v1.0.1 CORRECTED through the production scoring
 * engine and writes, for every case: Test ID -> Input -> Expected Output -> Actual Output ->
 * PASS/FAIL, with a field-by-field comparison.
 *
 *   docs/m2/evidence/golden-tests.html   readable report (print to PDF for the package)
 *   docs/m2/evidence/golden-tests.csv    one row per case
 *   docs/m2/evidence/golden-tests.json   machine-readable, for independent re-checking
 *
 * The comparison is the same as tests/scoring/golden.test.ts: exact deep equality of the eight
 * canonical output fields, no tolerance. Supplementary check (outside the canonical expected
 * JSON, which does not list classifications): every domain / confidence / recovery
 * classification the engine returns is compared with an independent lookup in the workbook's
 * Classifications sheet. Exits with code 1 if anything fails.
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { join } from 'node:path';
import golden from '../../lib/scoring/c02-golden-tests.json';
import ruleset from '../../lib/scoring/c02-ruleset.json';
import { computeScores, type NormalizedInput, type ScoringResult } from '../../lib/scoring/engine';
import { C01_SOURCE, C02_SOURCE } from '../../lib/versions';

const ROOT = join(__dirname, '../..');
const OUT = join(ROOT, 'docs/m2/evidence');

const FIELDS = ['domains', 'coverage', 'biological_state', 'opportunity', 'recovery_potential', 'protective_count', 'confidence', 'drivers'] as const;
type Field = (typeof FIELDS)[number];

// ------------------------------------------------------------------ provenance
const sha = (rel: string) => createHash('sha256').update(readFileSync(join(ROOT, rel))).digest('hex');
const ENGINE_FILES = ['lib/scoring/engine.ts', 'lib/scoring/c02-ruleset.ts', 'lib/scoring/c02-ruleset.json', 'lib/scoring/c02-golden-tests.json'];
const engineFingerprint = createHash('sha256').update(ENGINE_FILES.map(sha).join('')).digest('hex');
let commit = 'not yet committed — record the ROOTS GitHub commit this report is run from';
try {
  // Only a commit that actually contains the engine counts (the app may sit inside another repo).
  execSync('git ls-files --error-unmatch lib/scoring/engine.ts', { cwd: ROOT, stdio: 'ignore' });
  commit = execSync('git rev-parse HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  const dirty = execSync('git status --porcelain -- lib/scoring scripts/evidence', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  if (dirty) commit += ' (with uncommitted changes to the scoring code)';
} catch {
  /* not a git checkout of this code */
}

// ------------------------------------------------------------------ independent classification lookup
function band(scale: string, value: number | null): string | null {
  if (value === null) return null;
  const row = ruleset.classifications.find((c) => c.scale === scale && value >= c.minimum && value <= c.maximum);
  return row?.label ?? null;
}

function classificationCheck(r: ScoringResult) {
  const rows: { item: string; value: number | null; expected: string | null; actual: string | null; ok: boolean }[] = [];
  for (const [d, score] of Object.entries(r.domains)) {
    const actual = r.classifications.domains[d as keyof typeof r.domains]?.label ?? null;
    const expected = band('DOMAIN', score);
    rows.push({ item: d, value: score, expected, actual, ok: expected === actual });
  }
  const conf = r.classifications.confidence?.label ?? null;
  rows.push({ item: 'Confidence', value: r.confidence, expected: band('CONFIDENCE', r.confidence), actual: conf, ok: band('CONFIDENCE', r.confidence) === conf });
  const rec = r.classifications.recovery?.label ?? null;
  const recValue = r.recovery_potential === null ? null : Math.round(r.recovery_potential * 10) / 10;
  // Recovery bands are integer bounds; a one-decimal value sits in the band whose floor it has passed.
  const recBand = recValue === null ? null : ruleset.classifications.find((c) => c.scale === 'RECOVERY' && recValue >= c.minimum && recValue < c.maximum + 1)?.label ?? null;
  rows.push({ item: 'Recovery', value: r.recovery_potential, expected: recBand, actual: rec, ok: recBand === rec });
  return rows;
}

// ------------------------------------------------------------------ run
const results = golden.cases.map((c) => {
  const r = computeScores(c.input as unknown as NormalizedInput);
  const expected = c.expected as Record<Field, unknown>;
  // Same values; object keys listed in the workbook's order so the two columns read side by side
  // (key order has no meaning and is ignored by the comparison).
  const inExpectedOrder = (v: unknown, e: unknown) =>
    v && e && typeof v === 'object' && typeof e === 'object' && !Array.isArray(v)
      ? Object.fromEntries([...Object.keys(e as object), ...Object.keys(v as object).filter((k) => !(k in (e as object)))].filter((k) => k in (v as object)).map((k) => [k, (v as Record<string, unknown>)[k]]))
      : v;
  const actual = Object.fromEntries(FIELDS.map((f) => [f, inExpectedOrder(r[f], expected[f])])) as Record<Field, unknown>;
  const fields = FIELDS.map((f) => ({ field: f, expected: expected[f], actual: actual[f], ok: isDeepStrictEqual(expected[f], actual[f]) }));
  const pass = isDeepStrictEqual(actual, expected);
  const classes = classificationCheck(r);
  return { test_id: c.test_id, purpose: c.purpose, input: c.input, expected, actual, pass, fields, classifications: classes, classificationsPass: classes.every((x) => x.ok) };
});

const passed = results.filter((r) => r.pass).length;
const classPassed = results.filter((r) => r.classificationsPass).length;
const allPass = passed === results.length && classPassed === results.length && results.length === 30;
const runAt = new Date().toISOString();

// ------------------------------------------------------------------ outputs
mkdirSync(OUT, { recursive: true });

const meta = {
  title: 'ROOTS-AI M2 — C-02 Golden Test Evidence',
  run_at: runAt,
  result: allPass ? 'PASS' : 'FAIL',
  canonical_pass: `${passed}/${results.length}`,
  classification_check_pass: `${classPassed}/${results.length}`,
  sources: { c01: C01_SOURCE, c02: C02_SOURCE },
  scoring_version: golden.scoring_version,
  golden_source: golden.source,
  engine_files: ENGINE_FILES,
  engine_fingerprint_sha256: engineFingerprint,
  commit,
  node: process.version,
  reproduce: ['npm ci', 'npm run evidence:golden', 'npm run test:scoring'],
};

writeFileSync(join(OUT, 'golden-tests.json'), JSON.stringify({ ...meta, cases: results }, null, 2) + '\n');

const csvCell = (v: unknown) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
writeFileSync(
  join(OUT, 'golden-tests.csv'),
  [
    ['test_id', 'purpose', 'input_json', 'expected_output_json', 'actual_output_json', 'result', 'mismatched_fields', 'classification_check'].join(','),
    ...results.map((r) =>
      [r.test_id, r.purpose, r.input, r.expected, r.actual, r.pass ? 'PASS' : 'FAIL', r.fields.filter((f) => !f.ok).map((f) => f.field).join(' '), r.classificationsPass ? 'PASS' : 'FAIL']
        .map(csvCell)
        .join(','),
    ),
  ].join('\r\n') + '\r\n',
);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const j = (v: unknown) => esc(JSON.stringify(v));
const DOMAIN_ITEMS: Record<string, string[]> = {};
for (const m of ruleset.question_mapping) (DOMAIN_ITEMS[m.domain_id] ??= []).push(m.question_id);

function inputHtml(input: Record<string, unknown>) {
  const context = ['age', 'diseaseCount', 'medicationCount', 'P1', 'P2', 'P3', 'P4', 'P5', 'answerConfidence'];
  const ctx = context.map((k) => `<span class="kv"><b>${k}</b> ${j(input[k])}</span>`).join('');
  const domains = Object.entries(DOMAIN_ITEMS)
    .map(([d, qs]) => `<tr><th>${d}</th><td>${qs.map((q) => `<span class="q${input[q] === null ? ' na' : ''}">${q}=${input[q] === null ? 'null' : input[q]}</span>`).join('')}</td></tr>`)
    .join('');
  return `<div class="ctx">${ctx}</div><table class="inp">${domains}</table>`;
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>ROOTS-AI M2 Golden Test Evidence</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{--ink:#1a1a1a;--navy:#1a2a4a;--muted:#6b7280;--line:#d8dee8;--pass:#1e7d45;--fail:#b42318;--bg:#fff;--soft:#f5f7fa}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:1180px;margin:0 auto;padding:32px 16px}
h1{color:var(--navy);font-size:24px;margin:0 0 4px}h2{color:var(--navy);font-size:18px;margin:32px 0 12px}
.muted{color:var(--muted)}.pass{color:var(--pass);font-weight:700}.fail{color:var(--fail);font-weight:700}
.banner{border:2px solid var(--pass);border-radius:8px;padding:16px 20px;margin:20px 0;display:flex;gap:32px;flex-wrap:wrap;align-items:center}
.banner.bad{border-color:var(--fail)}.big{font-size:28px;font-weight:800}
table{border-collapse:collapse;width:100%}th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
th{background:var(--soft);font-weight:600}
.meta td:first-child{width:260px;font-weight:600;background:var(--soft)}
code,.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-all}
.case{border:1px solid var(--line);border-radius:8px;margin:18px 0;page-break-inside:avoid}
.case>header{display:flex;justify-content:space-between;gap:12px;padding:10px 14px;background:var(--soft);border-bottom:1px solid var(--line);border-radius:8px 8px 0 0}
.case .body{padding:12px 14px}.ctx{display:flex;flex-wrap:wrap;gap:6px 14px;margin-bottom:8px}.kv{font-family:ui-monospace,Consolas,monospace;font-size:12px}
.inp th{width:48px}.q{display:inline-block;font-family:ui-monospace,Consolas,monospace;font-size:12px;margin:0 10px 2px 0}.q.na{color:var(--fail)}
.cmp td:first-child{width:150px;font-weight:600}.cmp td{font-family:ui-monospace,Consolas,monospace;font-size:12px}
.lbl{font-weight:600;margin:12px 0 6px}
@media print{main{padding:0}.case{break-inside:avoid}}
</style></head><body><main>
<h1>ROOTS-AI™ M2 — C-02 Golden Test Evidence</h1>
<div class="muted">Generated ${esc(runAt)} by <code>npm run evidence:golden</code></div>

<div class="banner${allPass ? '' : ' bad'}">
  <div><div class="muted">Canonical Golden Tests</div><div class="big ${passed === 30 ? 'pass' : 'fail'}">${passed}/${results.length} PASS</div></div>
  <div><div class="muted">Classification check (supplementary)</div><div class="big ${classPassed === 30 ? 'pass' : 'fail'}">${classPassed}/${results.length} PASS</div></div>
  <div><div class="muted">Overall</div><div class="big ${allPass ? 'pass' : 'fail'}">${allPass ? 'PASS' : 'FAIL'}</div></div>
</div>

<h2>Provenance</h2>
<table class="meta">
<tr><td>Scoring rules and golden cases</td><td>${esc(C02_SOURCE.label)} — <code>${esc(C02_SOURCE.document)}</code><br>SHA-256 <code>${C02_SOURCE.sha256}</code></td></tr>
<tr><td>Question bank</td><td>${esc(C01_SOURCE.label)} — <code>${esc(C01_SOURCE.document)}</code><br>SHA-256 <code>${C01_SOURCE.sha256}</code></td></tr>
<tr><td>Versions</td><td>scoring_version <b>${esc(golden.scoring_version)}</b> · questionnaire_version <b>${esc(C01_SOURCE.questionnaire_version)}</b> · dataset ${esc(C02_SOURCE.dataset_id)}</td></tr>
<tr><td>Engine under test</td><td><code>${ENGINE_FILES.join(', ')}</code><br>combined SHA-256 <code>${engineFingerprint}</code></td></tr>
<tr><td>Commit</td><td><code>${esc(commit)}</code></td></tr>
<tr><td>Runtime</td><td>Node ${esc(process.version)}</td></tr>
<tr><td>Comparison rule</td><td>Exact deep equality of the eight canonical output fields (${FIELDS.join(', ')}); no tolerance. Inputs are the normalized burden points from the workbook; <code>null</code> = N/A or missing.</td></tr>
<tr><td>Classification band rule</td><td>Bands are inclusive whole-number ranges (Classifications sheet). A one-decimal Recovery Potential takes the highest band whose minimum it has reached (e.g. 74.5 → Moderate, 75.0 → High). Integer scores are unaffected.</td></tr>
<tr><td>Reproduce</td><td><code>npm ci</code> → <code>npm run evidence:golden</code> (this report) · <code>npm run test:scoring</code> (the same cases as automated tests)</td></tr>
</table>

<h2>Summary</h2>
<table>
<tr><th>Test ID</th><th>Purpose</th><th>Drivers (actual)</th><th>Canonical result</th><th>Classification check</th></tr>
${results
  .map((r) => `<tr><td><a href="#${r.test_id}">${r.test_id}</a></td><td>${esc(r.purpose)}</td><td class="mono">${j(r.actual.drivers)}</td><td class="${r.pass ? 'pass' : 'fail'}">${r.pass ? 'PASS' : 'FAIL'}</td><td class="${r.classificationsPass ? 'pass' : 'fail'}">${r.classificationsPass ? 'PASS' : 'FAIL'}</td></tr>`)
  .join('\n')}
</table>

<h2>Cases — Test ID → Input → Expected Output → Actual Output → PASS/FAIL</h2>
${results
  .map(
    (r) => `<section class="case" id="${r.test_id}">
<header><div><b>${r.test_id}</b> — ${esc(r.purpose)}</div><div class="${r.pass ? 'pass' : 'fail'}">${r.pass ? 'PASS' : 'FAIL'}</div></header>
<div class="body">
<div class="lbl">Input</div>${inputHtml(r.input as Record<string, unknown>)}
<div class="lbl">Expected output (workbook) vs actual output (engine)</div>
<table class="cmp"><tr><th>Field</th><th>Expected</th><th>Actual</th><th>Match</th></tr>
${r.fields.map((f) => `<tr><td>${f.field}</td><td>${j(f.expected)}</td><td>${j(f.actual)}</td><td class="${f.ok ? 'pass' : 'fail'}">${f.ok ? '✓' : '✗'}</td></tr>`).join('')}
</table>
<div class="lbl">Classification check (supplementary — against the Classifications sheet)</div>
<table class="cmp"><tr><th>Item</th><th>Value</th><th>Expected label</th><th>Actual label</th><th>Match</th></tr>
${r.classifications.map((c) => `<tr><td>${c.item}</td><td>${j(c.value)}</td><td>${j(c.expected)}</td><td>${j(c.actual)}</td><td class="${c.ok ? 'pass' : 'fail'}">${c.ok ? '✓' : '✗'}</td></tr>`).join('')}
</table>
<div class="lbl">Full JSON</div>
<table class="cmp"><tr><td>Input</td><td>${j(r.input)}</td></tr><tr><td>Expected</td><td>${j(r.expected)}</td></tr><tr><td>Actual</td><td>${j(r.actual)}</td></tr></table>
</div></section>`,
  )
  .join('\n')}
</main></body></html>
`;
writeFileSync(join(OUT, 'golden-tests.html'), html);

console.log(`Golden Tests: ${passed}/${results.length} PASS · classification check ${classPassed}/${results.length} · overall ${allPass ? 'PASS' : 'FAIL'}`);
for (const r of results.filter((x) => !x.pass || !x.classificationsPass)) {
  console.log(`  ${r.test_id} FAIL: ${r.fields.filter((f) => !f.ok).map((f) => f.field).join(', ')} ${r.classifications.filter((c) => !c.ok).map((c) => c.item).join(', ')}`);
}
console.log('wrote docs/m2/evidence/golden-tests.{html,csv,json}');
process.exit(allPass ? 0 : 1);

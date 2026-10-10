/**
 * Server PDF, research-export rules and time-limited staff access.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { PDFDocument } from 'pdf-lib';
import { grantIsLive } from '../../lib/admin/roles';
import { applyNarrative } from '../../lib/ai/apply';
import { NO_NARRATIVE } from '../../lib/ai/provenance';
import { buildReport } from '../../lib/report/build';
import { headlineMetrics } from '../../lib/report/metrics';
import { renderReportPdf, toPdfText } from '../../lib/report/pdf';
import { EXPORT_FIELD_KEYS, MIN_CELL_SIZE, normalizeFields, riskCheck, toCsv } from '../../lib/research/fields';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';
import golden from '../../lib/scoring/c02-golden-tests.json';

// A stored report: deterministic, with the narrative decision recorded against it (AI-06).
const sampleReport = () =>
  applyNarrative(
    buildReport({
      reportId: 'RPT-20260922-TESTTEST',
      generatedAt: '2026-09-22T10:00:00.000Z',
      participantDisplay: 'José Álvarez',
      questionnaireVersion: '1.0.0',
      auditTraceReference: 'scores/test',
      scoring: computeScores(golden.cases[0].input as unknown as NormalizedInput),
      protective: { P1: true, P2: false, P3: true, P4: false, P5: true },
      answers: {},
    }),
    { narrative: null, provenance: NO_NARRATIVE },
  );

// ---------------------------------------------------------------- PDF

test('the PDF is a valid multi-page document with the report metadata', async () => {
  const bytes = await renderReportPdf(sampleReport());
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), '%PDF-');
  const doc = await PDFDocument.load(bytes);
  assert.ok(doc.getPageCount() >= 3, `expected several pages, got ${doc.getPageCount()}`);
  assert.match(doc.getTitle() ?? '', /RPT-20260922-TESTTEST/);
});

test('the PDF is rendered from the report as stored: same input, same pages', async () => {
  const a = await PDFDocument.load(await renderReportPdf(sampleReport()));
  const b = await PDFDocument.load(await renderReportPdf(sampleReport()));
  assert.equal(a.getPageCount(), b.getPageCount());
});

test('text the PDF fonts cannot show is spelled out or replaced, never fatal', () => {
  const supported = new Set([...'abc >=-?'].map((c) => c.codePointAt(0)!));
  assert.equal(toPdfText('a ≥ b', supported), 'a >= b');
  assert.equal(toPdfText('a → c', supported), 'a -> c');
  assert.equal(toPdfText('a 漢 b', supported), 'a ? b');
});

// ---------------------------------------------------------------- research export

test('only allow-listed fields can be exported, and research_id is always included', () => {
  assert.deepEqual(normalizeFields(['mr_score', 'email', 'profile_id']), ['research_id', 'mr_score']);
  assert.deepEqual(normalizeFields(undefined), [...EXPORT_FIELD_KEYS]);
  assert.deepEqual(normalizeFields([]), ['research_id']);
});

test('no allow-listed field is a direct identifier', () => {
  assert.equal(riskCheck(MIN_CELL_SIZE, EXPORT_FIELD_KEYS).directIdentifiers.ok, true);
  assert.equal(riskCheck(MIN_CELL_SIZE, ['research_id', 'email']).directIdentifiers.ok, false);
});

test('small cohorts are refused by the cell-size check', () => {
  assert.equal(riskCheck(MIN_CELL_SIZE - 1, ['research_id']).ok, false);
  assert.equal(riskCheck(MIN_CELL_SIZE, ['research_id']).ok, true);
});

test('CSV cells are quoted and protected against spreadsheet formula injection', () => {
  const csv = toCsv(['research_id', 'primary_driver'], [{ research_id: 'R-1', primary_driver: '=HYPERLINK("x")' }, { research_id: 'R-2', primary_driver: 'A, B' }]);
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
  assert.ok(csv.includes('"A, B"'));
  assert.ok(toCsv(['research_id', 'mr_score'], [{ research_id: 'R-3', mr_score: -5 }]).includes('R-3,-5'));
});

test('the export never selects identity columns from the database', () => {
  const src = readFileSync(join(__dirname, '../../lib/research/export.ts'), 'utf8');
  assert.ok(!/select\([^)]*\b(email|display_name|raw_value|calculation_trace|canonical_json)\b/.test(src));
});

// ---------------------------------------------------------------- access expiry

test('a staff grant stops counting when it is revoked or expires', () => {
  const now = Date.parse('2026-09-22T12:00:00Z');
  assert.equal(grantIsLive({ expires_at: null, revoked_at: null }, now), true);
  assert.equal(grantIsLive({ expires_at: '2026-09-23T00:00:00Z', revoked_at: null }, now), true);
  assert.equal(grantIsLive({ expires_at: '2026-09-22T11:59:59Z', revoked_at: null }, now), false);
  assert.equal(grantIsLive({ expires_at: null, revoked_at: '2026-09-01T00:00:00Z' }, now), false);
});

test('the database role check also honours expiry', () => {
  const sql = readFileSync(join(__dirname, '../../supabase/roots_ai_setup.sql'), 'utf8');
  assert.ok(sql.includes('AND (ra.expires_at IS NULL OR ra.expires_at > now())'));
});

// ---------------------------------------------------------------- null states (C-03 RPT-02)

test('a score that could not be calculated shows approved copy, never "— /100"', () => {
  // GT-020 is the C-02 golden case whose Recovery Potential is null.
  const gt020 = golden.cases.find((c) => c.test_id === 'GT-020')!;
  const scoring = computeScores(gt020.input as unknown as NormalizedInput);
  assert.equal(scoring.recovery_potential, null, 'GT-020 must have a null Recovery Potential');

  const recovery = headlineMetrics(scoring2report(scoring)).find((m) => m.label === 'Recovery Potential')!;
  assert.equal(recovery.value, 'Not enough information');
  assert.equal(recovery.note, '', 'no denominator may follow an uncalculable score');
  assert.equal(recovery.unavailable, true);
});

test('the web report and the PDF take their cover figures from one function (C-03 web/PDF parity)', () => {
  const scoring = computeScores(golden.cases[0].input as unknown as NormalizedInput);
  const metrics = headlineMetrics(scoring2report(scoring));

  assert.deepEqual(
    metrics.map((m) => m.label),
    ['Biological State', 'Opportunity', 'Recovery Potential', 'Confidence'],
  );
  // C-02: Opportunity and Recovery Potential retain one decimal; Biological State is an integer.
  const opportunity = metrics.find((m) => m.label === 'Opportunity')!;
  if (!opportunity.unavailable) assert.match(opportunity.value, /^\d+\.\d$/);
  const state = metrics.find((m) => m.label === 'Biological State')!;
  if (!state.unavailable) assert.match(state.value, /^\d+$/);
});

/** The four fields headlineMetrics reads, taken straight from a scoring result. */
function scoring2report(scoring: ReturnType<typeof computeScores>) {
  return {
    biological_state: scoring.biological_state,
    opportunity_score: scoring.opportunity,
    recovery_potential: scoring.recovery_potential,
    confidence: { score: scoring.confidence, label: scoring.classifications.confidence.label },
  };
}

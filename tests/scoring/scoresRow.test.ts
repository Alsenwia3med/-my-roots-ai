/**
 * Engine result -> public.scores row, and the contract between that row and the schema.
 *
 * The schema-contract tests read supabase/roots_ai_setup.sql directly, so a column renamed in
 * one place but not the other, or a label the CHECK constraint would reject, fails here rather
 * than as an insert error after a participant submits.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { CLASSIFICATIONS } from '../../lib/scoring/c02-ruleset';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';
import { toScoresRow } from '../../lib/scoring/scoresRow';
import golden from '../../lib/scoring/c02-golden-tests.json';

const setupSql = readFileSync(join(__dirname, '../../supabase/roots_ai_setup.sql'), 'utf8');
const scoresTable = setupSql.match(/CREATE TABLE public\.scores \(([\s\S]*?)\n\);/)![1];
const scoresColumns = new Set(
  scoresTable
    .split('\n')
    .map((line) => line.trim().match(/^([a-z_]+)\s+[A-Z]/)?.[1])
    .filter((c): c is string => Boolean(c)),
);
const confidenceCheck = scoresTable.match(/confidence_label IN \(([^)]*)\)/)![1].match(/'([^']+)'/g)!.map((s) => s.slice(1, -1));

const scored = (id: string) => {
  const c = golden.cases.find((x) => x.test_id === id)!;
  return computeScores(c.input as unknown as NormalizedInput);
};

test('GT-030 maps to the expected columns', () => {
  const row = toScoresRow('00000000-0000-0000-0000-000000000030', scored('GT-030'), {});
  assert.equal(row.mr_score, 75);
  assert.equal(row.sr_score, 25);
  assert.equal(row.hs_score, 100);
  assert.equal(row.sl_score, 100);
  assert.equal(row.ib_score, 75);
  assert.equal(row.ch_score, 50);
  assert.equal(row.bs_score, 100);
  assert.equal(row.biological_state, 75);
  assert.equal(row.opportunity_score, 62.5);
  assert.equal(row.recovery_potential, 73.5);
  assert.equal(row.confidence, 93);
  assert.equal(row.confidence_label, 'High');
  // DRV-003 v1.0.1: the pair once, then the next distinct eligible domain; no duplicate SL.
  assert.equal(row.primary_driver, 'HS+SL co-primary');
  assert.equal(row.secondary_driver, 'BS');
  assert.equal(row.tertiary_driver, null);
  assert.equal(row.scoring_version, '1.0.1');
  assert.equal(row.dataset_id, 'ROOTS-C02-SCORING-001');
});

test('no dominant burden stores no drivers (GT-022)', () => {
  const row = toScoresRow('00000000-0000-0000-0000-000000000022', scored('GT-022'), {});
  assert.equal(row.primary_driver, null);
  assert.equal(row.secondary_driver, null);
  assert.equal(row.tertiary_driver, null);
  assert.deepEqual(row.drivers_json, []);
});

test('the trace carries the raw option IDs (C-02 SC-001 audit fields)', () => {
  const row = toScoresRow('00000000-0000-0000-0000-000000000001', scored('GT-001'), { Q9: 'STABLE' });
  assert.deepEqual((row.calculation_trace as { raw_option_ids: unknown }).raw_option_ids, { Q9: 'STABLE' });
});

test('schema contract: every column written exists in public.scores', () => {
  for (const c of golden.cases) {
    const row = toScoresRow('00000000-0000-0000-0000-000000000000', computeScores(c.input as unknown as NormalizedInput), {});
    for (const column of Object.keys(row)) assert.ok(scoresColumns.has(column), `${c.test_id}: column ${column} is not in public.scores`);
  }
});

test('schema contract: every C-02 confidence label satisfies the confidence_label CHECK', () => {
  for (const band of CLASSIFICATIONS.CONFIDENCE) {
    assert.ok(confidenceCheck.includes(band.label), `"${band.label}" would be rejected by the CHECK (${confidenceCheck.join(', ')})`);
  }
});

test('M2 item 7: every score row records the controlled sources it was calculated from', () => {
  const row = toScoresRow('00000000-0000-0000-0000-000000000030', scored('GT-030'), {});
  const src = row.source_versions as { c01: Record<string, string>; c02: Record<string, string> };
  assert.equal(src.c01.label, 'C-01 v1.0.1 CORRECTED');
  assert.equal(src.c01.questionnaire_version, '1.0.1');
  assert.match(src.c01.sha256, /^[0-9a-f]{64}$/);
  assert.equal(src.c02.label, 'C-02 v1.0.1 CORRECTED');
  assert.equal(src.c02.scoring_version, '1.0.1');
  assert.match(src.c02.sha256, /^[0-9a-f]{64}$/);
  // Also inside the calculation trace, so the trace alone identifies its source.
  assert.deepEqual((row.calculation_trace as { source_versions: unknown }).source_versions, src);
});

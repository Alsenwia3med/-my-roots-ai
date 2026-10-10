/**
 * C-02 golden test pack — the 30 deterministic cases on pages 16-17.
 *
 * Each case feeds the normalized input to the engine and compares the eight golden fields
 * with deep strict equality: every score, every coverage fraction and the exact driver list.
 * "Must match exactly" (C-02 p.16) — there is no tolerance.
 *
 * Run: npm run test:scoring
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';
import golden from '../../lib/scoring/c02-golden-tests.json';

const GOLDEN_FIELDS = [
  'domains',
  'coverage',
  'biological_state',
  'opportunity',
  'recovery_potential',
  'protective_count',
  'confidence',
  'drivers',
] as const;

test('the golden pack holds exactly 30 cases', () => {
  assert.equal(golden.cases.length, 30);
});

for (const c of golden.cases) {
  test(`${c.test_id} — ${c.purpose}`, () => {
    const result = computeScores(c.input as unknown as NormalizedInput);
    const actual = Object.fromEntries(GOLDEN_FIELDS.map((f) => [f, result[f]]));
    assert.deepStrictEqual(actual, c.expected);
  });
}

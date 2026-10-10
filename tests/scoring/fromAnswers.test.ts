/**
 * Saved C-01 answers -> normalized input -> scores.
 *
 * The golden pack tests the engine on already-normalized points. These tests cover the step
 * before it: that real option IDs, as the autosave route stores them, reach the engine as the
 * right C-02 points and factor values.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RawAnswer } from '../../lib/assessment/validation';
import { SCORED_ITEMS } from '../../lib/scoring/c02-ruleset';
import { computeScores } from '../../lib/scoring/engine';
import { normalizeAnswers } from '../../lib/scoring/fromAnswers';
import golden from '../../lib/scoring/c02-golden-tests.json';

/** The option ID that gives an item the wanted burden points. */
function optionFor(questionId: string, points: number): string {
  const it = SCORED_ITEMS.find((i) => i.question_id === questionId)!;
  const found = Object.entries(it.points).find(([, p]) => p === points);
  if (!found) throw new Error(`${questionId} has no option worth ${points}`);
  return found[0];
}

/** A complete, lowest-burden answer set with all five protective factors present. */
function lowBurdenAnswers(): Record<string, RawAnswer> {
  const answers: Record<string, RawAnswer> = {};
  for (const it of SCORED_ITEMS) answers[it.question_id] = optionFor(it.question_id, 0);
  Object.assign(answers, {
    Q1: 40,
    Q13: ['NONE'],
    Q14: ['NONE'],
    Q61: 'NEVER',
    Q64: 'ALW',
    Q65: 'STRONG',
    Q69: 9,
    Q72: 'HIGH',
  });
  return answers;
}

test('reverse-scored Q26: "Almost always" comfortably full is zero burden (C-02 GT-014)', () => {
  const { input } = normalizeAnswers({ ...lowBurdenAnswers(), Q26: 'ALW' });
  assert.equal(input.Q26, 0);
});

test('reverse-scored Q28: "Never" satisfied is maximum burden (C-02 GT-015)', () => {
  const { input } = normalizeAnswers({ ...lowBurdenAnswers(), Q28: 'NVR' });
  assert.equal(input.Q28, 4);
});

test('an N/A option carries no points and is excluded', () => {
  const { input, raw_option_ids } = normalizeAnswers({ ...lowBurdenAnswers(), Q17: 'NA', Q9: { na: true } });
  assert.equal(input.Q17, null);
  assert.equal(input.Q9, null);
  assert.equal(raw_option_ids.Q17, 'NA');
});

test('an unanswered scored item is missing, not zero', () => {
  const answers = lowBurdenAnswers();
  delete answers.Q40;
  assert.equal(normalizeAnswers(answers).input.Q40, null);
});

test('P1 needs BOTH >= 3 active days and >= 30 minutes', () => {
  const base = lowBurdenAnswers();
  assert.equal(normalizeAnswers({ ...base, Q46: 'D3_4', Q47: 'M30_59' }).input.P1, true);
  assert.equal(normalizeAnswers({ ...base, Q46: 'D1_2', Q47: 'M60_PLUS' }).input.P1, false);
  assert.equal(normalizeAnswers({ ...base, Q46: 'D5_7', Q47: 'M10_29' }).input.P1, false);
});

test('P5 readiness is active at 7-10 only', () => {
  const base = lowBurdenAnswers();
  assert.equal(normalizeAnswers({ ...base, Q69: 7 }).input.P5, true);
  assert.equal(normalizeAnswers({ ...base, Q69: 6 }).input.P5, false);
});

test('condition and medication counts ignore NONE', () => {
  const { input } = normalizeAnswers({ ...lowBurdenAnswers(), Q13: ['T2D', 'HTN', 'THYROID'], Q14: ['GLUCOSE'] });
  assert.equal(input.diseaseCount, 3);
  assert.equal(input.medicationCount, 1);
});

test('"Not sure" on medication makes Recovery Potential unavailable and flags it', () => {
  const { input } = normalizeAnswers({ ...lowBurdenAnswers(), Q14: ['UNSURE'] });
  assert.equal(input.medicationCount, null);
  const result = computeScores(input);
  assert.equal(result.recovery_potential, null);
  assert.deepEqual(result.limitations, ['RECOVERY_MEDICATION_UNAVAILABLE']);
  assert.notEqual(result.biological_state, null, 'the limitation never touches domain scores or Biological State');
});

test('an option C-02 does not recognise is rejected, never silently scored', () => {
  assert.throws(() => normalizeAnswers({ ...lowBurdenAnswers(), Q10: 'SOMETIMES' }), /no C-02 points/);
});

test('end to end: real lowest-burden answers reproduce golden case GT-001 exactly', () => {
  const gt001 = golden.cases.find((c) => c.test_id === 'GT-001')!;
  const r = computeScores(normalizeAnswers(lowBurdenAnswers()).input);
  const actual = {
    domains: r.domains,
    coverage: r.coverage,
    biological_state: r.biological_state,
    opportunity: r.opportunity,
    recovery_potential: r.recovery_potential,
    protective_count: r.protective_count,
    confidence: r.confidence,
    drivers: r.drivers,
  };
  assert.deepStrictEqual(actual, gt001.expected);
});

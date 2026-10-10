/**
 * M2 item 9 — invalid input cannot bypass the canonical assessment and scoring controls.
 *
 * The database tests (docs/m2/ROOTS-AI_M2_Security_Tests.sql) prove who can reach which rows.
 * These prove what happens to the data itself: whatever reaches the stored answers — through
 * the API or written around it — is validated again at submission, and only the 40 C-02
 * scoring items, mapped through the controlled option table, can influence a score.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { getOptions, QUESTIONS } from '../../lib/assessment/questionBank';
import { checkStoredAnswers, validateAnswer, type RawAnswer } from '../../lib/assessment/validation';
import { SCORED_ITEMS } from '../../lib/scoring/c02-ruleset';
import { computeScores, ScoringInputError } from '../../lib/scoring/engine';
import { normalizeAnswers } from '../../lib/scoring/fromAnswers';

/** A complete, valid answer set built from the question bank itself (first non-N/A option). */
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
  // Mutually exclusive NONE must stand alone; pick it where it is the first option.
  for (const id of ['Q13', 'Q14']) a[id] = ['NONE'];
  return a;
}

const scoresOf = (answers: Record<string, RawAnswer>) => {
  const r = computeScores(normalizeAnswers(answers).input);
  return { domains: r.domains, biological_state: r.biological_state, opportunity: r.opportunity, drivers: r.drivers };
};

describe('stored answers are validated again at submission', () => {
  test('a complete, valid answer set passes the gate', () => {
    const r = checkStoredAnswers(completeAnswers());
    assert.equal(r.complete, true, JSON.stringify(r));
  });

  const tampered: [string, string, unknown][] = [
    ['option outside the approved set', 'Q10', 'NOT_AN_OPTION'],
    ['empty required multi-select', 'Q52', []],
    ['NONE combined with a condition', 'Q13', ['NONE', 'T2D']],
    ['N/A where C-01 does not allow it', 'Q1', { na: true }],
    ['N/A on Q73 free text', 'Q73', { na: true }],
    ['age below 18', 'Q1', 16],
    ['age as text', 'Q1', '40'],
    ['age not finite', 'Q1', Number.POSITIVE_INFINITY],
    ['height out of range', 'Q3', 20],
    ['waist with an invented unit', 'Q6', { value: 90, unit: 'FT' }],
    ['readiness above 10', 'Q69', 11],
    ['free text over 1,000 characters', 'Q73', 'x'.repeat(1001)],
    ['a question that does not exist', 'Q999', 'NVR'],
    ['a raw score instead of an option', 'Q17', 4],
  ];
  for (const [label, id, value] of tampered) {
    test(`blocked: ${label} (${id})`, () => {
      const r = checkStoredAnswers({ ...completeAnswers(), [id]: value as RawAnswer });
      assert.equal(r.complete, false, `${id}=${JSON.stringify(value)} passed the submission gate`);
      assert.ok(r.invalid.includes(id));
    });
  }

  test('a missing required answer is never treated as N/A', () => {
    const answers = completeAnswers();
    delete answers.Q57;
    const r = checkStoredAnswers(answers);
    assert.equal(r.complete, false);
    assert.deepEqual(r.missing, ['Q57']);
  });

  test('the submit route scores only what the gate accepted, from the stored answers', () => {
    const src = readFileSync(join(__dirname, '../../app/(site)/api/v1/assessments/[id]/submit/route.ts'), 'utf8');
    assert.ok(src.includes('checkStoredAnswers(answers)'), 'submit must use the stored-answer gate');
    assert.ok(!/request\.(json|text|formData)\(|readJsonObject\(/.test(src), 'submit must not read answers or scores from the request body');
  });
});

describe('only the 40 scoring items can influence scores', () => {
  test('changing every contextual (non-scoring) answer leaves every score unchanged', () => {
    const base = completeAnswers();
    const changed = { ...base };
    for (const q of QUESTIONS.filter((x) => !x.scoring_eligible && x.option_set_id && x.question_type !== 'multi_select')) {
      const options = getOptions(q).filter((o) => !o.is_na);
      if (options.length > 1) changed[q.question_id] = options[options.length - 1].option_id;
    }
    changed.Q52 = ['WITHDRAW'];
    changed.Q73 = 'Additional context that must not affect any score.';
    // Q1, Q13, Q14, Q61, Q64, Q65, Q69 and Q72 are C-02 factor inputs (Recovery / Confidence),
    // not domain inputs; keep them fixed so only purely contextual answers change.
    for (const k of ['Q1', 'Q13', 'Q14', 'Q61', 'Q64', 'Q65', 'Q69', 'Q72']) changed[k] = base[k];
    assert.deepEqual(scoresOf(changed), scoresOf(base));
  });

  test('a scoring item accepts only options with C-02 points (or N/A)', () => {
    for (const it of SCORED_ITEMS) {
      const answers = { ...completeAnswers(), [it.question_id]: 'FORGED_OPTION' };
      assert.throws(() => normalizeAnswers(answers), ScoringInputError, it.question_id);
    }
  });

  test('a stored raw point value cannot stand in for an option', () => {
    assert.throws(() => normalizeAnswers({ ...completeAnswers(), Q17: 4 as unknown as RawAnswer }), ScoringInputError);
  });

  test('scores are recomputed identically from the same answers (deterministic)', () => {
    const a = completeAnswers();
    assert.deepEqual(scoresOf(a), scoresOf(structuredClone(a)));
  });
});

describe('no endpoint accepts scores, drivers or classifications from a client', () => {
  test('no API route writes score or report rows from request data', () => {
    const routes = [
      'app/(site)/api/v1/assessments/route.ts',
      'app/(site)/api/v1/assessments/[id]/responses/route.ts',
      'app/(site)/api/v1/assessments/[id]/submit/route.ts',
      'app/(site)/api/v1/assessments/[id]/report/route.ts',
      'app/(site)/api/v1/profile/route.ts',
      'app/(site)/api/v1/consents/route.ts',
    ];
    for (const r of routes) {
      const src = readFileSync(join(__dirname, '../..', r), 'utf8');
      assert.ok(!/from\(['"]scores['"]\)\s*\.\s*(insert|update|upsert)/.test(src), `${r} writes scores`);
      assert.ok(!/from\(['"]reports['"]\)\s*\.\s*(insert|update|upsert)/.test(src), `${r} writes reports`);
    }
  });

  test('every question the autosave API accepts is validated against C-01', () => {
    for (const q of QUESTIONS) assert.equal(validateAnswer(q.question_id, 'DEFINITELY_NOT_VALID').ok, q.question_type === 'free_text', q.question_id);
  });
});

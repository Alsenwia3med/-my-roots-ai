/**
 * M2 item 10 — the application's canonical data reproduces the controlled executable
 * workbooks (C-01 / C-02 v1.0.1 CORRECTED) and names the exact source it came from.
 *
 * - The generated JSON records each workbook's SHA-256; it must equal the file in
 *   docs/controlled-sources. (`python scripts/canonical/generate.py --check` additionally
 *   regenerates the JSON from the workbooks and fails on any difference.)
 * - Every formula constant held in code appears in the workbook's own rule text.
 * - The C-01 counts, the M2 validation points and the C-02 driver rules hold.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from "node:test";
import bank from '../../lib/assessment/c01-question-bank.json';
import { MODULES, QUESTIONS, DATASET_SOURCE } from '../../lib/assessment/questionBank';
import { checkSubmission, VAL, validateAnswer } from '../../lib/assessment/validation';
import ruleset from '../../lib/scoring/c02-ruleset.json';
import golden from '../../lib/scoring/c02-golden-tests.json';
import {
  AGE_BANDS,
  BIOLOGICAL_STATE_MIN_DOMAINS,
  CONDITION_VALUES,
  CONFIDENCE_WEIGHTS,
  DOMAIN_COVERAGE_THRESHOLD,
  DOMAIN_ORDER,
  DRIVER_RULES,
  EVIDENCE_WEIGHTS,
  HIGH_SIGNAL_MIN_POINTS,
  MEDICATION_VALUES,
  OPPORTUNITY_FACTOR,
  PROTECTIVE_POINTS_PER_FACTOR,
  RECOVERY_WEIGHTS,
  SCORED_ITEMS,
  SCORING_VERSION,
  RULESET_SOURCE,
} from '../../lib/scoring/c02-ruleset';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';

const SRC = join(__dirname, '../../docs/controlled-sources');
const sha = (file: string) => createHash('sha256').update(readFileSync(join(SRC, file))).digest('hex');

describe('controlled source identity', () => {
  test('C-01 JSON was generated from the v1.0.1 CORRECTED workbook in the repository', () => {
    assert.equal(DATASET_SOURCE.document, '02_ROOTS_AI_C01_Canonical_Question_Bank_v1.0.1_CORRECTED.xlsx');
    assert.equal(DATASET_SOURCE.document_version, '1.0.1 CORRECTED');
    assert.equal(DATASET_SOURCE.sha256, sha(DATASET_SOURCE.document));
  });

  test('C-02 ruleset and golden tests were generated from the v1.0.1 CORRECTED workbook', () => {
    const file = '03_ROOTS_AI_C02_Canonical_Scoring_Rules_and_Golden_Tests_v1.0.1_CORRECTED.xlsx';
    assert.equal(RULESET_SOURCE.document, file);
    assert.equal(RULESET_SOURCE.sha256, sha(file));
    assert.equal(golden.source.sha256, sha(file));
    assert.equal(SCORING_VERSION, '1.0.1');
    assert.equal(golden.scoring_version, '1.0.1');
  });
});

describe('C-01 counts (M2 item 1)', () => {
  test('73 questions, 13 ordered modules, 71 required, 2 optional, 40 scoring-eligible', () => {
    assert.equal(QUESTIONS.length, 73);
    assert.equal(MODULES.length, 13);
    assert.deepEqual(MODULES.map((m) => m.module_order), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    assert.equal(QUESTIONS.filter((q) => q.required).length, 71);
    assert.deepEqual(QUESTIONS.filter((q) => !q.required).map((q) => q.question_id), ['Q5', 'Q73']);
    assert.equal(QUESTIONS.filter((q) => q.scoring_eligible).length, 40);
    assert.deepEqual(QUESTIONS.map((q) => q.question_id), Array.from({ length: 73 }, (_, i) => `Q${i + 1}`));
  });

  test('C-01 scoring-eligible questions are exactly the C-02 mapped questions', () => {
    const eligible = QUESTIONS.filter((q) => q.scoring_eligible).map((q) => q.question_id).sort();
    assert.deepEqual(SCORED_ITEMS.map((i) => i.question_id).sort(), eligible);
  });

  test('every C-01 QA check in the workbook is PASS', () => {
    for (const c of bank.qa_checks) assert.equal(c.Result, 'PASS', c.Check);
  });
});

describe('validation (M2 item 2)', () => {
  test('required multi-selects Q13, Q14, Q52, Q53, Q54 reject an empty array', () => {
    for (const id of ['Q13', 'Q14', 'Q52', 'Q53', 'Q54']) {
      const q = QUESTIONS.find((x) => x.question_id === id)!;
      assert.equal(q.required, true, id);
      const r = validateAnswer(id, []);
      assert.equal(r.ok, false, `${id} accepted []`);
      assert.equal(!r.ok && r.rule, 'VAL-006');
    }
  });

  test('NONE and N/A cannot be combined with other selections', () => {
    assert.equal(validateAnswer('Q13', ['NONE', 'T2D']).ok, false);
    assert.equal(validateAnswer('Q13', ['NA', 'T2D']).ok, false);
    assert.equal(validateAnswer('Q14', ['NONE', 'NA']).ok, false);
    assert.equal(validateAnswer('Q52', ['NA', 'EAT']).ok, false);
    assert.equal(validateAnswer('Q13', ['NONE']).ok, true);
    assert.equal(validateAnswer('Q54', ['NA']).ok, true);
    assert.equal(validateAnswer('Q53', ['STRESS', 'SLEEP']).ok, true);
  });

  test('options outside the approved set are rejected', () => {
    assert.equal(validateAnswer('Q13', ['INVENTED']).ok, false);
    assert.equal(validateAnswer('Q10', 'MAYBE').ok, false);
    assert.equal(validateAnswer('Q999', 'NVR').ok, false);
  });

  test('Q73 is optional free text with no N/A', () => {
    const q = QUESTIONS.find((x) => x.question_id === 'Q73')!;
    assert.equal(q.required, false);
    assert.equal(q.allow_na, false);
    assert.equal(validateAnswer('Q73', { na: true }).ok, false);
    assert.equal(validateAnswer('Q73', 'Some context').ok, true);
    assert.equal(validateAnswer('Q73', 'x'.repeat(1001)).ok, false);
  });

  test('N/A is accepted only where C-01 allows it', () => {
    for (const q of QUESTIONS.filter((x) => x.question_type !== 'multi_select' && !x.option_set_id)) {
      if (!q.allow_na) assert.equal(validateAnswer(q.question_id, { na: true }).ok, false, q.question_id);
    }
    assert.equal(validateAnswer('Q1', { na: true }).ok, false);
  });

  test('missing answers are never treated as N/A: a submission missing any required answer is incomplete', () => {
    const all = QUESTIONS.filter((q) => q.required).map((q) => q.question_id);
    assert.equal(checkSubmission(all).complete, true);
    for (const id of ['Q13', 'Q57', 'Q72']) {
      const r = checkSubmission(all.filter((q) => q !== id));
      assert.equal(r.complete, false);
      assert.deepEqual(r.missing, [id]);
    }
    // Optional questions may stay blank.
    assert.equal(checkSubmission(all.filter((q) => q !== 'Q5' && q !== 'Q73')).complete, true);
  });

  test('error wording is the approved C-01 v1.0.1 text', () => {
    for (const r of bank.validation_rules) assert.equal(VAL[r.rule_id as keyof typeof VAL], r.approved_error_or_behavior);
    assert.equal(VAL['VAL-006'], 'Choose at least one valid option; None/Not applicable cannot be combined with other options.');
  });
});

describe('C-02 constants match the workbook rule text (M2 items 4, 10)', () => {
  const formula = (id: string) => ruleset.formulas.find((f) => f.rule_id === id)!;
  const drv = (id: string) => ruleset.drivers_evidence.find((d) => d.rule_id === id)!;
  const readme = ruleset.readme as unknown as Record<string, string>;

  test('raw scale 0-4, 50% coverage, 5 of 7 domains, half-away-from-zero rounding', () => {
    assert.equal(readme['Raw burden scale'], '0-4');
    assert.equal(readme['Domain coverage threshold'], '50%');
    assert.equal(DOMAIN_COVERAGE_THRESHOLD, 0.5);
    assert.equal(readme['Biological State minimum'], `${BIOLOGICAL_STATE_MIN_DOMAINS} of 7 domains`);
    assert.match(readme.Rounding, /Half away from zero/);
    assert.match(formula('SC-001').null_or_boundary_rule, /< 0\.50/);
  });

  test('Opportunity, protective, recovery and confidence constants', () => {
    assert.match(formula('SC-003').normative_formula, new RegExp(`× ${OPPORTUNITY_FACTOR}\\)`));
    assert.match(formula('SC-004').normative_formula, new RegExp(`^${PROTECTIVE_POINTS_PER_FACTOR} ×`));
    const w = RECOVERY_WEIGHTS;
    const two = (n: number) => n.toFixed(2);
    assert.equal(
      formula('SC-005').normative_formula,
      `${two(w.inverseBiologicalState)}×(100-BIO_STATE)+${two(w.protective)}×Protective+${two(w.age)}×Age+${two(w.condition)}×Condition+${two(w.medication)}×Medication`,
    );
    const c = CONFIDENCE_WEIGHTS;
    assert.equal(
      formula('SC-008').normative_formula,
      `${two(c.coverage)}×overall coverage + ${two(c.answerConfidence)}×Q72 value + ${two(c.consistency)}×mean available-domain consistency`,
    );
  });

  test('evidence and driver constants', () => {
    const e = EVIDENCE_WEIGHTS;
    assert.equal(drv('EVD-001')['deterministic rule'], `${e.coverage.toFixed(2)}×domain coverage + ${e.consistency.toFixed(2)}×domain consistency + ${e.highSignal.toFixed(2)}×high-signal proportion`);
    assert.match(drv('EVD-001').tie_or_fallback, new RegExp(`points ≥${HIGH_SIGNAL_MIN_POINTS}`));
    assert.match(drv('DRV-001')['deterministic rule'], new RegExp(`≥${DRIVER_RULES.eligibilityMin}$`));
    assert.match(drv('DRV-003')['deterministic rule'], new RegExp(`≤${DRIVER_RULES.coPrimaryMaxDelta},`));
  });

  test('tie order is MR, HS, SR, CH, SL, IB, BS (DRV-002)', () => {
    assert.deepEqual(DOMAIN_ORDER, ['MR', 'HS', 'SR', 'CH', 'SL', 'IB', 'BS']);
  });

  test('age, condition and medication bands', () => {
    const factor = (id: string) => ruleset.protective_factors.find((p) => p.factor_id === id)!['activation/value rule'];
    assert.equal(factor('AGE'), AGE_BANDS.map((b) => `${b.min}-${b.max}=${b.value}`).join('; '));
    assert.equal(factor('CONDITION'), `None=${CONDITION_VALUES[0]}; one category=${CONDITION_VALUES[1]}; two=${CONDITION_VALUES[2]}; three or more=${CONDITION_VALUES[3]}`);
    assert.equal(factor('MEDICATION'), `None=${MEDICATION_VALUES[0]}; one category=${MEDICATION_VALUES[1]}; two or more=${MEDICATION_VALUES[2]}`);
  });

  test('every C-02 QA check in the workbook is PASS', () => {
    for (const c of ruleset.qa_checks) assert.equal(c.Result, 'PASS', c.Check);
  });
});

describe('driver rules across all 30 golden cases (M2 item 5)', () => {
  for (const c of golden.cases) {
    test(`${c.test_id}: drivers are eligible, distinct and in canonical order`, () => {
      const r = computeScores(c.input as unknown as NormalizedInput);
      const named = r.drivers.flatMap((d) => d.replace(' co-primary', '').split('+'));
      assert.equal(new Set(named).size, named.length, `duplicate driver in ${JSON.stringify(r.drivers)}`);
      for (const d of named) {
        const score = r.domains[d as keyof typeof r.domains];
        assert.ok(score !== null && score >= DRIVER_RULES.eligibilityMin, `${d} is not eligible`);
      }
      assert.ok(!r.drivers.some((d) => d.includes('BIO_STATE')));
    });
  }
});

describe('versioning (M2 item 7)', () => {
  // C-01 v1.0.1 CORRECTED sets questionnaire_version to 1.0.1 on all 73 question records, and
  // C-03 v1.0.1 §1 requires the stored value to be the one that actually generated the report:
  // "No report may claim v1.0.0 when generated from v1.0.1."
  test('assessments and scores are stamped with the workbook versions, v1.0.1 CORRECTED', async () => {
    const { ASSESSMENT_SOURCE_VERSIONS, SCORING_SOURCE_VERSIONS } = await import('../../lib/versions');
    assert.equal(ASSESSMENT_SOURCE_VERSIONS.c01.label, 'C-01 v1.0.1 CORRECTED');
    assert.equal(ASSESSMENT_SOURCE_VERSIONS.c01.questionnaire_version, '1.0.1');
    assert.equal(ASSESSMENT_SOURCE_VERSIONS.c01.sha256, sha(ASSESSMENT_SOURCE_VERSIONS.c01.document));
    assert.equal(SCORING_SOURCE_VERSIONS.c02.label, 'C-02 v1.0.1 CORRECTED');
    assert.equal(SCORING_SOURCE_VERSIONS.c02.sha256, sha(SCORING_SOURCE_VERSIONS.c02.document));
  });

  test('the database records the source once, server-side only', () => {
    const sql = readFileSync(join(__dirname, '../../supabase/roots_ai_setup.sql'), 'utf8');
    assert.ok(sql.includes('source_versions is recorded once by the server'));
    assert.ok(sql.includes('CREATE TRIGGER assessments_source_server_only'));
  });
});

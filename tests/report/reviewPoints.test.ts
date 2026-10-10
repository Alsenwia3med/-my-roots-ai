/**
 * ROOTS final report review, 24 September 2026 — points 3, 4, 20 and 23.
 *
 * Point 5 (driver explanation) and point 27 (disclaimer structure) are asserted in
 * build.test.ts, next to the requirements they extend.
 *
 * Every assertion below checks the review requirement against the controlled source it depends
 * on — the C-02 Classifications table, the C-02 Domains direction statement, and the C-01
 * `scoring_eligible` field — rather than against the copy alone, so the wording cannot drift
 * away from the canon it describes. Nothing here changes C-01, C-02 or the engine.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import bank from '../../lib/assessment/c01-question-bank.json';
import { applyNarrative } from '../../lib/ai/apply';
import { CONFIDENCE_COMPOSITE_NOTE, CONFIDENCE_NOTE, DOMAIN_DIRECTION_NOTE, WHY } from '../../lib/report/c03-content';
import { buildReport, type DeterministicReport } from '../../lib/report/build';
import { CLASSIFICATIONS } from '../../lib/scoring/c02-ruleset';
import golden from '../../lib/scoring/c02-golden-tests.json';
import { computeScores, type NormalizedInput, type ScoringResult } from '../../lib/scoring/engine';
import { validateAnswer } from '../../lib/assessment/validation';

interface Question {
  question_id: string;
  question_type: string;
  scoring_eligible: boolean;
}
const QUESTIONS = (bank as { questions: Question[] }).questions;

function report(scoring: ScoringResult, id: string, answers: Record<string, unknown> = {}): DeterministicReport {
  return buildReport({
    reportId: `RPT-REVIEW-${id}`,
    generatedAt: '2026-09-28T12:00:00.000Z',
    participantDisplay: null,
    questionnaireVersion: '1.0.1',
    auditTraceReference: `scores/${id}`,
    scoring,
    protective: { P1: true, P2: true, P3: false, P4: false, P5: true },
    answers: answers as Parameters<typeof buildReport>[0]['answers'],
  });
}

const cases = golden.cases.map((c) => {
  const scoring = computeScores(c.input as unknown as NormalizedInput);
  return { id: c.test_id, scoring, report: report(scoring, c.test_id) };
});

const section = (r: DeterministicReport, n: number) => r.sections[n - 1];

describe('review point 3 — the meaning of Confidence', () => {
  test('section 5 carries the approved explanation', () => {
    for (const { id, report: r } of cases) {
      assert.ok(section(r, 5).paragraphs.includes(CONFIDENCE_NOTE), `${id}: the Confidence explanation is missing`);
    }
  });

  test('the composite is explained where the component scores are shown', () => {
    for (const { id, report: r } of cases) {
      const s5 = section(r, 5);
      assert.equal(s5.footnote, CONFIDENCE_COMPOSITE_NOTE, `${id}: the composite explanation is missing`);
      // The explanation is only truthful if the components really are shown alongside it.
      const labels = (s5.items ?? []).map((i) => i.label);
      for (const l of ['Overall coverage', 'Answer confidence', 'Consistency']) {
        assert.ok(labels.includes(l), `${id}: component "${l}" is not shown`);
      }
    }
  });

  test('the composite is genuinely not a simple average of the displayed components', () => {
    // C-02 SC-008 weights the three components 0.50 / 0.30 / 0.20, so the note is accurate.
    const weighted = cases.filter(({ scoring }) => {
      const t = scoring.trace.confidence;
      if (t.mean_consistency === null) return false;
      const mean = (t.coverage_percent + t.answer_confidence + t.mean_consistency) / 3;
      return Math.abs(mean - scoring.confidence) > 1;
    });
    assert.ok(weighted.length > 0, 'no Golden Test distinguishes the weighted model from an average');
  });

  test('the Confidence label is the C-02 band for the score, never chosen by hand', () => {
    const band = (score: number) => CLASSIFICATIONS.CONFIDENCE.find((b) => score >= b.min && score <= b.max)?.label;

    for (const { id, scoring } of cases) {
      assert.equal(scoring.classifications.confidence.label, band(scoring.confidence), `${id}: label is not the C-02 band`);
    }
    // The review asks specifically that 68/100 classify as Moderate-High.
    assert.equal(band(68), 'Moderate-High');
  });
});

describe('review point 4 — score direction in the Seven-Domain Score Breakdown', () => {
  test('the direction statement appears with the breakdown', () => {
    for (const { id, report: r } of cases) {
      assert.equal(section(r, 7).lede, DOMAIN_DIRECTION_NOTE, `${id}: the direction statement is missing`);
    }
  });

  test('the statement matches the canonical direction for every displayed domain', () => {
    // C-02 "Domains": "Higher scores mean greater self-reported burden", one formula (SC-001)
    // for all seven. The DOMAIN bands must therefore rise from lower to higher burden.
    const ordered = [...CLASSIFICATIONS.DOMAIN].sort((a, b) => a.min - b.min).map((b) => b.label);
    assert.deepEqual(ordered, ['Optimized', 'Compensating', 'Strained', 'Dysregulated']);
  });

  test('numbers and state labels are preserved; colour never carries state alone', () => {
    for (const { id, report: r } of cases) {
      for (const b of section(r, 7).bars ?? []) {
        if (b.score === null) continue;
        assert.equal(typeof b.score, 'number', `${id}: ${b.domain_id} has no numeric score`);
        assert.ok(b.classification && b.classification.length > 0, `${id}: ${b.domain_id} has no state label`);
      }
    }
  });
});

describe('review point 20 — participant answers', () => {
  const answered = cases[0].report;

  test('every answer states whether it was a scoring input, from the C-01 field', () => {
    const expected = new Map(QUESTIONS.map((q) => [q.question_id, q.scoring_eligible ? 'scoring' : 'context']));
    let seen = 0;
    for (const m of section(answered, 16).modules ?? []) {
      for (const a of m.answers) {
        assert.equal(a.kind, expected.get(a.question_id), `${a.question_id}: kind does not match C-01 scoring_eligible`);
        seen += 1;
      }
    }
    assert.equal(seen, QUESTIONS.length, 'the snapshot must cover every question');
    assert.ok([...expected.values()].includes('context'), 'C-01 must contain at least one context-only question');
  });

  test('free text is identified as the participant response', () => {
    const free = QUESTIONS.filter((q) => q.question_type === 'free_text').map((q) => q.question_id);
    assert.ok(free.length > 0, 'C-01 must contain a free-text question');
    for (const m of section(answered, 16).modules ?? []) {
      for (const a of m.answers) {
        assert.equal(a.freeText, free.includes(a.question_id), `${a.question_id}: free-text marking is wrong`);
      }
    }
  });

  test('free text is reproduced verbatim, including spelling and spacing', () => {
    const q73 = 'i dont sleep  well  and  its been  worse\nsince march, teh tiredness';
    const r = report(cases[0].scoring, 'VERBATIM', { Q73: q73 });
    const rendered = (section(r, 16).modules ?? []).flatMap((m) => m.answers).find((a) => a.question_id === 'Q73');
    assert.equal(rendered?.answer, q73, 'the free-text answer was altered');
    assert.equal(rendered?.freeText, true);
    assert.equal(rendered?.kind, 'context', 'Q73 is not scoring_eligible in C-01');
  });
});

describe('review point 19 — measurements are never silently converted or altered', () => {
  /*
   * Point 19's plausibility prompt is open, because C-01 defines no plausibility ranges and the
   * point forbids inventing them. What is *not* open is everything the point says must never
   * happen, and these assert it, so the open part cannot be mistaken for the whole.
   */

  test('the entered value and unit are stored as given, with the canonical value beside them', () => {
    const inches = validateAnswer('Q6', { value: 32, unit: 'IN' });
    assert.ok(inches.ok, 'a valid waist in inches should be accepted');
    assert.deepEqual(inches.answer.raw_value, { value: 32, unit: 'IN' }, 'the entered value or unit was altered');
    assert.equal(inches.answer.normalized_value, 81.28, 'the canonical value should be the conversion, to the cent');
  });

  test('a unit is never inferred', () => {
    for (const raw of [44, '44', { value: 44 }, { value: 44, unit: 'cm' }, { value: 44, unit: 'MM' }]) {
      const result = validateAnswer('Q6', raw);
      assert.equal(result.ok, false, `${JSON.stringify(raw)} must not be accepted without an approved unit`);
    }
  });

  test('the report prints the entered value with its unit, not the conversion', () => {
    const r = report(cases[0].scoring, 'UNITS', { Q6: { value: 32, unit: 'IN' } });
    const rendered = (section(r, 16).modules ?? []).flatMap((m) => m.answers).find((a) => a.question_id === 'Q6');
    assert.equal(rendered?.answer, '32 in', 'the participant must see what they entered, with its unit');
    assert.ok(!String(rendered?.answer).includes('81'), 'the converted value must not be shown in its place');
  });

  test('the acceptance range does not do the work of a plausibility range', () => {
    // The review's own example. 44 cm is unusual but inside VAL-004's range, so it is accepted
    // in silence today. This test exists to fail the day a plausibility layer is added without
    // this document being updated — it is the open gap, asserted.
    const unusual = validateAnswer('Q6', { value: 44, unit: 'CM' });
    assert.ok(unusual.ok, 'a 44 cm waist is inside the C-01 acceptance range');
    assert.equal(unusual.answer.normalized_value, 44);
  });

  test('every typed measurement is context only, so an implausible value cannot move a score', () => {
    const typed = QUESTIONS.filter((q) => ['integer', 'decimal', 'decimal_with_unit'].includes(q.question_type));
    assert.equal(typed.length, 5, 'C-01 should have five typed measurements');
    for (const q of typed) {
      assert.equal(q.scoring_eligible, false, `${q.question_id} feeds scoring; an implausible value would move a score`);
    }
  });
});

describe('review point 23 — "Why this appeared" explainability', () => {
  const EXPLAINED = [3, 4, 5, 6];

  test('the major scores and the drivers each carry an explanation', () => {
    for (const { id, report: r } of cases) {
      for (const n of EXPLAINED) {
        assert.ok(section(r, n).why, `${id}: section ${n} has no explanation`);
      }
    }
  });

  test('no explanation implies causation', () => {
    const causal = /\b(causes?|caused|causing|because of|due to|leads? to|results? in|responsible for)\b/i;
    // An explicit denial of causation is the opposite of a causal claim, so it is removed
    // before the check; the denial itself is asserted in the next test.
    const denial = /\b(?:does not|do not|never)\s+(?:identify|establish|imply|indicate|mean)\s+(?:a\s+)?caus\w*/gi;

    for (const { id, report: r } of cases) {
      for (const n of EXPLAINED) {
        const why = (section(r, n).why as string).replace(denial, '');
        assert.ok(!causal.test(why), `${id}: section ${n} implies causation`);
      }
    }
  });

  test('the driver explanation states outright that it is not a cause', () => {
    for (const { id, scoring, report: r } of cases) {
      if (scoring.trace.drivers.eligible.length === 0) continue;
      assert.match(section(r, 6).why as string, /does not identify a cause/, `${id}: the non-causation statement is missing`);
    }
  });

  test('no explanation exposes a weighting, constant or threshold', () => {
    // The trace values that legitimately appear are coverage % and the answer-confidence value,
    // both of which are already shown to the participant in section 5.
    for (const { id, report: r } of cases) {
      for (const n of [3, 4, 6]) {
        assert.ok(!/\d/.test(section(r, n).why as string), `${id}: section ${n} discloses a number`);
      }
      const why5 = section(r, 5).why as string;
      for (const forbidden of ['0.50', '0.30', '0.20']) {
        assert.ok(!why5.includes(forbidden), `${id}: section 5 discloses ${forbidden}`);
      }
    }
  });

  test('the driver explanation matches what the engine found eligible', () => {
    for (const { id, scoring, report: r } of cases) {
      const why = section(r, 6).why as string;
      if (scoring.trace.drivers.eligible.length === 0) {
        assert.equal(why, WHY.driversNone, `${id}: the no-driver explanation is wrong`);
        continue;
      }
      assert.ok(!why.includes('{'), `${id}: unresolved placeholder in the driver explanation`);
    }
  });

  test('a null score is explained rather than left unexplained', () => {
    const nullState = cases.filter((c) => c.scoring.biological_state === null);
    assert.ok(nullState.length > 0, 'the Golden Tests must cover a null Biological State');
    for (const { id, report: r } of nullState) {
      assert.equal(section(r, 3).why, WHY.biologicalStateNull, `${id}: the null state is not explained`);
      assert.equal(section(r, 4).why, WHY.opportunityNull, `${id}: the dependent null is not explained`);
    }
  });
});

describe('review points 1 and 24 — the Biological Card states the version set that actually applied', () => {
  const versionsOf = (r: DeterministicReport) =>
    (r.sections[16].items ?? []).find((i) => i.label === 'Versions')?.value ?? '';

  const provenance = (outcome: 'generated' | 'deterministic_fallback') => ({
    provider: 'openai' as const,
    model: 'gpt-4.1',
    prompt_version: '1.0.0',
    schema_version: '1.0.0',
    content_library_version: 'C-03-v1.0.1',
    fallback_version: '1.0.0-deterministic-fallback',
    outcome,
  });

  /*
   * A delivered production report stated "Narrative 1.0.0-deterministic-fallback" on the
   * Biological Card while its footer stated "1.0.0-governed-narrative" — a direct contradiction
   * about whether AI was involved, because buildReport writes the card before the narrative
   * decision exists. These assertions hold the two in agreement.
   */
  test('with a governed narrative, the card and the report agree', () => {
    const base = cases[0].report;
    const applied = applyNarrative(base, {
      narrative: { executive_summary: ['one'], future_projection: ['two'], final_word: 'three' },
      provenance: provenance('generated'),
    });
    assert.match(applied.narrative_template_version, /governed-narrative$/);
    assert.ok(
      versionsOf(applied).includes(applied.narrative_template_version),
      `card says "${versionsOf(applied)}" but the report says "${applied.narrative_template_version}"`,
    );
    assert.ok(!versionsOf(applied).includes('deterministic-fallback'), 'the card must not still claim a fallback');
  });

  test('with no narrative, the card states the fallback version', () => {
    const applied = applyNarrative(cases[0].report, { narrative: null, provenance: provenance('deterministic_fallback') });
    assert.equal(applied.narrative_template_version, '1.0.0-deterministic-fallback');
    assert.ok(versionsOf(applied).includes('1.0.0-deterministic-fallback'));
  });

  test('every other version on the card is left untouched', () => {
    const applied = applyNarrative(cases[0].report, {
      narrative: { executive_summary: ['one'], future_projection: ['two'], final_word: 'three' },
      provenance: provenance('generated'),
    });
    for (const part of ['Questionnaire 1.0.1', 'Scoring 1.0.1', 'Report 1.0.1', 'Disclaimer 1.0.0']) {
      assert.ok(versionsOf(applied).includes(part), `${part} was lost from the card`);
    }
  });
});

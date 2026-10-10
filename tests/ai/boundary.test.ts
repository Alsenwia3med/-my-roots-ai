/**
 * Controlled AI boundary — M3 evidence for Regulatory Readiness Annex §8.
 *
 * Annex §8.1 requires evidence for score injection, hallucinated values, prohibited language,
 * timeout, retry and fallback, and for the read-only boundary itself. Every case here is
 * deterministic: the provider is a function supplied by the test, so no network, key or model
 * is involved and the same evidence can be reproduced by ROOTS at any time with `npm test`.
 *
 *   AI-01  the projection carries no answers, identity or free text
 *   AI-02  score-bearing keys and hallucinated numerals are rejected
 *   AI-05  prohibited diagnostic, prescriptive, certainty, alarmist and causal wording rejected
 *   AI-06  provenance records exactly how each report's narrative was produced
 *   AI-07  timeout, one retry, then the approved deterministic fallback
 *   AI-01/03  accepted narrative changes only the three governed sections; never a result
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyNarrative, AI_DISCLOSURE, NARRATIVE_SECTIONS } from '../../lib/ai/apply';
import { checkNarrativeLanguage } from '../../lib/ai/language';
import { MAX_ATTEMPTS, NarrativeProviderError, runNarrative, type RequestNarrative } from '../../lib/ai/orchestrate';
import { buildProjection, SCALE_NOTE } from '../../lib/ai/projection';
import { NO_NARRATIVE } from '../../lib/ai/provenance';
import { countWords, validateNarrative } from '../../lib/ai/schema';
import { buildReport, classify, driverName } from '../../lib/report/build';
import { canonicalStringify } from '../../lib/report/canonical';
import golden from '../../lib/scoring/c02-golden-tests.json';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';

// ------------------------------------------------------------------ fixtures

const scoring = computeScores(golden.cases[0].input as unknown as NormalizedInput);

const deterministic = () =>
  buildReport({
    reportId: 'RPT-20260925-AIBOUND1',
    generatedAt: '2026-09-25T09:00:00.000Z',
    participantDisplay: 'Sample Participant',
    questionnaireVersion: '1.0.1',
    auditTraceReference: 'scores/ai-boundary',
    scoring,
    protective: { P1: true, P2: true, P3: false, P4: true, P5: true },
    answers: { Q73: 'I have been very tired lately and it is affecting my work.' },
  });

const projection = () =>
  buildProjection({
    scoring,
    driverLabels: Object.fromEntries(scoring.drivers.map((d) => [d, driverName(d)])),
    biologicalStateClassification: scoring.biological_state === null ? null : classify(scoring.biological_state),
    protectiveFactors: deterministic().protective_factors,
    freeTextPresent: true,
    questionnaireVersion: '1.0.1',
    reportTemplateVersion: '1.0.1',
  });

/** Governed wording: hedged, no digits, nothing from the prohibited list. */
const VALID = {
  executive_summary: [
    'Your answers suggest a pattern in which several reported areas appear to be working together rather than alone. The areas that stood out most may be influencing how you experience energy and appetite across a typical week. These are patterns you described yourself, and they may shift as your circumstances change.',
    'Your answers also point to strengths that may support change, including routines you already keep. Confidence in this interpretation depends on how complete and consistent your answers were, so it should be read as a starting point rather than a settled picture. Where information was missing, that gap is shown plainly rather than filled in.',
  ],
  future_projection: [
    'If the current pattern continues, the same reported signals may remain influential.',
    'Small, repeatable changes may shift how these areas interact over time.',
    'If routines become more consistent, the pattern you described could gradually look different.',
  ],
  final_word: [
    'Your answers are a starting point, not a verdict. Choose one realistic change that fits your week, and give yourself enough time to notice what shifts.',
    'Patterns like these often respond to consistency rather than intensity, so the smallest repeatable action is usually the most useful place to begin. If something feels persistent or concerning, speak with a qualified professional.',
  ].join(' '),
};

const json = (value: unknown) => JSON.stringify(value);
const alwaysReturns = (payload: string): RequestNarrative => async () => payload;

// ------------------------------------------------------------------ AI-01 read-only projection

test('AI-01: the projection carries no answers, identity, free text or scoring trace', () => {
  const p = projection();
  const serialized = canonicalStringify(p);

  assert.ok(!serialized.includes('Sample Participant'), 'participant identity must not reach the model');
  assert.ok(!serialized.includes('very tired'), 'free-text content must never be projected (C-03 §7)');
  assert.ok(!serialized.includes('Q73'), 'question identifiers must not be projected');
  assert.equal('trace' in (p as unknown as Record<string, unknown>), false, 'the scoring trace is not projected');
  assert.equal('coverage' in (p as unknown as Record<string, unknown>), false, 'per-domain coverage is not projected');

  assert.equal(p.free_text_present, true, 'only the existence of free text travels');
  assert.equal(p.scale_note, SCALE_NOTE, 'score direction is stated so it cannot be inverted');
});

test('AI-01: the projection is pure — the same result projects identically every time', () => {
  assert.equal(canonicalStringify(projection()), canonicalStringify(projection()));
});

test('AI-01: projected values are exactly the deterministic outputs', () => {
  const p = projection();
  assert.equal(p.biological_state, scoring.biological_state);
  assert.equal(p.opportunity_score, scoring.opportunity);
  assert.equal(p.recovery_potential, scoring.recovery_potential);
  assert.equal(p.confidence.score, scoring.confidence);
  assert.deepEqual(
    p.drivers.map((d) => d.id),
    scoring.drivers,
    'drivers are the C-02 output verbatim, including co-primary structure',
  );
});

// ------------------------------------------------------------------ AI-02 schema

test('AI-02: governed narrative that follows the contract is accepted', () => {
  const result = validateNarrative(VALID);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('AI-02: score injection — an authoritative key anywhere in the response is rejected', () => {
  for (const injected of [
    { ...VALID, biological_state: 61 },
    { ...VALID, drivers: ['SL', 'SR'] },
    { ...VALID, confidence: { score: 84, label: 'High' } },
  ]) {
    const result = validateNarrative(injected);
    assert.equal(result.ok, false, `expected rejection of ${Object.keys(injected).join(',')}`);
    assert.match((result as { reason: string }).reason, /score-bearing key|schema/);
  }
});

test('AI-02: score injection nested deep in the response is still rejected', () => {
  const result = validateNarrative({ ...VALID, meta: { audit: { domain_scores: { MR: 62 } } } });
  assert.equal(result.ok, false);
  assert.match((result as { reason: string }).reason, /score-bearing key "domain_scores"/);
});

test('AI-02: hallucinated numerical values are rejected — narrative may contain no digits', () => {
  const withNumber = {
    ...VALID,
    executive_summary: [VALID.executive_summary[0].replace('several reported areas', 'your score of 61'), VALID.executive_summary[1]],
  };
  const result = validateNarrative(withNumber);
  assert.equal(result.ok, false);
  assert.match((result as { reason: string }).reason, /numeral/);
});

test('AI-02: the response shape is fixed — unknown fields and wrong counts are rejected', () => {
  assert.equal(validateNarrative({ ...VALID, extra_section: 'text' }).ok, false);
  assert.equal(validateNarrative({ ...VALID, executive_summary: [VALID.executive_summary[0]] }).ok, false);
  assert.equal(validateNarrative({ ...VALID, future_projection: ['Only one may happen.'] }).ok, false);
  assert.equal(validateNarrative({ future_projection: VALID.future_projection, final_word: VALID.final_word }).ok, false);
});

test('AI-02: C-03 length limits are enforced on each governed section', () => {
  const short = { ...VALID, executive_summary: ['A short summary that may apply.', 'Another short one.'] };
  const shortResult = validateNarrative(short);
  assert.equal(shortResult.ok, false);
  assert.match((shortResult as { reason: string }).reason, /90-160/);

  const longWord = `${VALID.final_word} ${'It may also help to keep going. '.repeat(10)}`;
  const longResult = validateNarrative({ ...VALID, final_word: longWord });
  assert.equal(longResult.ok, false);
  assert.match((longResult as { reason: string }).reason, /50-100/);

  // The approved sample sits inside both limits.
  assert.ok(countWords(VALID.executive_summary.join(' ')) >= 90);
  assert.ok(countWords(VALID.executive_summary.join(' ')) <= 160);
  assert.ok(countWords(VALID.final_word) >= 50);
  assert.ok(countWords(VALID.final_word) <= 100);
});

// ------------------------------------------------------------------ AI-05 language

test('AI-05: every prohibited category is refused', () => {
  const cases: [string, RegExp][] = [
    ['Your answers suggest you have metabolic syndrome and it may persist.', /diagnostic/],
    ['You may wish to start a supplement and adjust your medication dosage.', /prescriptive/],
    ['This proves your pattern will improve and results are guaranteed.', /certainty/],
    ['You are at serious risk of a life-threatening problem; seek emergency help.', /alarmist/],
    ['Poor sleep causes your reported weight change and leads to fatigue.', /causal/],
  ];

  for (const [sentence, category] of cases) {
    const result = checkNarrativeLanguage({ ...VALID, executive_summary: [sentence, VALID.executive_summary[1]] });
    assert.equal(result.ok, false, `expected rejection of: ${sentence}`);
    assert.match((result as { reason: string }).reason, category);
  }
});

test('AI-05: required conditional framing is enforced (C-03 §7)', () => {
  const flat = {
    ...VALID,
    future_projection: ['The same signals remain influential.', 'Your routines stay the same.', 'The pattern looks like this.'],
  };
  const result = checkNarrativeLanguage(flat);
  assert.equal(result.ok, false);
  assert.match((result as { reason: string }).reason, /conditional/);
});

test('AI-05: the approved sample passes the language check', () => {
  assert.equal(checkNarrativeLanguage(VALID).ok, true);
});

// ------------------------------------------------------------------ AI-07 timeout, retry, fallback

test('AI-07: a timeout falls back to approved deterministic copy after the permitted retry', async () => {
  let attempts = 0;
  const timesOut: RequestNarrative = async () => {
    attempts += 1;
    throw new NarrativeProviderError('provider timed out', 'timeout');
  };

  const result = await runNarrative(projection(), timesOut);
  assert.equal(result.narrative, null);
  assert.equal(result.outcome, 'deterministic_fallback');
  assert.equal(result.fallbackReason, 'timeout');
  assert.equal(attempts, MAX_ATTEMPTS, 'exactly one retry is permitted');
});

test('AI-07: malformed output falls back and records why', async () => {
  const result = await runNarrative(projection(), alwaysReturns('not json at all'));
  assert.equal(result.narrative, null);
  assert.equal(result.fallbackReason, 'invalid_json');
  assert.equal(result.rejections.length, MAX_ATTEMPTS);
});

test('AI-07: a rejected first attempt followed by governed output is accepted as a retry', async () => {
  let call = 0;
  const flaky: RequestNarrative = async () => {
    call += 1;
    return call === 1 ? json({ ...VALID, biological_state: 61 }) : json(VALID);
  };

  const result = await runNarrative(projection(), flaky);
  assert.equal(result.outcome, 'generated_after_retry');
  assert.ok(result.narrative);
  assert.equal(result.rejections.length, 1);
  assert.match(result.rejections[0], /score-bearing key/);
});

test('AI-07: governed output on the first attempt is used as generated', async () => {
  const result = await runNarrative(projection(), alwaysReturns(json(VALID)));
  assert.equal(result.outcome, 'generated');
  assert.deepEqual(result.narrative, VALID);
  assert.equal(result.rejections.length, 0);
});

test('AI-07: a missing key is not retried — there is nothing to retry', async () => {
  let attempts = 0;
  const unconfigured: RequestNarrative = async () => {
    attempts += 1;
    throw new NarrativeProviderError('OPENAI_API_KEY is not configured', 'not_configured');
  };

  const result = await runNarrative(projection(), unconfigured);
  assert.equal(result.fallbackReason, 'not_configured');
  assert.equal(attempts, 1);
});

test('AI-05/AI-07: prohibited wording is refused twice and the report keeps approved copy', async () => {
  const prohibited = json({ ...VALID, final_word: 'This proves your sleep disorder will improve once you begin treatment.' });
  const result = await runNarrative(projection(), alwaysReturns(prohibited));
  assert.equal(result.narrative, null);
  assert.ok(result.fallbackReason === 'prohibited_language' || result.fallbackReason === 'schema_rejected');
});

// ------------------------------------------------------------------ AI-01/AI-03/AI-06 applying the decision

test('AI-06: a report with no narrative records that honestly', () => {
  const report = applyNarrative(deterministic(), { narrative: null, provenance: NO_NARRATIVE });
  assert.equal(report.narrative_provenance.outcome, 'deterministic_fallback');
  assert.equal(report.narrative_provenance.fallback_reason, 'disabled');
  assert.equal(report.narrative_template_version, NO_NARRATIVE.fallback_version);
});

test('AI-01/AI-03: accepted narrative changes only the three governed sections', () => {
  const base = deterministic();
  const withAi = applyNarrative(base, {
    narrative: VALID,
    provenance: { ...NO_NARRATIVE, provider: 'openai', model: 'test-model', outcome: 'generated', fallback_reason: undefined },
  });

  const governed = new Set<number>(Object.values(NARRATIVE_SECTIONS));
  for (const section of base.sections) {
    const after = withAi.sections.find((s) => s.number === section.number)!;
    if (governed.has(section.number)) {
      assert.notDeepEqual(after.paragraphs, section.paragraphs, `section ${section.number} should carry narrative`);
      assert.equal(after.source, 'governed_narrative');
    } else if (section.number === 17) {
      /*
       * The Biological Card prints the version set, and buildReport necessarily writes it before
       * the narrative decision exists. applyNarrative corrects the narrative version there so the
       * card cannot contradict the report's own footer — a delivered production report stated
       * "deterministic-fallback" on the card and "governed-narrative" in its footer.
       *
       * That correction is the ONLY permitted difference: this asserts the card is otherwise
       * byte-identical, that the corrected version matches the report, and that no score, driver
       * or classification moved.
       */
      const strip = (s: typeof section) => ({
        ...s,
        items: (s.items ?? []).map((i) =>
          i.label === 'Versions' ? { ...i, value: (i.value ?? '').replace(/Narrative [^·]+/, '') } : i,
        ),
      });
      assert.deepEqual(strip(after), strip(section), 'the Biological Card changed beyond its narrative version');

      const versions = (after.items ?? []).find((i) => i.label === 'Versions')?.value ?? '';
      assert.ok(
        versions.includes(withAi.narrative_template_version),
        `the card says "${versions}" but the report says "${withAi.narrative_template_version}"`,
      );
      assert.ok(!versions.includes('deterministic-fallback'), 'the card must not claim a fallback after a narrative was accepted');
    } else {
      assert.deepEqual(after, section, `section ${section.number} must be untouched by the narrative layer`);
    }
  }
});

test('AI-03: no score, driver, classification or limitation can be altered by the narrative layer', () => {
  const base = deterministic();
  const withAi = applyNarrative(base, { narrative: VALID, provenance: { ...NO_NARRATIVE, outcome: 'generated' } });

  assert.deepEqual(withAi.domain_scores, base.domain_scores);
  assert.equal(withAi.biological_state, base.biological_state);
  assert.equal(withAi.opportunity_score, base.opportunity_score);
  assert.equal(withAi.recovery_potential, base.recovery_potential);
  assert.deepEqual(withAi.confidence, base.confidence);
  assert.deepEqual(withAi.drivers, base.drivers);
  assert.deepEqual(withAi.protective_factors, base.protective_factors);
  assert.deepEqual(withAi.limitations, base.limitations);
  assert.equal(withAi.scoring_version, base.scoring_version);
  assert.equal(withAi.questionnaire_version, base.questionnaire_version);
});

test('AI-08: AI-assisted sections carry the approved disclosure', () => {
  const withAi = applyNarrative(deterministic(), { narrative: VALID, provenance: { ...NO_NARRATIVE, outcome: 'generated' } });
  for (const number of Object.values(NARRATIVE_SECTIONS)) {
    const section = withAi.sections.find((s) => s.number === number)!;
    assert.ok(
      section.items?.some((i) => i.note === AI_DISCLOSURE),
      `section ${number} must disclose AI assistance`,
    );
  }
});

test('AI-08: the fixed medical and AI disclaimer is never replaced by narrative', () => {
  const base = deterministic();
  const withAi = applyNarrative(base, { narrative: VALID, provenance: { ...NO_NARRATIVE, outcome: 'generated' } });
  const before = base.sections.find((s) => s.number === 19)!;
  const after = withAi.sections.find((s) => s.number === 19)!;
  assert.deepEqual(after, before);
  assert.equal(after.source, 'fixed');
});

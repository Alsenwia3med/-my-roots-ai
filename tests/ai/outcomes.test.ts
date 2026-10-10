/**
 * Every outcome the governed narrative boundary can reach, and what each one records.
 *
 * ROOTS review of 29 September 2026, item B3: "The regression suite must distinguish successful
 * generation, missing or misnamed configuration, timeout, invalid response, rejected content and
 * deterministic fallback. These are verification cases for the approved governed-narrative
 * boundary, not authorization to expand the AI feature."
 *
 * Nothing here adds behaviour. Each case drives the existing orchestrator with a stub provider
 * that fails in one specific way, and asserts the recorded outcome, the recorded reason, and that
 * the report keeps its approved deterministic copy with every authoritative value intact.
 *
 * The misnamed-configuration case is the one that mattered in practice: the provider key was
 * present under the wrong name, every report fell back silently, and nothing in the product said
 * so. It is covered here by its observable signature — `not_configured` — which is what
 * distinguishes it from a provider that was reached and refused.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { applyNarrative } from '../../lib/ai/apply';
import { MAX_ATTEMPTS, NarrativeProviderError, runNarrative, type RequestNarrative } from '../../lib/ai/orchestrate';
import { buildProjection } from '../../lib/ai/projection';
import { NO_NARRATIVE, type FallbackReason } from '../../lib/ai/provenance';
import { buildReport, classify, driverName, type DeterministicReport } from '../../lib/report/build';
import { COPY } from '../../lib/report/c03-content';
import golden from '../../lib/scoring/c02-golden-tests.json';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';

const scoring = computeScores(golden.cases[12].input as unknown as NormalizedInput);

const report = (): DeterministicReport =>
  buildReport({
    reportId: 'RPT-OUTCOMES',
    generatedAt: '2026-09-29T12:00:00.000Z',
    participantDisplay: null,
    questionnaireVersion: '1.0.1',
    auditTraceReference: 'scores/outcomes',
    scoring,
    protective: { P1: true, P2: true, P3: false, P4: false, P5: true },
    answers: {},
  });

const projection = () =>
  buildProjection({
    scoring,
    driverLabels: Object.fromEntries(scoring.drivers.map((d) => [d, driverName(d)])),
    biologicalStateClassification: scoring.biological_state === null ? null : classify(scoring.biological_state),
    protectiveFactors: report().protective_factors,
    freeTextPresent: false,
    questionnaireVersion: '1.0.1',
    reportTemplateVersion: '1.0.1',
  });

/**
 * A well-formed response. Taken from tests/ai/boundary.test.ts, where it is already proven to
 * satisfy the schema and the language rules, rather than written afresh here — an invented
 * payload failed the C-03 §4.2 word limits and looked like an orchestrator fault.
 */
const VALID_OBJECT = {
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

const VALID = JSON.stringify(VALID_OBJECT);

const run = (request: RequestNarrative) => runNarrative(projection(), request);

/** The three sections a governed narrative may replace. */
const GOVERNED = [2, 9, 18];

/** Turns an orchestrator result into the decision applyNarrative consumes. */
const decisionOf = (r: Awaited<ReturnType<typeof run>>) => ({
  narrative: r.narrative,
  provenance: { ...NO_NARRATIVE, outcome: r.outcome, fallback_reason: r.fallbackReason },
});

function assertFellBackCleanly(decision: Awaited<ReturnType<typeof run>>, reason: FallbackReason) {
  assert.equal(decision.narrative, null, 'a failed attempt must not yield a narrative');
  assert.equal(decision.outcome, 'deterministic_fallback');
  assert.equal(decision.fallbackReason, reason);

  // The report is still produced, and still carries the approved copy.
  const base = report();
  const canonical = applyNarrative(base, decisionOf(decision));
  assert.equal(canonical.sections[8].paragraphs[0], COPY.futureProjection, 'section 9 lost its approved fallback');
  assert.equal(canonical.sections[17].paragraphs[0], COPY.finalWord, 'section 18 lost its approved fallback');
  for (const n of GOVERNED) {
    assert.notEqual(canonical.sections[n - 1].source, 'governed_narrative', `section ${n} claims a narrative it does not have`);
  }

  // No authoritative value moved.
  assert.deepEqual(canonical.domain_scores, base.domain_scores);
  assert.deepEqual(canonical.drivers, base.drivers);
  assert.equal(canonical.biological_state, base.biological_state);
  assert.equal(canonical.confidence.label, base.confidence.label);
}

describe('governed narrative outcomes (ROOTS item B3)', () => {
  test('1. successful generation', async () => {
    const decision = await run(async () => VALID);
    assert.ok(decision.narrative, 'a valid response should be accepted');
    assert.equal(decision.outcome, 'generated');
    assert.equal(decision.fallbackReason, undefined);

    const canonical = applyNarrative(report(), decisionOf(decision));
    for (const n of GOVERNED) assert.equal(canonical.sections[n - 1].source, 'governed_narrative');
    assert.match(canonical.narrative_template_version, /governed-narrative$/);
  });

  test('2. missing or misnamed configuration — the silent failure that shipped', async () => {
    const decision = await run(async () => {
      throw new NarrativeProviderError('OPENAI_API_KEY is not configured', 'not_configured');
    });
    assertFellBackCleanly(decision, 'not_configured');

    // This is the signature that distinguishes a key that was never read from a provider that
    // was reached and refused. It is what makes a misnamed secret observable after the fact.
    assert.equal(decision.fallbackReason, 'not_configured');
  });

  test('3. provider timeout', async () => {
    const decision = await run(async () => {
      throw new NarrativeProviderError('provider timed out', 'timeout');
    });
    assertFellBackCleanly(decision, 'timeout');
  });

  test('4. invalid response — not JSON', async () => {
    const decision = await run(async () => 'this is not json at all');
    assertFellBackCleanly(decision, 'invalid_json');
  });

  test('5. rejected content — schema violation', async () => {
    // A digit in the narrative is rejected: the model may never restate a score.
    const withNumber = { ...VALID_OBJECT } as Record<string, unknown>;
    withNumber.final_word = 'Your score of 61 suggests you should focus on sleep over the next two weeks and beyond.';
    const decision = await run(async () => JSON.stringify(withNumber));
    assertFellBackCleanly(decision, 'schema_rejected');
  });

  test('6. rejected content — prohibited language', async () => {
    const diagnostic = { ...VALID_OBJECT } as Record<string, unknown>;
    diagnostic.final_word =
      'You have metabolic syndrome and you must begin treatment immediately to cure this condition before it worsens.';
    const decision = await run(async () => JSON.stringify(diagnostic));
    assert.equal(decision.narrative, null, 'prohibited wording must never be accepted');
    assert.equal(decision.outcome, 'deterministic_fallback');
    assert.ok(
      decision.fallbackReason === 'prohibited_language' || decision.fallbackReason === 'schema_rejected',
      `expected the content to be refused, got ${decision.fallbackReason}`,
    );
  });

  test('7. provider error, retried then accepted', async () => {
    let calls = 0;
    const decision = await run(async () => {
      calls += 1;
      if (calls === 1) throw new NarrativeProviderError('provider returned 500', 'provider_error');
      return VALID;
    });
    assert.ok(decision.narrative, 'the retry should have been accepted');
    assert.equal(decision.outcome, 'generated_after_retry');
    assert.equal(calls, 2, 'exactly one retry is expected');
  });

  test('8. provider error on every attempt', async () => {
    let calls = 0;
    const decision = await run(async () => {
      calls += 1;
      throw new NarrativeProviderError('provider returned 500', 'provider_error');
    });
    assertFellBackCleanly(decision, 'provider_error');
    assert.equal(calls, MAX_ATTEMPTS, `the orchestrator should stop after ${MAX_ATTEMPTS} attempts`);
  });

  test('every outcome is reachable and distinguishable', async () => {
    const seen = new Map<string, string | undefined>();

    for (const [label, request] of [
      ['generated', async () => VALID],
      ['not_configured', async () => { throw new NarrativeProviderError('x', 'not_configured'); }],
      ['timeout', async () => { throw new NarrativeProviderError('x', 'timeout'); }],
      ['provider_error', async () => { throw new NarrativeProviderError('x', 'provider_error'); }],
      ['invalid_json', async () => 'not json'],
    ] as [string, RequestNarrative][]) {
      const d = await run(request);
      seen.set(label, d.fallbackReason ?? d.outcome);
    }

    // Each failure mode records a reason of its own, so a delivered report says which happened.
    const reasons = [...seen.values()];
    assert.equal(new Set(reasons).size, reasons.length, `outcomes are not distinguishable: ${JSON.stringify([...seen])}`);
  });

  test('the fallback provenance is recorded even when nothing was attempted', () => {
    const canonical = applyNarrative(report(), { narrative: null, provenance: NO_NARRATIVE });
    assert.equal(canonical.narrative_provenance.outcome, 'deterministic_fallback');
    assert.ok(canonical.narrative_template_version.includes('deterministic-fallback'));
  });
});

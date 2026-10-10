/**
 * Critical scoring branch coverage.
 *
 * Master Requirements §13.1 requires "≥80% coverage for business logic and 100% coverage of
 * critical scoring formula branches". The Golden Tests prove the engine produces the approved
 * outputs for 30 approved inputs; they do not reach the guard clauses and null paths, because
 * every approved case is well-formed by construction.
 *
 * This file covers those remaining branches: every input-validation refusal, every null and
 * boundary path through SC-001…SC-008, and every driver state DRV-001…DRV-004.
 *
 * It asserts the behaviour the controlled rules define. It does not change C-01, C-02, the
 * engine or any Golden Test expectation.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import golden from '../../lib/scoring/c02-golden-tests.json';
import { computeScores, ScoringInputError, type NormalizedInput } from '../../lib/scoring/engine';
import { toScoresRow } from '../../lib/scoring/scoresRow';

/** A known-good input, taken from an approved Golden Test so the baseline is never invented. */
const base = (): NormalizedInput => structuredClone(golden.cases[0].input) as unknown as NormalizedInput;

const scoredKeys = Object.keys(base()).filter((k) => /^Q\d+$/.test(k)) as (keyof NormalizedInput)[];

/** Blanks every scored item, which drives each domain below the 50% coverage floor. */
function allUnanswered(): NormalizedInput {
  const input = base();
  for (const k of scoredKeys) (input as unknown as Record<string, unknown>)[k] = null;
  return input;
}

const refuses = (mutate: (i: NormalizedInput) => void, match: RegExp) => {
  const input = base();
  mutate(input);
  assert.throws(() => computeScores(input), (e: unknown) => e instanceof ScoringInputError && match.test((e as Error).message));
};

describe('input validation refuses malformed input (checkInput)', () => {
  test('a scored answer outside 0..MAX_POINTS is refused', () => {
    refuses((i) => ((i as unknown as Record<string, unknown>)[scoredKeys[0]] = 99), /must be an integer/);
  });

  test('a non-integer scored answer is refused', () => {
    refuses((i) => ((i as unknown as Record<string, unknown>)[scoredKeys[0]] = 1.5), /must be an integer/);
  });

  test('a negative scored answer is refused', () => {
    refuses((i) => ((i as unknown as Record<string, unknown>)[scoredKeys[0]] = -1), /must be an integer/);
  });

  test('a non-integer age is refused', () => {
    refuses((i) => (i.age = 40.5), /age must be an integer/);
  });

  test('an age outside the C-02 bands is refused', () => {
    refuses((i) => (i.age = 999), /outside the C-02 age bands/);
    refuses((i) => (i.age = 1), /outside the C-02 age bands/);
  });

  test('answerConfidence outside 0..100 is refused', () => {
    refuses((i) => (i.answerConfidence = 101), /answerConfidence/);
    refuses((i) => (i.answerConfidence = -1), /answerConfidence/);
  });

  test('a non-integer answerConfidence is refused', () => {
    refuses((i) => (i.answerConfidence = 62.5), /answerConfidence/);
  });

  test('a negative or fractional diseaseCount is refused', () => {
    refuses((i) => (i.diseaseCount = -1), /diseaseCount/);
    refuses((i) => (i.diseaseCount = 1.5), /diseaseCount/);
  });

  test('a negative or fractional medicationCount is refused', () => {
    refuses((i) => (i.medicationCount = -2), /medicationCount/);
    refuses((i) => (i.medicationCount = 0.5), /medicationCount/);
  });

  test('a non-boolean protective factor is refused', () => {
    for (const p of ['P1', 'P2', 'P3', 'P4', 'P5'] as const) {
      refuses((i) => ((i as unknown as Record<string, unknown>)[p] = 'yes'), new RegExp(`${p} must be a boolean`));
    }
  });
});

describe('null and boundary paths through the formulas', () => {
  test('SC-001: a domain below the coverage floor scores null, and is not treated as zero', () => {
    const r = computeScores(allUnanswered());
    for (const [d, v] of Object.entries(r.domains)) assert.equal(v, null, `${d} should be null`);
    assert.equal(r.trace.coverage.answered, 0);
  });

  test('SC-002: Biological State is null when fewer than five domains are available', () => {
    const r = computeScores(allUnanswered());
    assert.equal(r.biological_state, null);
    assert.equal(r.trace.biological_state.value, null);
    assert.equal(r.trace.biological_state.available.length, 0);
  });

  test('SC-003: Opportunity is null when Biological State is null, and is never imputed', () => {
    const r = computeScores(allUnanswered());
    assert.equal(r.opportunity, null);
    assert.equal(r.trace.opportunity.value, null);
  });

  test('SC-005: Recovery is null when Biological State is null', () => {
    const r = computeScores(allUnanswered());
    assert.equal(r.recovery_potential, null);
    assert.equal(r.classifications.recovery, null);
  });

  test('SC-005: an unavailable condition or medication count is recorded as a limitation', () => {
    const a = base();
    a.diseaseCount = null;
    const ra = computeScores(a);
    assert.ok(ra.limitations.includes('RECOVERY_CONDITION_UNAVAILABLE'));
    assert.equal(ra.recovery_potential, null, 'recovery cannot be computed without the condition value');

    const b = base();
    b.medicationCount = null;
    const rb = computeScores(b);
    assert.ok(rb.limitations.includes('RECOVERY_MEDICATION_UNAVAILABLE'));

    const both = base();
    both.diseaseCount = null;
    both.medicationCount = null;
    const rboth = computeScores(both);
    assert.deepEqual(rboth.limitations.slice().sort(), ['RECOVERY_CONDITION_UNAVAILABLE', 'RECOVERY_MEDICATION_UNAVAILABLE']);
  });

  test('SC-005: counts above the highest band are clamped, not refused', () => {
    const i = base();
    i.diseaseCount = 999;
    i.medicationCount = 999;
    const r = computeScores(i);
    assert.equal(typeof r.recovery_potential, 'number');
  });

  test('SC-004: the protective score follows the count of active factors, 0 through 5', () => {
    for (const n of [0, 1, 2, 3, 4, 5]) {
      const i = base();
      (['P1', 'P2', 'P3', 'P4', 'P5'] as const).forEach((p, idx) => (i[p] = idx < n));
      const r = computeScores(i);
      assert.equal(r.protective_count, n);
      assert.equal(r.trace.protective.score, 20 * n);
    }
  });

  test('SC-008: confidence is produced with no consistency term when no domain has one', () => {
    const r = computeScores(allUnanswered());
    assert.equal(r.trace.confidence.mean_consistency, null);
    assert.equal(r.trace.confidence.consistency_domains.length, 0);
    assert.equal(typeof r.confidence, 'number');
    assert.ok(r.confidence >= 0 && r.confidence <= 100);
  });

  test('SC-006: coverage is 0% when nothing is answered and 100% when everything is', () => {
    assert.equal(computeScores(allUnanswered()).trace.coverage.percent, 0);
    const full = base();
    for (const k of scoredKeys) (full as unknown as Record<string, unknown>)[k] = 0;
    assert.equal(computeScores(full).trace.coverage.percent, 100);
  });

  test('every classification is null exactly when its value is null', () => {
    const r = computeScores(allUnanswered());
    for (const d of Object.keys(r.domains)) {
      assert.equal(r.classifications.domains[d as keyof typeof r.classifications.domains], null);
    }
    assert.equal(r.classifications.recovery, null);
    assert.ok(r.classifications.confidence, 'confidence always classifies, because it is never null');
  });
});

describe('driver states DRV-001..DRV-004', () => {
  test('DRV-001: no domain reaching the eligibility threshold yields no driver', () => {
    const zero = base();
    for (const k of scoredKeys) (zero as unknown as Record<string, unknown>)[k] = 0;
    const r = computeScores(zero);
    assert.deepEqual(r.drivers, []);
    assert.equal(r.trace.drivers.eligible.length, 0);
    assert.match(r.trace.drivers.reason, /no domain|no available/);
  });

  test('the maximum burden input still yields at most three driver entries', () => {
    const max = base();
    for (const k of scoredKeys) (max as unknown as Record<string, unknown>)[k] = 4;
    const r = computeScores(max);
    assert.ok(r.drivers.length <= 3, `got ${r.drivers.length} entries`);
    assert.ok(r.trace.drivers.eligible.length > 0);
  });

  test('every driver state the Golden Tests produce is reached', () => {
    const counts = new Set(golden.cases.map((c) => computeScores(c.input as unknown as NormalizedInput).drivers.length));
    for (const n of [0, 1, 2, 3]) assert.ok(counts.has(n), `no case produces ${n} driver entries`);
  });

  test('a co-primary output is recorded as one entry and carries both domains', () => {
    const co = golden.cases
      .map((c) => computeScores(c.input as unknown as NormalizedInput))
      .find((s) => s.drivers.some((d) => /co-primary/.test(d)));
    assert.ok(co, 'the Golden Tests must produce a co-primary output');
    assert.equal(co.trace.drivers.co_primary, true);
    const entry = co.drivers.find((d) => /co-primary/.test(d))!;
    assert.match(entry, /^[A-Z]{2}\+[A-Z]{2} co-primary$/);
  });
});

describe('the stored score row (toScoresRow)', () => {
  const id = '00000000-0000-4000-8000-000000000000';

  test('a fully scored result maps every domain and derived value', () => {
    const r = computeScores(base());
    const row = toScoresRow(id, r, {});
    assert.equal(row.assessment_id, id);
    assert.equal(row.scoring_version, r.scoring_version);
    assert.equal(row.biological_state, r.biological_state);
    assert.deepEqual(row.drivers_json, r.drivers);
    for (const [d, v] of Object.entries(r.domains)) {
      const column = Object.entries(row).find(([k]) => k.toLowerCase().startsWith(d.toLowerCase()) && k.endsWith('_score'));
      if (column) assert.equal(column[1], v, `${d} column should carry ${v}`);
    }
  });

  test('a null-heavy result stores nulls rather than zeros', () => {
    const r = computeScores(allUnanswered());
    const row = toScoresRow(id, r, {});
    assert.equal(row.biological_state, null);
    assert.equal(row.opportunity_score, null);
    assert.equal(row.recovery_potential, null);
    assert.deepEqual(row.drivers_json, []);
    assert.equal(row.primary_driver, null);
  });

  test('a co-primary entry is stored whole in primary_driver', () => {
    const co = golden.cases
      .map((c) => computeScores(c.input as unknown as NormalizedInput))
      .find((s) => s.drivers.some((d) => /co-primary/.test(d)))!;
    const row = toScoresRow(id, co, {});
    assert.equal(row.primary_driver, co.drivers[0]);
    assert.match(row.primary_driver as string, /co-primary/);
  });

  test('the trace is carried through, with the C-02 SC-001 audit fields added', () => {
    const r = computeScores(base());
    const rawOptionIds = { Q9: 'OPT-9-3' };
    const row = toScoresRow(id, r, rawOptionIds);
    const trace = row.calculation_trace as Record<string, unknown>;

    // Every field of the engine trace survives unaltered...
    for (const [k, v] of Object.entries(r.trace)) assert.deepEqual(trace[k], v, `trace.${k} was altered`);
    // ...and SC-001's audit fields are added alongside it, not in place of it.
    assert.deepEqual(trace.raw_option_ids, rawOptionIds);
    assert.ok(trace.source_versions, 'the controlled source versions must be recorded');
    assert.deepEqual(row.source_versions, trace.source_versions);
  });
});

describe('determinism', () => {
  test('the same input always produces an identical result', () => {
    for (const c of golden.cases.slice(0, 10)) {
      const a = computeScores(c.input as unknown as NormalizedInput);
      const b = computeScores(c.input as unknown as NormalizedInput);
      assert.deepEqual(a, b, `${c.test_id} is not deterministic`);
    }
  });

  test('no finite-value violation appears anywhere in a result', () => {
    const walk = (v: unknown, path: string): void => {
      if (typeof v === 'number') assert.ok(Number.isFinite(v), `${path} is not finite`);
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    };
    for (const c of golden.cases) walk(computeScores(c.input as unknown as NormalizedInput), c.test_id);
    walk(computeScores(allUnanswered()), 'all-null');
  });
});

describe('toScoresRow driver slots (DRV output arity)', () => {
  const id = '00000000-0000-4000-8000-000000000000';

  /** One scoring result per driver count the engine can produce: 0, 1, 2 and 3 entries. */
  const byCount = new Map<number, ReturnType<typeof computeScores>>();
  for (const c of golden.cases) {
    const r = computeScores(c.input as unknown as NormalizedInput);
    if (!byCount.has(r.drivers.length)) byCount.set(r.drivers.length, r);
  }

  test('the Golden Tests supply every driver count', () => {
    for (const n of [0, 1, 2, 3]) assert.ok(byCount.has(n), `no case produces ${n} driver entries`);
  });

  for (const n of [0, 1, 2, 3]) {
    test(`with ${n} driver entries, unused slots are null rather than absent`, () => {
      const r = byCount.get(n)!;
      const row = toScoresRow(id, r, {});
      const slots = [row.primary_driver, row.secondary_driver, row.tertiary_driver];
      for (let i = 0; i < 3; i += 1) {
        assert.equal(slots[i], i < n ? r.drivers[i] : null, `slot ${i + 1} is wrong for ${n} entries`);
      }
      assert.deepEqual(row.drivers_json, r.drivers);
    });
  }
});

/**
 * C-02 deterministic scoring engine (ruleset version: SCORING_VERSION, currently 1.0.1).
 *
 * Pure function: normalized burden points in, scores out, with a full calculation trace
 * (C-02 p.12 "Implement with decimal arithmetic, finite-value checks and a calculation trace").
 * No I/O, no clock, no randomness, no AI: the same input always gives the same output.
 *
 * Arithmetic is exact. Every C-02 formula reduces to a ratio of integers, so each result is
 * computed as one and rounded with integer operations (half away from zero, C-02 p.1). Binary
 * floating point is never rounded directly, because a half-way value such as 27.75 can be
 * represented just below .75 and round the wrong way.
 *
 * All constants come from ./c02-ruleset.ts; this file contains none of its own.
 */

import {
  AGE_BANDS,
  BIOLOGICAL_STATE_MIN_DOMAINS,
  CLASSIFICATIONS,
  CONDITION_VALUES,
  CONFIDENCE_WEIGHTS,
  DATASET_ID,
  DOMAIN_COVERAGE_THRESHOLD,
  DOMAIN_ORDER,
  DRIVER_RULES,
  EVIDENCE_LABELS,
  EVIDENCE_WEIGHTS,
  HIGH_SIGNAL_MIN_POINTS,
  MAX_POINTS,
  MEDICATION_VALUES,
  OPPORTUNITY_FACTOR,
  PROTECTIVE_POINTS_PER_FACTOR,
  RECOVERY_WEIGHTS,
  SCORED_ITEMS,
  SCORING_VERSION,
  type Classification,
  type DomainId,
} from './c02-ruleset';

// ------------------------------------------------------------------ types

/** A scored item's burden points (0-4), or null for N/A or missing. */
export type ItemPoints = number | null;

/**
 * Normalized input, in the shape of the C-02 golden tests (p.16): burden points after option
 * mapping, plus the recovery and confidence inputs. Build it from saved answers with
 * ./fromAnswers.ts.
 */
export interface NormalizedInput {
  /** Q1, years. */
  age: number;
  /** Q13 condition categories; null when unavailable (Prefer not to say / N/A). */
  diseaseCount: number | null;
  /** Q14 medication categories; null when unavailable (Not sure / Prefer not to say / N/A). */
  medicationCount: number | null;
  P1: boolean;
  P2: boolean;
  P3: boolean;
  P4: boolean;
  P5: boolean;
  /** Q72 value: 25, 50, 75 or 100. */
  answerConfidence: number;
  /** Burden points for each of the 40 scored items, keyed Q9..Q51. */
  [questionId: `Q${number}`]: ItemPoints;
}

export interface DomainTrace {
  question_ids: string[];
  points: Record<string, ItemPoints>;
  weights: Record<string, number>;
  answered: number;
  eligible: number;
  numerator: number | null;
  denominator: number | null;
  score: number | null;
  consistency: { mean: number; population_sd: number; score: number } | null;
}

export interface ScoringResult {
  dataset_id: string;
  scoring_version: string;

  // The golden-test outputs (C-02 p.16).
  domains: Record<DomainId, number | null>;
  coverage: Record<DomainId, number>;
  biological_state: number | null;
  opportunity: number | null;
  recovery_potential: number | null;
  protective_count: number;
  confidence: number;
  drivers: string[];

  // Further C-02 outputs.
  classifications: {
    domains: Record<DomainId, Classification | null>;
    confidence: Classification;
    recovery: Classification | null;
  };
  evidence: Record<DomainId, { score: number; label: string } | null>;
  /** Machine-readable limitation flags, e.g. RECOVERY_MEDICATION_UNAVAILABLE. */
  limitations: string[];
  trace: ScoringTrace;
}

export interface ScoringTrace {
  domains: Record<DomainId, DomainTrace>;
  biological_state: { available: DomainId[]; unavailable: DomainId[]; sum: number; value: number | null };
  opportunity: { biological_state: number | null; factor: number; value: number | null };
  protective: { factors: Record<'P1' | 'P2' | 'P3' | 'P4' | 'P5', boolean>; count: number; score: number };
  recovery: {
    biological_state: number | null;
    age: number;
    age_value: number;
    condition_value: number | null;
    medication_value: number | null;
    protective_score: number;
    contributions: Record<string, number> | null;
    value: number | null;
  };
  coverage: { answered: number; eligible: number; percent: number };
  confidence: {
    coverage_percent: number;
    answer_confidence: number;
    mean_consistency: number | null;
    consistency_domains: DomainId[];
    value: number;
  };
  drivers: {
    candidates: { domain_id: DomainId; score: number }[];
    /** DRV-001: candidates scoring >= 25, in DRV-002 rank order. */
    eligible: DomainId[];
    top_score: number | null;
    tie_delta: number | null;
    co_primary: boolean;
    reason: string;
  };
}

export class ScoringInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScoringInputError';
  }
}

// ------------------------------------------------------------------ exact arithmetic

/** num / den rounded half away from zero, for integer num and positive integer den. Exact. */
function roundRatio(num: number, den: number): number {
  if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den) || den <= 0) {
    throw new Error(`roundRatio needs integers with a positive denominator (got ${num}/${den})`);
  }
  const magnitude = Math.floor((2 * Math.abs(num) + den) / (2 * den));
  return num < 0 ? -magnitude : magnitude;
}

/** A decimal ruleset constant as an exact integer multiple of 1/scale (e.g. 0.25 at scale 100 -> 25). */
function scaled(value: number, scale: number): number {
  const result = Math.round(value * scale);
  if (Math.abs(result - value * scale) > 1e-9) {
    throw new Error(`ruleset constant ${value} is not representable at scale 1/${scale}`);
  }
  return result;
}

/**
 * SC-007 consistency, exactly: round(max(0, 1 - populationSD/2) x 100).
 *
 * With n answered items, population variance is A / n^2 where A = n*sum(p^2) - (sum p)^2 is an
 * integer, so the score is 100 - t with t = 50*sqrt(A)/n. t is located between integers, and
 * against the half-way point, by comparing squares of integers — no square root is rounded.
 */
function consistencyScore(points: number[]): number {
  const n = points.length;
  const sum = points.reduce((a, p) => a + p, 0);
  const sumSquares = points.reduce((a, p) => a + p * p, 0);
  const A = n * sumSquares - sum * sum;
  if (A === 0) return 100;

  // m = floor(t), found exactly: m^2 n^2 <= 2500 A < (m+1)^2 n^2.
  let m = Math.floor((50 * Math.sqrt(A)) / n);
  while (m * m * n * n > 2500 * A) m--;
  while ((m + 1) * (m + 1) * n * n <= 2500 * A) m++;

  // Round the score (100 - t) half away from zero, i.e. round t half *down*:
  // t <= m + 0.5  <=>  (2t)^2 <= (2m+1)^2  <=>  10000 A <= (2m+1)^2 n^2.
  const t = 10000 * A <= (2 * m + 1) ** 2 * n * n ? m : m + 1;
  return Math.max(0, 100 - t);
}

/** Population mean and SD, for the trace only (never used in a calculation). */
function describe(points: number[]) {
  const n = points.length;
  const mean = points.reduce((a, p) => a + p, 0) / n;
  const variance = points.reduce((a, p) => a + (p - mean) ** 2, 0) / n;
  return { mean, population_sd: Math.sqrt(variance) };
}

// ------------------------------------------------------------------ classification

type Band = { min: number; label: string; color_hex?: string; interpretation?: string };

/**
 * C-02 p.14 bounds are inclusive integers. Recovery Potential carries one decimal, so a value
 * such as 74.5 falls between two bands; bands are therefore applied as non-overlapping,
 * half-open ranges [min, next min), which is identical to the inclusive bounds for integers.
 */
function band<T extends Band>(bands: readonly T[], value: number): T {
  const ordered = [...bands].sort((a, b) => b.min - a.min);
  const found = ordered.find((b) => value >= b.min);
  if (!found) throw new Error(`no classification band for ${value}`);
  return found;
}

const asClassification = (b: Classification): Classification => ({
  label: b.label,
  color_hex: b.color_hex,
  interpretation: b.interpretation,
});

// ------------------------------------------------------------------ input checks

function checkInput(input: NormalizedInput) {
  for (const it of SCORED_ITEMS) {
    const v = input[it.question_id as `Q${number}`];
    if (v === undefined) throw new ScoringInputError(`${it.question_id} is missing from the input (use null for N/A or missing)`);
    if (v !== null && !(Number.isInteger(v) && v >= 0 && v <= MAX_POINTS)) {
      throw new ScoringInputError(`${it.question_id} must be an integer 0-${MAX_POINTS} or null (got ${v})`);
    }
    if (!Number.isInteger(it.weight) || it.weight <= 0) {
      throw new Error(`${it.question_id}: weights must be positive integers for exact arithmetic (got ${it.weight})`);
    }
  }
  if (!Number.isInteger(input.age)) throw new ScoringInputError(`age must be an integer (got ${input.age})`);
  if (!Number.isInteger(input.answerConfidence) || input.answerConfidence < 0 || input.answerConfidence > 100) {
    throw new ScoringInputError(`answerConfidence must be an integer 0-100 (got ${input.answerConfidence})`);
  }
  for (const key of ['diseaseCount', 'medicationCount'] as const) {
    const v = input[key];
    if (v !== null && !(Number.isInteger(v) && v >= 0)) throw new ScoringInputError(`${key} must be a non-negative integer or null (got ${v})`);
  }
  for (const key of ['P1', 'P2', 'P3', 'P4', 'P5'] as const) {
    if (typeof input[key] !== 'boolean') throw new ScoringInputError(`${key} must be a boolean`);
  }
}

// ------------------------------------------------------------------ the engine

export function computeScores(input: NormalizedInput): ScoringResult {
  checkInput(input);

  // ---- SC-001 domain scores, SC-006 coverage, SC-007 consistency
  const domains = {} as Record<DomainId, number | null>;
  const coverage = {} as Record<DomainId, number>;
  const domainTrace = {} as Record<DomainId, DomainTrace>;
  const evidence = {} as Record<DomainId, { score: number; label: string } | null>;
  let answeredTotal = 0;

  for (const domainId of DOMAIN_ORDER) {
    const items = SCORED_ITEMS.filter((it) => it.domain_id === domainId);
    const answered = items.filter((it) => input[it.question_id as `Q${number}`] !== null);
    const answeredPoints = answered.map((it) => input[it.question_id as `Q${number}`] as number);
    const eligible = items.length;
    answeredTotal += answered.length;

    coverage[domainId] = answered.length / eligible;

    // Null below the coverage threshold: answered/eligible < 0.50, compared in integers.
    const thresholdScaled = scaled(DOMAIN_COVERAGE_THRESHOLD, 100);
    const calculable = answered.length > 0 && answered.length * 100 >= thresholdScaled * eligible;

    let numerator: number | null = null;
    let denominator: number | null = null;
    let score: number | null = null;
    let consistency: DomainTrace['consistency'] = null;

    if (calculable) {
      numerator = answered.reduce((a, it) => a + (input[it.question_id as `Q${number}`] as number) * it.weight, 0);
      denominator = answered.reduce((a, it) => a + MAX_POINTS * it.weight, 0);
      score = roundRatio(100 * numerator, denominator);
      consistency = { ...describe(answeredPoints), score: consistencyScore(answeredPoints) };

      // EVD-001: 0.45 x coverage% + 0.35 x consistency + 0.20 x high-signal%, as one exact ratio.
      const wc = scaled(EVIDENCE_WEIGHTS.coverage, 100);
      const wk = scaled(EVIDENCE_WEIGHTS.consistency, 100);
      const wh = scaled(EVIDENCE_WEIGHTS.highSignal, 100);
      const a = answered.length;
      const highSignal = answeredPoints.filter((p) => p >= HIGH_SIGNAL_MIN_POINTS).length;
      const evidenceScore = roundRatio(
        wc * 100 * a * a + wk * consistency.score * eligible * a + wh * 100 * highSignal * eligible,
        100 * eligible * a,
      );
      evidence[domainId] = { score: evidenceScore, label: band(EVIDENCE_LABELS, evidenceScore).label };
    } else {
      evidence[domainId] = null;
    }

    domains[domainId] = score;
    domainTrace[domainId] = {
      question_ids: items.map((it) => it.question_id),
      points: Object.fromEntries(items.map((it) => [it.question_id, input[it.question_id as `Q${number}`]])),
      weights: Object.fromEntries(items.map((it) => [it.question_id, it.weight])),
      answered: answered.length,
      eligible,
      numerator,
      denominator,
      score,
      consistency,
    };
  }

  // ---- SC-002 Biological State: mean of available domain scores; null below 5 domains
  const available = DOMAIN_ORDER.filter((d) => domains[d] !== null);
  const unavailable = DOMAIN_ORDER.filter((d) => domains[d] === null);
  const domainSum = available.reduce((a, d) => a + (domains[d] as number), 0);
  const biologicalState = available.length >= BIOLOGICAL_STATE_MIN_DOMAINS ? roundRatio(domainSum, available.length) : null;

  // ---- SC-003 Opportunity: 100 - BS x 0.5, one decimal, clamped 0-100 (in tenths)
  let opportunity: number | null = null;
  if (biologicalState !== null) {
    const tenths = 1000 - scaled(OPPORTUNITY_FACTOR, 10) * biologicalState;
    opportunity = Math.min(1000, Math.max(0, tenths)) / 10;
  }

  // ---- SC-004 Protective Factor Score
  const factors = { P1: input.P1, P2: input.P2, P3: input.P3, P4: input.P4, P5: input.P5 };
  const protectiveCount = Object.values(factors).filter(Boolean).length;
  const protectiveScore = PROTECTIVE_POINTS_PER_FACTOR * protectiveCount;

  // ---- SC-005 Recovery Potential
  const ageBand = AGE_BANDS.find((b) => input.age >= b.min && input.age <= b.max);
  if (!ageBand) throw new ScoringInputError(`age ${input.age} is outside the C-02 age bands (16-110)`);
  const conditionValue =
    input.diseaseCount === null ? null : CONDITION_VALUES[Math.min(input.diseaseCount, CONDITION_VALUES.length - 1)];
  const medicationValue =
    input.medicationCount === null ? null : MEDICATION_VALUES[Math.min(input.medicationCount, MEDICATION_VALUES.length - 1)];

  const limitations: string[] = [];
  if (conditionValue === null) limitations.push('RECOVERY_CONDITION_UNAVAILABLE');
  if (medicationValue === null) limitations.push('RECOVERY_MEDICATION_UNAVAILABLE');

  let recoveryPotential: number | null = null;
  let contributions: Record<string, number> | null = null;
  if (biologicalState !== null && conditionValue !== null && medicationValue !== null) {
    // Weights as integer hundredths; the weighted sum is then exact in hundredths.
    const w = {
      inverseBiologicalState: scaled(RECOVERY_WEIGHTS.inverseBiologicalState, 100),
      protective: scaled(RECOVERY_WEIGHTS.protective, 100),
      age: scaled(RECOVERY_WEIGHTS.age, 100),
      condition: scaled(RECOVERY_WEIGHTS.condition, 100),
      medication: scaled(RECOVERY_WEIGHTS.medication, 100),
    };
    const parts = {
      inverse_biological_state: w.inverseBiologicalState * (100 - biologicalState),
      protective: w.protective * protectiveScore,
      age: w.age * ageBand.value,
      condition: w.condition * conditionValue,
      medication: w.medication * medicationValue,
    };
    const hundredths = Object.values(parts).reduce((a, v) => a + v, 0);
    const tenths = Math.min(1000, Math.max(0, roundRatio(hundredths, 10)));
    recoveryPotential = tenths / 10;
    contributions = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, v / 100]));
  }

  // ---- SC-006 overall coverage and SC-008 ROOTS Confidence
  const eligibleTotal = SCORED_ITEMS.length;
  const coveragePercent = roundRatio(100 * answeredTotal, eligibleTotal);
  const consistencyDomains = DOMAIN_ORDER.filter((d) => domainTrace[d].consistency !== null);
  const consistencySum = consistencyDomains.reduce((a, d) => a + (domainTrace[d].consistency as { score: number }).score, 0);
  const wCov = scaled(CONFIDENCE_WEIGHTS.coverage, 10);
  const wAns = scaled(CONFIDENCE_WEIGHTS.answerConfidence, 10);
  const wCon = scaled(CONFIDENCE_WEIGHTS.consistency, 10);
  const k = consistencyDomains.length;
  // The consistency term is 0 when no domain has a consistency value (C-02 SC-008).
  const confidence =
    k === 0
      ? roundRatio(wCov * coveragePercent + wAns * input.answerConfidence, 10)
      : roundRatio((wCov * coveragePercent + wAns * input.answerConfidence) * k + wCon * consistencySum, 10 * k);

  // ---- DRV-001..004 drivers (v1.0.1)
  // All available domains are recorded as candidates; only those >= 25 are eligible (DRV-001).
  const ranked = available
    .map((d) => ({ domain_id: d, score: domains[d] as number }))
    .sort((a, b) => b.score - a.score || DOMAIN_ORDER.indexOf(a.domain_id) - DOMAIN_ORDER.indexOf(b.domain_id));
  const eligible = ranked.filter((r) => r.score >= DRIVER_RULES.eligibilityMin);
  const topScore = ranked.length ? ranked[0].score : null;
  let drivers: string[] = [];
  let tieDelta: number | null = null;
  let coPrimary = false;
  let reason: string;
  if (eligible.length === 0) {
    reason = topScore === null ? 'no available domain' : `no domain at or above ${DRIVER_RULES.eligibilityMin}`;
  } else {
    tieDelta = eligible.length > 1 ? eligible[0].score - eligible[1].score : null;
    coPrimary = tieDelta !== null && tieDelta <= DRIVER_RULES.coPrimaryMaxDelta;
    if (coPrimary) {
      // DRV-003: the pair once, then the next distinct eligible domain if one exists.
      drivers = [`${eligible[0].domain_id}+${eligible[1].domain_id} co-primary`, ...eligible.slice(2, 3).map((r) => r.domain_id)];
      reason = `top two eligible within ${DRIVER_RULES.coPrimaryMaxDelta} points`;
    } else {
      drivers = eligible.slice(0, DRIVER_RULES.count).map((r) => r.domain_id);
      reason = 'single primary';
    }
  }

  // ---- classifications
  const domainClasses = {} as Record<DomainId, Classification | null>;
  for (const d of DOMAIN_ORDER) {
    domainClasses[d] = domains[d] === null ? null : asClassification(band(CLASSIFICATIONS.DOMAIN, domains[d] as number));
  }

  return {
    dataset_id: DATASET_ID,
    scoring_version: SCORING_VERSION,
    domains,
    coverage,
    biological_state: biologicalState,
    opportunity,
    recovery_potential: recoveryPotential,
    protective_count: protectiveCount,
    confidence,
    drivers,
    classifications: {
      domains: domainClasses,
      confidence: asClassification(band(CLASSIFICATIONS.CONFIDENCE, confidence)),
      recovery: recoveryPotential === null ? null : asClassification(band(CLASSIFICATIONS.RECOVERY, recoveryPotential)),
    },
    evidence,
    limitations,
    trace: {
      domains: domainTrace,
      biological_state: { available, unavailable, sum: domainSum, value: biologicalState },
      opportunity: { biological_state: biologicalState, factor: OPPORTUNITY_FACTOR, value: opportunity },
      protective: { factors, count: protectiveCount, score: protectiveScore },
      recovery: {
        biological_state: biologicalState,
        age: input.age,
        age_value: ageBand.value,
        condition_value: conditionValue,
        medication_value: medicationValue,
        protective_score: protectiveScore,
        contributions,
        value: recoveryPotential,
      },
      coverage: { answered: answeredTotal, eligible: eligibleTotal, percent: coveragePercent },
      confidence: {
        coverage_percent: coveragePercent,
        answer_confidence: input.answerConfidence,
        mean_consistency: k === 0 ? null : consistencySum / k,
        consistency_domains: consistencyDomains,
        value: confidence,
      },
      drivers: { candidates: ranked, eligible: eligible.map((r) => r.domain_id), top_score: topScore, tie_delta: tieDelta, co_primary: coPrimary, reason },
    },
  };
}

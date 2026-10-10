import { allQuestions } from "@/lib/canonicalAssessment";
import {
  BIO_STATE,
  DOMAIN_LABELS,
  DOMAIN_MODEL,
  DOMAIN_TIE_ORDER,
  type DomainId,
  canonicalVersionIdentity,
  CANONICAL_VERSIONS,
} from "@/lib/canonical/source";

/** C-02 JSON object order; distinct from the driver tie order. */
export const DOMAIN_OUTPUT_ORDER = ["MR", "SR", "HS", "SL", "IB", "CH", "BS"] as const;

/**
 * Deterministic seven-domain scoring engine.
 *
 * Controlled source: C-02 Canonical Scoring Rules & Golden Tests v1.0.1 CORRECTED.
 *
 * M2 control rule: the deterministic engine is the SOLE authority for scores,
 * classifications, Biological State, drivers, thresholds, eligibility and
 * missing-data behaviour. No AI/LLM component may calculate, modify, override
 * or select any of these values. This module is pure and deterministic: the
 * same answers always produce the same result.
 */

export const domainOrder = DOMAIN_TIE_ORDER;
export type { DomainId };
export { BIO_STATE };

export type DriverId = DomainId | `${DomainId}+${DomainId} co-primary`;

export interface ScoringContext {
  age?: number;
  diseaseCount?: number;
  medicationCount?: number;
  P1?: boolean;
  P2?: boolean;
  P3?: boolean;
  P4?: boolean;
  P5?: boolean;
  answerConfidence?: number;
}

export interface FactorTrace {
  age: number | null;
  condition: number | null;
  medication: number | null;
  protective: {
    P1: boolean;
    P2: boolean;
    P3: boolean;
    P4: boolean;
    P5: boolean;
  };
  limitations: string[];
}

export interface ScoringResult {
  /** Version identity the result was produced under (reproducibility). */
  versions: typeof CANONICAL_VERSIONS;
  versionIdentity: string;
  /** Domain scores in the C-02 output order: MR, SR, HS, SL, IB, CH, BS. */
  domains: Record<DomainId, number | null>;
  /** Per-domain answered/eligible ratios, including null-domain coverage. */
  coverage: Record<DomainId, number>;
  /** Per-domain consistency (0-100), using raw option points as C-02 SC-007. */
  consistency: Record<DomainId, number | null>;
  classifications: Record<DomainId, string | null>;
  biologicalState: number | null;
  biologicalStateLabel: string | null;
  biologicalStateAvailable: boolean;
  biologicalStateClassification: string | null;
  /** C-02 SC-003. */
  opportunity: number | null;
  /** C-02 SC-004. */
  protectiveCount: number;
  protectiveScore: number;
  /** C-02 SC-005. */
  recoveryPotential: number | null;
  recoveryClassification: string | null;
  /** C-02 SC-006 and SC-008. */
  overallCoverage: number;
  confidence: number;
  confidenceLabel: string;
  /** Exact deterministic C-02 driver entries; a pair is one entry. */
  drivers: DriverId[];
  coPrimary: boolean;
  overallScore: number | null;
  band: string | null;
  scoredDomainCount: number;
  factorTrace: FactorTrace;
}

/** Canonical integer rounding: half away from zero. */
export function roundHalfAwayFromZero(value: number): number {
  return value >= 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return roundHalfAwayFromZero(value * factor) / factor;
}

function optionPoints(questionId: string, value: unknown): number | null {
  if (value === null || value === undefined || value === "" || value === "NA") return null;
  if (Array.isArray(value)) return null;
  const question = allQuestions.find((item) => item.id === questionId);
  const options = question?.options;
  if (options) {
    if (typeof value !== "string") return null;
    const option = options.find((item) => item.id === value);
    if (!option || option.isNa || typeof option.points !== "number") return null;
    return option.points;
  }
  const numeric = Number(value);
  return typeof value !== "boolean" && Number.isFinite(numeric) ? numeric : null;
}

/** Resolve a validated C-01 option to its final burden point, including reverse scoring. */
function burdenPoints(questionId: string, value: unknown): number | null {
  const raw = optionPoints(questionId, value);
  if (raw === null) return null;
  const question = allQuestions.find((item) => item.id === questionId);
  return question?.reverseScored ? DOMAIN_MODEL.rawBurdenMax - raw : raw;
}

function populationStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function consistency(points: number[]): number {
  if (points.length === 0) return 0;
  return roundHalfAwayFromZero(Math.max(0, 1 - populationStandardDeviation(points) / 2) * 100);
}

function arrayAnswer(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return typeof value === "string" ? [value] : [];
}

function ageBand(age: number): number {
  return age <= 30 ? 100 : age <= 45 ? 80 : age <= 60 ? 60 : age <= 75 ? 40 : 20;
}

function diseaseBand(count: number): number {
  return count <= 0 ? 100 : count === 1 ? 75 : count === 2 ? 50 : 25;
}

function medicationBand(count: number): number {
  return count <= 0 ? 100 : count === 1 ? 75 : 50;
}

function deriveFactorContext(answers: Record<string, unknown>): { trace: FactorTrace; confidence: number | null } {
  const ageValue = Number(answers.Q1);
  const age = Number.isFinite(ageValue) ? ageBand(ageValue) : null;
  const diseaseSelections = arrayAnswer(answers.Q13).filter((id) => !["NONE", "PREFER_NOT", "NA"].includes(id));
  const medicationSelections = arrayAnswer(answers.Q14).filter((id) => !["NONE", "PREFER_NOT", "UNSURE", "NA"].includes(id));
  const diseaseUnavailable = arrayAnswer(answers.Q13).some((id) => ["PREFER_NOT", "NA"].includes(id));
  const medicationUnavailable = arrayAnswer(answers.Q14).some((id) => ["UNSURE", "PREFER_NOT", "NA"].includes(id));
  const limitations: string[] = [];
  if (diseaseUnavailable) limitations.push("CONDITION");
  if (medicationUnavailable) limitations.push("MEDICATION");
  const trace: FactorTrace = {
    age,
    condition: diseaseUnavailable ? null : diseaseBand(diseaseSelections.length),
    medication: medicationUnavailable ? null : medicationBand(medicationSelections.length),
    protective: {
      P1: ["D3_4", "D5_7"].includes(String(answers.Q46)) && ["M30_59", "M60_PLUS"].includes(String(answers.Q47)),
      P2: ["OFT", "ALW"].includes(String(answers.Q64)),
      P3: ["GOOD", "STRONG"].includes(String(answers.Q65)),
      P4: ["NEVER", "FORMER"].includes(String(answers.Q61)),
      P5: typeof answers.Q69 === "number" && answers.Q69 >= 7 && answers.Q69 <= 10,
    },
    limitations,
  };
  return { trace, confidence: optionPoints("Q72", answers.Q72) };
}

function mergeFactorContext(derived: FactorTrace, context: ScoringContext): FactorTrace {
  return {
    age: context.age === undefined ? derived.age : ageBand(context.age),
    condition: context.diseaseCount === undefined ? derived.condition : diseaseBand(context.diseaseCount),
    medication: context.medicationCount === undefined ? derived.medication : medicationBand(context.medicationCount),
    protective: {
      P1: context.P1 ?? derived.protective.P1,
      P2: context.P2 ?? derived.protective.P2,
      P3: context.P3 ?? derived.protective.P3,
      P4: context.P4 ?? derived.protective.P4,
      P5: context.P5 ?? derived.protective.P5,
    },
    limitations: [...derived.limitations],
  };
}

/** Canonical domain classification bands. */
export function classification(score: number | null): string | null {
  if (score === null) return null;
  if (score <= 24) return "Optimized";
  if (score <= 49) return "Compensating";
  if (score <= 74) return "Strained";
  return "Dysregulated";
}

export function confidenceClassification(score: number): string {
  if (score >= 80) return "High";
  if (score >= 60) return "Moderate-High";
  if (score >= 40) return "Moderate";
  return "Low";
}

export function recoveryClassification(score: number | null): string | null {
  if (score === null) return null;
  if (score >= 75) return "High";
  if (score >= 50) return "Moderate";
  if (score >= 25) return "Limited";
  return "Low";
}

function calculateScoresInternal(
  answers: Record<string, unknown>,
  suppliedContext?: ScoringContext,
  normalizedInput?: Record<string, unknown>,
): ScoringResult {
  const max = DOMAIN_MODEL.rawBurdenMax;
  const totals = Object.fromEntries(
    DOMAIN_TIE_ORDER.map((domain) => [domain, { points: 0, answered: 0, eligible: 0, consistencyPoints: [] as number[] }]),
  ) as Record<DomainId, { points: number; answered: number; eligible: number; consistencyPoints: number[] }>;

  for (const question of allQuestions) {
    if (!question.scoringEligible || !question.domain) continue;
    const domain = question.domain as DomainId;
    const total = totals[domain];
    total.eligible += 1;
    const hasNormalized = normalizedInput !== undefined && Object.prototype.hasOwnProperty.call(normalizedInput, question.id);
    const normalizedValue = hasNormalized ? normalizedInput[question.id] : undefined;
    const points = hasNormalized
      ? typeof normalizedValue === "number" && Number.isFinite(normalizedValue) && normalizedValue >= 0 && normalizedValue <= DOMAIN_MODEL.rawBurdenMax
        ? normalizedValue
        : null
      : burdenPoints(question.id, answers[question.id]);
    if (points === null) continue;
    total.answered += 1;
    total.points += points;
    total.consistencyPoints.push(points);
  }

  const domains = {} as Record<DomainId, number | null>;
  const coverage = {} as Record<DomainId, number>;
  const consistencyByDomain = {} as Record<DomainId, number | null>;
  const classifications = {} as Record<DomainId, string | null>;
  for (const domain of DOMAIN_TIE_ORDER) {
    const total = totals[domain];
    const ratio = total.eligible ? total.answered / total.eligible : 0;
    coverage[domain] = ratio;
    if (ratio < DOMAIN_MODEL.coverageThreshold || total.answered === 0) {
      domains[domain] = null;
      consistencyByDomain[domain] = null;
    } else {
      domains[domain] = roundHalfAwayFromZero((total.points / (total.answered * max)) * 100);
      consistencyByDomain[domain] = consistency(total.consistencyPoints);
    }
    classifications[domain] = classification(domains[domain]);
  }

  const available = DOMAIN_TIE_ORDER.filter((domain) => domains[domain] !== null);
  const biologicalState = available.length >= DOMAIN_MODEL.biologicalStateRequiredDomains
    ? roundHalfAwayFromZero(available.reduce((sum, domain) => sum + (domains[domain] as number), 0) / available.length)
    : null;
  const derived = deriveFactorContext(answers);
  const factorTrace = suppliedContext ? mergeFactorContext(derived.trace, suppliedContext) : derived.trace;
  const answerConfidence = suppliedContext?.answerConfidence ?? derived.confidence;
  const eligibleDomains = DOMAIN_TIE_ORDER
    .filter((domain) => domains[domain] !== null && (domains[domain] as number) >= DOMAIN_MODEL.driverEligibilityFloor)
    .slice()
    .sort((a, b) => (domains[b] as number) - (domains[a] as number) || DOMAIN_TIE_ORDER.indexOf(a) - DOMAIN_TIE_ORDER.indexOf(b));
  const drivers: DriverId[] = [];
  let coPrimary = false;
  if (eligibleDomains.length >= 2 && (domains[eligibleDomains[0]] as number) - (domains[eligibleDomains[1]] as number) <= DOMAIN_MODEL.coPrimaryGap) {
    coPrimary = true;
    drivers.push(`${eligibleDomains[0]}+${eligibleDomains[1]} co-primary` as DriverId);
    if (eligibleDomains[2]) drivers.push(eligibleDomains[2]);
  } else {
    drivers.push(...eligibleDomains.slice(0, DOMAIN_MODEL.driverMaxEntries));
  }
  const opportunity = biologicalState === null ? null : roundTo(Math.min(100, Math.max(0, 100 - biologicalState * 0.5)), 1);
  const protectiveCount = Object.values(factorTrace.protective).filter(Boolean).length;
  const protectiveScore = protectiveCount * 20;
  const recoveryPotential = biologicalState === null || factorTrace.age === null || factorTrace.condition === null || factorTrace.medication === null
    ? null
    : roundTo(Math.min(100, Math.max(0, 0.30 * (100 - biologicalState) + 0.25 * protectiveScore + 0.20 * factorTrace.age + 0.15 * factorTrace.condition + 0.10 * factorTrace.medication)), 1);
  const totalEligible = Object.values(totals).reduce((sum, total) => sum + total.eligible, 0);
  const totalAnswered = Object.values(totals).reduce((sum, total) => sum + total.answered, 0);
  const overallCoverage = totalEligible ? roundHalfAwayFromZero((totalAnswered / totalEligible) * 100) : 0;
  const availableConsistency = available.map((domain) => consistencyByDomain[domain] as number);
  const meanConsistency = availableConsistency.length ? availableConsistency.reduce((sum, value) => sum + value, 0) / availableConsistency.length : 0;
  const confidence = roundHalfAwayFromZero(Math.min(100, Math.max(0, 0.50 * overallCoverage + 0.30 * (answerConfidence ?? 0) + 0.20 * meanConsistency)));
  const biologicalStateClassification = classification(biologicalState);
  return {
    versions: CANONICAL_VERSIONS,
    versionIdentity: canonicalVersionIdentity(),
    domains,
    coverage,
    consistency: consistencyByDomain,
    classifications,
    biologicalState,
    biologicalStateLabel: biologicalStateClassification,
    biologicalStateAvailable: biologicalState !== null,
    biologicalStateClassification,
    opportunity,
    protectiveCount,
    protectiveScore,
    recoveryPotential,
    recoveryClassification: recoveryClassification(recoveryPotential),
    overallCoverage,
    confidence,
    confidenceLabel: confidenceClassification(confidence),
    drivers,
    coPrimary,
    overallScore: biologicalState,
    band: biologicalStateClassification,
    scoredDomainCount: available.length,
    factorTrace,
  };
}

/** Production/server entry point: answers must contain approved C-01 values. */
export function calculateScores(
  answers: Record<string, unknown>,
  suppliedContext?: ScoringContext,
): ScoringResult {
  return calculateScoresInternal(answers, suppliedContext);
}

/**
 * Execute a C-02 workbook Golden Test from its preserved normalized burden
 * input. This named replay entry point is not used by assessment submission;
 * production requests must provide approved C-01 option IDs.
 */
export function calculateScoresFromNormalizedInput(
  normalizedInput: Record<string, unknown>,
  context: ScoringContext,
): ScoringResult {
  return calculateScoresInternal({}, context, normalizedInput);
}

export { DOMAIN_LABELS, DOMAIN_MODEL };
/**
 * Report selection rules: which micro-actions, concerns and laboratory prompts a report shows.
 *
 * C-03 names these rules ("rules library", "approved eligibility rules") but does not define
 * most of them. Each rule below is the least presumptuous reading of C-03's own wording, kept
 * in one place so ROOTS can confirm or replace it without touching the builder. None of them
 * can change a score: they read the C-02 result, they never write to it.
 */

import type { RawAnswer } from '../assessment/validation';
import type { DomainId } from '../scoring/c02-ruleset';
import type { ScoringResult } from '../scoring/engine';
import type { LabId } from './c03-content';

/** C-02 burden points at or above which a frequency answer counts as "persistent" (Often / Almost always). */
export const PERSISTENT_MIN_POINTS = 3;

/** C-02 DRV-001: domains below this are not drivers — used here as the micro-action eligibility floor. */
export const ACTION_ELIGIBILITY_MIN = 25;

/** C-03 §4.12: rank 3-5 micro-actions. */
export const ACTION_MAX = 5;

/** C-03 §3: 75-100 Dysregulated — the band whose copy already invites professional discussion. */
export const CONCERN_MIN_SCORE = 75;

type Ranked = { domain_id: DomainId; score: number };

/** Available domains, highest burden first, ties in the C-02 order. */
export function rankedDomains(scoring: ScoringResult): Ranked[] {
  return scoring.trace.drivers.candidates as Ranked[];
}

/**
 * RULE-ROADMAP (C-03 §4.10): Month 1 carries the primary driver's micro-action, Month 2 the
 * secondary's, Month 3 reinforces whichever routine proved sustainable. At most one action per
 * month, within the "no more than three" limit. With no drivers, no action is selected.
 */
export function roadmapDomains(scoring: ScoringResult): (DomainId | null)[] {
  if (scoring.drivers.length === 0) return [null, null, null];
  const ranked = rankedDomains(scoring);
  return [ranked[0]?.domain_id ?? null, ranked[1]?.domain_id ?? null, null];
}

/**
 * RULE-ACTIONS (C-03 §4.12): micro-actions for domains at or above the driver floor, highest
 * burden first, up to five. Fewer than three are shown only when fewer domains qualify — the
 * library is never padded with actions for areas that did not show burden.
 */
export function actionDomains(scoring: ScoringResult): DomainId[] {
  return rankedDomains(scoring)
    .filter((r) => r.score >= ACTION_ELIGIBILITY_MIN)
    .slice(0, ACTION_MAX)
    .map((r) => r.domain_id);
}

/** RULE-CONCERNS (C-03 §4.14): areas in the Dysregulated band. Question IDs stay in the trace only. */
export function concernDomains(scoring: ScoringResult): DomainId[] {
  return rankedDomains(scoring)
    .filter((r) => r.score >= CONCERN_MIN_SCORE)
    .map((r) => r.domain_id);
}

/** RULE-TRIAD (C-03 §4.8): the "top" protective factor is the first present, in C-02 order P1-P5. */
export function topProtectiveFactor(factors: Record<'P1' | 'P2' | 'P3' | 'P4' | 'P5', boolean>) {
  return (['P1', 'P2', 'P3', 'P4', 'P5'] as const).find((p) => factors[p]) ?? null;
}

const listOf = (v: RawAnswer | undefined) => (Array.isArray(v) ? v : []);

/**
 * RULE-LAB (C-03 §6). "Persistent" means Often or Almost always. Each prompt is an optional
 * discussion suggestion only; the library's own limits apply (no test ordered or interpreted,
 * no condition labelled).
 */
export function eligibleLabPrompts(scoring: ScoringResult, answers: Readonly<Record<string, RawAnswer>>): LabId[] {
  const persistent = (questionId: string) => {
    const points = Object.values(scoring.trace.domains).find((d) => questionId in d.points)?.points[questionId];
    return typeof points === 'number' && points >= PERSISTENT_MIN_POINTS;
  };
  const conditions = listOf(answers.Q13);
  const mr = scoring.domains.MR;
  const ib = scoring.domains.IB;

  const eligible: LabId[] = [];
  // Self-reported metabolic concern (Metabolic Resistance in the Strained band or above) or Q13 metabolic context.
  if (conditions.includes('T2D') || conditions.includes('PREDIABETES') || (mr !== null && mr >= 50)) eligible.push('GLUCOSE');
  // Persistent fatigue (Q17 tired after rest, Q51 low energy), or Q13 thyroid context.
  if (conditions.includes('THYROID') || persistent('Q17') || persistent('Q51')) eligible.push('THYROID');
  // Cardiometabolic context from Q13.
  if (conditions.includes('HTN') || conditions.includes('DYSLIPID')) eligible.push('CARDIOMETABOLIC');
  // Persistent non-specific symptoms: Inflammation Burden in the Strained band or above.
  if (ib !== null && ib >= 50) eligible.push('NON_SPECIFIC');
  // Snoring / gasping signal (Q21).
  if (persistent('Q21')) eligible.push('SLEEP');
  return eligible;
}

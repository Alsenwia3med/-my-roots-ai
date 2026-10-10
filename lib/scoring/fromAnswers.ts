/**
 * Saved C-01 answers -> the engine's normalized input.
 *
 * This is the only place C-01 option IDs meet C-02 points. Burden points always come from the
 * explicit C-02 option table (SCORED_ITEMS[].points), never from C-01's stored_value: for
 * Q26 and Q28 those differ, because C-02 reverse-scores them.
 *
 * Answers arrive as saved by the autosave route (lib/assessment/validation.ts RawAnswer):
 * an option ID for single-select and Likert items, an array of option IDs for multi-select,
 * a number for integer and scale items, and { na: true } for a separately offered N/A.
 */

import { OPTION_SETS } from '../assessment/questionBank';
import type { RawAnswer } from '../assessment/validation';
import {
  CONDITION_UNAVAILABLE_OPTIONS,
  FACTOR_SOURCES,
  MEDICATION_UNAVAILABLE_OPTIONS,
  NONE_OPTION,
  PROTECTIVE_FACTORS,
  SCORED_ITEMS,
} from './c02-ruleset';
import { ScoringInputError, type NormalizedInput } from './engine';

export interface NormalizedAnswers {
  input: NormalizedInput;
  /** The option ID behind each scored item's points, for the audit trace (C-02 SC-001). */
  raw_option_ids: Record<string, string | null>;
}

const isNa = (v: RawAnswer | undefined): boolean =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && 'na' in v;

const optionId = (v: RawAnswer | undefined): string | null => (typeof v === 'string' ? v : null);

function naOptionIds(optionSetId: string): Set<string> {
  return new Set((OPTION_SETS[optionSetId] ?? []).filter((o) => o.is_na).map((o) => o.option_id));
}

/** Selected categories on Q13 / Q14, or null when the factor is unavailable. */
function categoryCount(v: RawAnswer | undefined, unavailable: readonly string[]): number | null {
  if (v === undefined || isNa(v)) return null;
  if (!Array.isArray(v)) throw new ScoringInputError(`expected a list of option IDs (got ${JSON.stringify(v)})`);
  if (v.some((id) => unavailable.includes(id))) return null;
  return v.filter((id) => id !== NONE_OPTION).length;
}

export function normalizeAnswers(answers: Readonly<Record<string, RawAnswer>>): NormalizedAnswers {
  const input = {} as NormalizedInput;
  const raw_option_ids: Record<string, string | null> = {};

  // ---- the 40 scored items
  for (const it of SCORED_ITEMS) {
    const v = answers[it.question_id];
    const key = it.question_id as `Q${number}`;
    if (v === undefined || isNa(v)) {
      input[key] = null;
      raw_option_ids[it.question_id] = null;
      continue;
    }
    const id = optionId(v);
    if (id === null) throw new ScoringInputError(`${it.question_id}: expected an option ID (got ${JSON.stringify(v)})`);
    raw_option_ids[it.question_id] = id;
    if (id in it.points) {
      input[key] = it.points[id];
    } else if (naOptionIds(it.option_set_id).has(id)) {
      input[key] = null; // N/A carries no points and is excluded (C-02 p.5)
    } else {
      throw new ScoringInputError(`${it.question_id}: option ${id} has no C-02 points`);
    }
  }

  // ---- recovery and confidence inputs
  const age = answers[FACTOR_SOURCES.age];
  if (typeof age !== 'number') throw new ScoringInputError(`${FACTOR_SOURCES.age} (age) is required`);
  input.age = age;

  input.diseaseCount = categoryCount(answers[FACTOR_SOURCES.condition], CONDITION_UNAVAILABLE_OPTIONS);
  input.medicationCount = categoryCount(answers[FACTOR_SOURCES.medication], MEDICATION_UNAVAILABLE_OPTIONS);

  const confidenceId = optionId(answers[FACTOR_SOURCES.answerConfidence]);
  const confidenceOption = (OPTION_SETS.ANSWER_CONFIDENCE ?? []).find((o) => o.option_id === confidenceId);
  if (!confidenceOption || confidenceOption.stored_value === null) {
    throw new ScoringInputError(`${FACTOR_SOURCES.answerConfidence} (answer confidence) is required`);
  }
  input.answerConfidence = confidenceOption.stored_value;

  // ---- protective factors (C-02 p.13)
  const is = (questionId: string, allowed: readonly string[]) => allowed.includes(optionId(answers[questionId]) ?? '');
  input.P1 = is('Q46', PROTECTIVE_FACTORS.P1.Q46) && is('Q47', PROTECTIVE_FACTORS.P1.Q47);
  input.P2 = is('Q64', PROTECTIVE_FACTORS.P2.Q64);
  input.P3 = is('Q65', PROTECTIVE_FACTORS.P3.Q65);
  input.P4 = is('Q61', PROTECTIVE_FACTORS.P4.Q61);
  const readiness = answers.Q69;
  input.P5 =
    typeof readiness === 'number' && readiness >= PROTECTIVE_FACTORS.P5.Q69.min && readiness <= PROTECTIVE_FACTORS.P5.Q69.max;

  return { input, raw_option_ids };
}

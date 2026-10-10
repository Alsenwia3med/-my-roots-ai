/**
 * The approved narrative output schema (Regulatory Readiness Annex AI-02: "AI response schema
 * contains narrative fields only and cannot carry authoritative score-bearing keys";
 * C-03 §7: "Output is JSON matching the approved section schema; every section has a length
 * limit and deterministic fallback").
 *
 * Only the three C-03 governed-narrative sections are generated:
 *   §4.2  Executive Summary  — two short paragraphs, 90-160 words
 *   §4.9  Future Projection  — 3-4 conditional bullets
 *   §4.18 Final Word         — 50-100 words
 *
 * Sections 3, 4, 5, 6, 7 and 17 are deterministic and are never produced here, so a model cannot
 * restate a score even by accident. Two defences are applied on top of the shape check:
 *
 *   1. `SCORE_BEARING_KEYS` — any key that could carry an authoritative value is rejected
 *      anywhere in the response, at any depth, even though the schema has no place for one.
 *      A model that invents `{"biological_state": 61}` is refused, not silently ignored.
 *   2. `containsNumeral` — narrative text may not contain digits at all. Every number in the
 *      report comes from the deterministic engine and is rendered by the report builder, so a
 *      numeral in generated prose can only be a restated or hallucinated value (AI-09).
 */

import { z } from 'zod';

export const NarrativeSchema = z
  .object({
    executive_summary: z.array(z.string().min(1).max(1200)).length(2),
    future_projection: z.array(z.string().min(1).max(400)).min(3).max(4),
    final_word: z.string().min(1).max(900),
  })
  .strict();

export type Narrative = z.infer<typeof NarrativeSchema>;

/** C-03 word limits, checked after the shape. */
export const WORD_LIMITS = {
  executive_summary: { min: 90, max: 160 },
  final_word: { min: 50, max: 100 },
} as const;

/**
 * Keys that carry authoritative meaning. None belongs in a narrative response; their presence
 * means the model tried to produce a result rather than describe one.
 */
export const SCORE_BEARING_KEYS: readonly string[] = [
  'biological_state',
  'biological_state_classification',
  'opportunity_score',
  'opportunity',
  'recovery_potential',
  'recovery',
  'confidence',
  'confidence_score',
  'confidence_label',
  'domain_scores',
  'domain_score',
  'domains',
  'score',
  'scores',
  'classification',
  'classifications',
  'drivers',
  'driver',
  'primary_driver',
  'secondary_driver',
  'tertiary_driver',
  'protective_factors',
  'limitations',
  'questionnaire_version',
  'scoring_version',
];

export type SchemaRejection = { ok: false; reason: string };
export type SchemaAcceptance = { ok: true; narrative: Narrative };

export function validateNarrative(value: unknown): SchemaAcceptance | SchemaRejection {
  const offendingKey = findScoreBearingKey(value);
  if (offendingKey) return { ok: false, reason: `score-bearing key "${offendingKey}" in narrative response` };

  const parsed = NarrativeSchema.safeParse(value);
  if (!parsed.success) return { ok: false, reason: `schema: ${parsed.error.issues[0]?.message ?? 'invalid'}` };

  const narrative = parsed.data;

  const summaryWords = countWords(narrative.executive_summary.join(' '));
  if (summaryWords < WORD_LIMITS.executive_summary.min || summaryWords > WORD_LIMITS.executive_summary.max) {
    return { ok: false, reason: `executive_summary is ${summaryWords} words, C-03 §4.2 allows 90-160` };
  }

  const finalWords = countWords(narrative.final_word);
  if (finalWords < WORD_LIMITS.final_word.min || finalWords > WORD_LIMITS.final_word.max) {
    return { ok: false, reason: `final_word is ${finalWords} words, C-03 §4.18 allows 50-100` };
  }

  for (const text of narrativeText(narrative)) {
    if (containsNumeral(text)) return { ok: false, reason: 'narrative contains a numeral; all values are deterministic' };
  }

  return { ok: true, narrative };
}

/** Every generated string, for the language and numeral checks. */
export function narrativeText(narrative: Narrative): string[] {
  return [...narrative.executive_summary, ...narrative.future_projection, narrative.final_word];
}

/** Digits in any form, including those dressed up as words inside a number ("61/100"). */
export function containsNumeral(text: string): boolean {
  return /\d/.test(text);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Walks the whole response, so a nested `{"meta": {"drivers": [...]}}` is caught too. */
function findScoreBearingKey(value: unknown, depth = 0): string | null {
  if (depth > 8 || value === null || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findScoreBearingKey(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SCORE_BEARING_KEYS.includes(key.toLowerCase())) return key;
    const found = findScoreBearingKey(child, depth + 1);
    if (found) return found;
  }
  return null;
}

/**
 * Scores a submitted assessment and stores the result (C-02; version from the ruleset).
 *
 * Written with the service role: participants can read their own scores (RLS) but never
 * write them. The insert is ON CONFLICT DO NOTHING on the one-row-per-assessment key, so it is
 * safe to repeat — scoring is deterministic, a repeat would produce the identical row, and the
 * database refuses to change a row once written (scores_guard_immutable).
 */

import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RawAnswer } from '@/lib/assessment/validation';
import { computeScores } from './engine';
import { normalizeAnswers } from './fromAnswers';
import { toScoresRow } from './scoresRow';

export type ScoreOutcome = 'scored' | 'already_scored';

export async function scoreAssessment(
  admin: SupabaseClient,
  assessmentId: string,
  answers: Readonly<Record<string, RawAnswer>>,
): Promise<ScoreOutcome> {
  const { input, raw_option_ids } = normalizeAnswers(answers);
  const result = computeScores(input);

  const { data, error } = await admin
    .from('scores')
    .upsert(toScoresRow(assessmentId, result, raw_option_ids), { onConflict: 'assessment_id', ignoreDuplicates: true })
    .select('id');
  if (error) throw new Error(`scores insert failed: ${error.message}`);
  return data && data.length > 0 ? 'scored' : 'already_scored';
}

/**
 * A participant's own report history (SOW 3.5 "Report History"): every submitted assessment,
 * newest first, with its report status and headline scores.
 *
 * Reads with the participant's session, and filters by profile_id explicitly: RLS alone would
 * also let staff see other people's rows, and this list is "my reports". Only non-sensitive
 * columns are read — the answer-bearing ones are not readable through the API at all.
 */

import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface HistoryEntry {
  assessmentId: string;
  submittedAt: string;
  submissionReference: string | null;
  questionnaireVersion: string;
  report: { id: string; reference: string | null; status: 'generating' | 'completed' | 'failed'; generatedAt: string | null } | null;
  biologicalState: number | null;
  confidenceLabel: string | null;
}

export async function listOwnReports(supabase: SupabaseClient, userId: string): Promise<HistoryEntry[]> {
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('id, submitted_at, submission_reference, questionnaire_version')
    .eq('profile_id', userId)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false });
  if (error) throw new Error(`history lookup failed: ${error.message}`);
  if (!assessments?.length) return [];

  const ids = assessments.map((a) => a.id as string);
  const [reports, scores] = await Promise.all([
    supabase.from('reports').select('id, assessment_id, report_reference, status, generated_at').in('assessment_id', ids),
    supabase.from('scores').select('assessment_id, biological_state, confidence_label').in('assessment_id', ids),
  ]);
  if (reports.error) throw new Error(`report lookup failed: ${reports.error.message}`);
  if (scores.error) throw new Error(`score lookup failed: ${scores.error.message}`);

  return assessments.map((a) => {
    const r = (reports.data ?? []).find((x) => x.assessment_id === a.id);
    const s = (scores.data ?? []).find((x) => x.assessment_id === a.id);
    return {
      assessmentId: a.id as string,
      submittedAt: a.submitted_at as string,
      submissionReference: (a.submission_reference as string | null) ?? null,
      questionnaireVersion: a.questionnaire_version as string,
      report: r
        ? { id: r.id as string, reference: (r.report_reference as string | null) ?? null, status: r.status as 'generating' | 'completed' | 'failed', generatedAt: (r.generated_at as string | null) ?? null }
        : null,
      biologicalState: s?.biological_state === null || s?.biological_state === undefined ? null : Number(s.biological_state),
      confidenceLabel: (s?.confidence_label as string | null) ?? null,
    };
  });
}

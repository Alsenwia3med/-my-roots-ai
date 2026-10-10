/**
 * Data-subject rights (UK/EU GDPR): access and portability (Art. 15, 20) and erasure (Art. 17).
 *
 * - Access: the participant downloads everything held about them, as JSON, immediately.
 * - Erasure: the participant requests it; a Super Admin carries it out (with reason, recent MFA
 *   and audit) by deleting the account, which cascades to every participant table. The request
 *   row survives as evidence that erasure was done, holding only the (now unlinked) account ID.
 *   Audit events are retained: they hold no answers, names or emails, only IDs and digests.
 *
 * Service role only, always filtered to the one account the caller has proven access to.
 */

import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface DeletionRequest {
  id: string;
  status: 'pending' | 'completed' | 'rejected' | 'cancelled';
  requested_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
}

/** The latest deletion request, or null. `available: false` before the migration is run. */
export async function latestDeletionRequest(admin: SupabaseClient, profileId: string): Promise<{ available: boolean; request: DeletionRequest | null }> {
  const { data, error } = await admin
    .from('data_requests')
    .select('id, status, requested_at, resolved_at, resolution_note')
    .eq('profile_id', profileId)
    .eq('kind', 'deletion')
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return { available: false, request: null };
    throw new Error(`deletion request lookup failed: ${error.message}`);
  }
  return { available: true, request: (data as DeletionRequest | null) ?? null };
}

export async function pendingDeletionCount(admin: SupabaseClient): Promise<number | null> {
  const { count, error } = await admin.from('data_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending');
  return error ? null : count ?? 0;
}

export async function isStaffAccount(admin: SupabaseClient, profileId: string): Promise<boolean> {
  const { data } = await admin.from('role_assignments').select('id').eq('profile_id', profileId).is('revoked_at', null).in('role', ['admin', 'research_admin', 'super_admin']).limit(1);
  return (data?.length ?? 0) > 0;
}

/** Everything held about one participant, for their own download. */
export async function collectParticipantData(admin: SupabaseClient, userId: string) {
  const [profile, consents, assessments] = await Promise.all([
    admin.from('profiles').select('id, email, display_name, status, locale, created_at, updated_at').eq('id', userId).maybeSingle(),
    admin.from('consents').select('consent_type, granted, purpose, document_version, document_effective_date, withdrawn_at, created_at').eq('profile_id', userId).order('created_at'),
    admin
      .from('assessments')
      .select('id, status, questionnaire_version, progress_percent, started_at, last_saved_at, submitted_at, submission_reference, archived_at')
      .eq('profile_id', userId)
      .order('started_at'),
  ]);
  if (profile.error || consents.error || assessments.error) throw new Error('data export lookup failed');

  const ids = (assessments.data ?? []).map((a) => a.id as string);
  const [responses, scores, reports] = ids.length
    ? await Promise.all([
        // `answered_at` is the column the schema defines; `responses` has no `updated_at`, and
        // selecting one made the whole export fail with a 503.
        admin.from('responses').select('assessment_id, question_id, raw_value, answered_at').in('assessment_id', ids),
        admin.from('scores').select('*').in('assessment_id', ids),
        admin.from('reports').select('assessment_id, report_reference, report_version, status, generated_at, first_viewed_at, canonical_json').in('assessment_id', ids),
      ])
    : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
  if (responses.error || scores.error || reports.error) throw new Error('data export lookup failed');

  return {
    export_format: 'roots-ai-personal-data/1',
    exported_at: new Date().toISOString(),
    notice:
      'This file contains all personal data ROOTS-AI holds about your account: profile, consent decisions, assessments with your answers, calculated scores and reports. Keep it somewhere safe.',
    profile: profile.data,
    consents: consents.data ?? [],
    assessments: (assessments.data ?? []).map((a) => ({
      ...a,
      answers: (responses.data ?? []).filter((r) => r.assessment_id === a.id).map(({ assessment_id: _a, ...r }) => r),
      scores: (scores.data ?? []).find((s) => s.assessment_id === a.id) ?? null,
      report: (reports.data ?? []).find((r) => r.assessment_id === a.id) ?? null,
    })),
  };
}

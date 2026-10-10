/**
 * POST /api/v1/assessments/{id}/submit — review and submit (C-05 ASM-09/ASM-10; C-01 VAL-009).
 * Header: Idempotency-Key: <uuid>
 *
 * The server re-validates every saved answer against C-01 and requires all 71 required
 * questions. The in_progress -> submitted transition is atomic and idempotent: repeating the
 * request with the same key returns the original submission; the saved answers then become an
 * immutable snapshot (enforced in the database).
 *
 * Once the submission is committed the answers are scored (C-02) and the report is generated
 * (C-03). Neither can affect the submission: a failure is logged and audited, and repeating the
 * request with the same key — or ASM-11 "Retry Report Preparation" — finishes the job.
 */

import { randomBytes } from 'node:crypto';
import { apiError, json, requireParticipant, UUID_PATTERN } from '@/lib/api/http';
import { audit } from '@/lib/audit';
import { LIMITS, rateLimited } from '@/lib/api/rateLimit';
import { getOwnedAssessment, loadAnswers } from '@/lib/assessment/store';
import { checkStoredAnswers, VAL } from '@/lib/assessment/validation';
import { finalizeSubmission } from '@/lib/submission/finalize';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ASSESSMENT_SOURCE_VERSIONS } from '@/lib/versions';

export const dynamic = 'force-dynamic';

function submissionReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `RS-${date}-${code}`;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return apiError(404, 'NOT_FOUND', 'Assessment not found.');

  const idempotencyKey = request.headers.get('idempotency-key') ?? '';
  if (!UUID_PATTERN.test(idempotencyKey)) return apiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'A valid Idempotency-Key header is required.');

  const auth = await requireParticipant();
  if ('unauthorized' in auth) return auth.unauthorized;
  const { supabase, user } = auth;

  const limited = await rateLimited(user.id, LIMITS.submit);
  if (limited) return limited;

  const assessment = await getOwnedAssessment(supabase, id);
  if (!assessment) return apiError(404, 'NOT_FOUND', 'Assessment not found.');

  const submitted = (row: { submission_reference: string | null; submitted_at: string | null }) =>
    json({ status: 'submitted', submission_reference: row.submission_reference, submitted_at: row.submitted_at });

  if (assessment.status === 'submitted') {
    if (assessment.submit_idempotency_key !== idempotencyKey) {
      return apiError(409, 'ALREADY_SUBMITTED', 'This assessment has already been submitted.', { submission_reference: assessment.submission_reference });
    }
    // A repeat of the original request: finish scoring and the report if either failed before.
    await finalizeSubmission(assessment, await loadAnswers(supabase, id), user.id);
    return submitted(assessment);
  }
  if (assessment.status !== 'in_progress') return apiError(409, 'ASSESSMENT_CLOSED', 'This assessment can no longer be changed.');

  // Validated again from the stored answers: nothing written around the API can reach scoring.
  const answers = await loadAnswers(supabase, id);
  const check = checkStoredAnswers(answers);
  const invalid = check.invalid;
  if (!check.complete) {
    await audit({ action: 'assessment.submitted', result: 'denied', actorId: user.id, objectType: 'assessment', objectId: id, details: { missing: check.missing.length, invalid: invalid.length } });
    return apiError(422, 'INCOMPLETE', VAL['VAL-009'], { missing: check.missing, invalid });
  }

  const now = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from('assessments')
    .update({
      status: 'submitted',
      submitted_at: now,
      submission_reference: submissionReference(),
      submit_idempotency_key: idempotencyKey,
      progress_percent: 100,
      last_saved_at: now,
    })
    .eq('id', id)
    .eq('profile_id', user.id)
    .eq('status', 'in_progress')
    .select('submission_reference, submitted_at')
    .maybeSingle();

  if (error) {
    console.error('assessment submit failed:', error.message);
    return apiError(503, 'SUBMIT_FAILED', 'The assessment could not be submitted. Your answers are saved.');
  }
  if (!data) {
    // Another request submitted it first; report that outcome rather than a second submission.
    const latest = await getOwnedAssessment(supabase, id);
    if (latest?.status === 'submitted' && latest.submit_idempotency_key === idempotencyKey) return submitted(latest);
    return apiError(409, 'ALREADY_SUBMITTED', 'This assessment has already been submitted.');
  }

  // M2 item 7: an assessment started before sources were recorded gets them now, before scoring.
  await getSupabaseAdmin().from('assessments').update({ source_versions: ASSESSMENT_SOURCE_VERSIONS }).eq('id', id).is('source_versions', null);

  await audit({ action: 'assessment.submitted', result: 'success', actorId: user.id, objectType: 'assessment', objectId: id });
  await finalizeSubmission(assessment, answers, user.id);
  return submitted(data);
}

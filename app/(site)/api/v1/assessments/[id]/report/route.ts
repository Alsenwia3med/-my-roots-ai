/**
 * POST /api/v1/assessments/{id}/report — ASM-11 "Retry Report Preparation".
 *
 * Re-runs report preparation for a submitted assessment the participant owns. It never creates
 * a new submission or touches the submitted snapshot: it only finishes scoring and report
 * generation if either failed before, and does nothing if both already completed.
 */

import { apiError, json, requireParticipant, UUID_PATTERN } from '@/lib/api/http';
import { LIMITS, rateLimited } from '@/lib/api/rateLimit';
import { audit } from '@/lib/audit';
import { getOwnedAssessment, loadAnswers } from '@/lib/assessment/store';
import { finalizeSubmission } from '@/lib/submission/finalize';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return apiError(404, 'NOT_FOUND', 'Assessment not found.');

  const auth = await requireParticipant();
  if ('unauthorized' in auth) return auth.unauthorized;
  const { supabase, user } = auth;

  const assessment = await getOwnedAssessment(supabase, id);
  if (!assessment) return apiError(404, 'NOT_FOUND', 'Assessment not found.');
  if (assessment.status !== 'submitted') return apiError(409, 'NOT_SUBMITTED', 'This assessment has not been submitted.');

  const limited = await rateLimited(user.id, LIMITS.reportRetry);
  if (limited) return limited;
  await audit({ action: 'report.retry.requested', result: 'success', actorId: user.id, objectType: 'assessment', objectId: id });

  const result = await finalizeSubmission(assessment, await loadAnswers(supabase, id), user.id);
  if (result.report !== 'completed') {
    return apiError(503, 'REPORT_UNAVAILABLE', 'The report could not be completed. Please try again later.');
  }
  return json({ status: 'completed' });
}

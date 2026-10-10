/**
 * POST /api/v1/admin/reports/{id}/retry — ADM-05 report recovery. Admin / Super Admin.
 *
 * Re-runs report preparation for a failed report (or one stuck generating). Recovery only:
 * the submitted answers and the stored scores are never edited — a report whose recomputed
 * scores differ from the stored ones is refused (SCORES_MISMATCH), not "fixed". A completed
 * report is never regenerated. The attempt and its outcome are audited.
 */

import { apiError, json, UUID_PATTERN } from '@/lib/api/http';
import { isRecoverable } from '@/lib/admin/data';
import { requireStaffApi } from '@/lib/admin/guard';
import { loadAnswers } from '@/lib/assessment/store';
import { audit } from '@/lib/audit';
import { finalizeSubmission } from '@/lib/submission/finalize';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffApi(['admin', 'super_admin']);
  if ('error' in auth) return auth.error;
  const actorId = auth.ctx.user.id;

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return apiError(404, 'NOT_FOUND', 'Report not found.');

  const admin = getSupabaseAdmin();
  const { data: report } = await admin.from('reports').select('id, assessment_id, status, updated_at').eq('id', id).maybeSingle();
  if (!report) return apiError(404, 'NOT_FOUND', 'Report not found.');
  if (!isRecoverable({ status: report.status as 'generating' | 'completed' | 'failed', updatedAt: report.updated_at as string })) {
    return apiError(409, 'NOT_RECOVERABLE', report.status === 'completed' ? 'This report is complete and cannot be regenerated.' : 'This report is still being prepared. Try again in a few minutes.');
  }

  const { data: assessment } = await admin
    .from('assessments')
    .select('id, profile_id, questionnaire_version, status')
    .eq('id', report.assessment_id as string)
    .maybeSingle();
  if (!assessment || assessment.status !== 'submitted') return apiError(409, 'NOT_SUBMITTED', 'The assessment for this report is not submitted.');

  await audit({ action: 'admin.report.retry', result: 'success', actorType: 'admin', actorId, objectType: 'assessment', objectId: assessment.id as string, details: { report_id: id } });

  const answers = await loadAnswers(admin, assessment.id as string);
  const result = await finalizeSubmission(
    { id: assessment.id as string, profile_id: assessment.profile_id as string, questionnaire_version: assessment.questionnaire_version as string },
    answers,
    actorId,
    'admin',
  );
  if (result.report !== 'completed') {
    return apiError(503, 'REPORT_UNAVAILABLE', 'The report could not be completed. The failure code has been updated; see the audit events.');
  }
  return json({ status: 'completed' });
}

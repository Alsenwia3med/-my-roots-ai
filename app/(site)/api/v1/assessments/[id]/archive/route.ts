/**
 * POST /api/v1/assessments/{id}/archive { confirm: true } — restart (C-05 ASM-08 zone 5).
 * Destructive: requires explicit confirmation. The in-progress assessment is archived (its saved
 * answers are retained, never deleted) and the participant can then start a new one.
 * Ownership is checked with the participant's session; the status change itself is server-only.
 */

import { apiError, json, readJsonObject, requireParticipant, UUID_PATTERN } from '@/lib/api/http';
import { audit } from '@/lib/audit';
import { getOwnedAssessment } from '@/lib/assessment/store';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return apiError(404, 'NOT_FOUND', 'Assessment not found.');

  const auth = await requireParticipant();
  if ('unauthorized' in auth) return auth.unauthorized;
  const { supabase, user } = auth;

  const body = await readJsonObject(request);
  if (body?.confirm !== true) return apiError(400, 'CONFIRMATION_REQUIRED', 'Confirmation is required.');

  const assessment = await getOwnedAssessment(supabase, id);
  if (!assessment) return apiError(404, 'NOT_FOUND', 'Assessment not found.');
  if (assessment.status !== 'in_progress') return apiError(409, 'ASSESSMENT_CLOSED', 'This assessment can no longer be changed.');

  const { error } = await getSupabaseAdmin()
    .from('assessments')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('profile_id', user.id)
    .eq('status', 'in_progress');
  if (error) {
    console.error('assessment archive failed:', error.message);
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again.');
  }

  await audit({ action: 'assessment.archived', result: 'success', actorId: user.id, objectType: 'assessment', objectId: id });
  return json({ status: 'archived' });
}

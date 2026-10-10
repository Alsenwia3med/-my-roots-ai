/**
 * POST /api/v1/me/deletion-request { action: 'request' | 'cancel' } — the signed-in participant
 * asks for their account and data to be erased (GDPR Art. 17), or withdraws a pending request.
 * A Super Admin carries out the erasure from the participant's record (ADM-04). Audited.
 */

import { apiError, json, readJsonObject, requireParticipant } from '@/lib/api/http';
import { LIMITS, rateLimited } from '@/lib/api/rateLimit';
import { audit } from '@/lib/audit';
import { isStaffAccount, latestDeletionRequest } from '@/lib/privacy/data';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireParticipant();
  if ('unauthorized' in auth) return auth.unauthorized;
  const { user } = auth;

  const body = await readJsonObject(request);
  const action = body?.action;
  if (action !== 'request' && action !== 'cancel') return apiError(400, 'INVALID_REQUEST', 'Unknown action.');

  const limited = await rateLimited(user.id, LIMITS.deletionRequest);
  if (limited) return limited;

  const admin = getSupabaseAdmin();
  const { available, request: latest } = await latestDeletionRequest(admin, user.id);
  if (!available) return apiError(503, 'SERVICE_UNAVAILABLE', 'Deletion requests are not available yet. Please use the Contact page.');

  if (action === 'request') {
    if (await isStaffAccount(admin, user.id)) {
      return apiError(409, 'STAFF_ACCOUNT', 'Staff accounts are removed by a Super Admin through Users & Roles.');
    }
    if (latest?.status === 'pending') return json({ status: 'pending', requested_at: latest.requested_at });
    const { data, error } = await admin.from('data_requests').insert({ profile_id: user.id, kind: 'deletion' }).select('requested_at').single();
    if (error) {
      console.error('deletion request failed:', error.message);
      return apiError(503, 'SERVICE_UNAVAILABLE', 'Your request could not be recorded. Please try again.');
    }
    await audit({ action: 'privacy.deletion.requested', result: 'success', actorId: user.id, objectType: 'profile', objectId: user.id });
    return json({ status: 'pending', requested_at: data.requested_at }, 201);
  }

  if (latest?.status !== 'pending') return apiError(409, 'NO_PENDING_REQUEST', 'There is no pending deletion request.');
  const { error } = await admin
    .from('data_requests')
    .update({ status: 'cancelled', resolved_at: new Date().toISOString(), resolved_by: user.id, resolution_note: 'Withdrawn by participant' })
    .eq('id', latest.id)
    .eq('status', 'pending');
  if (error) return apiError(503, 'SERVICE_UNAVAILABLE', 'Your request could not be withdrawn. Please try again.');
  await audit({ action: 'privacy.deletion.cancelled', result: 'success', actorId: user.id, objectType: 'profile', objectId: user.id });
  return json({ status: 'cancelled' });
}

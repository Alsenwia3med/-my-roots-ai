/**
 * POST /api/v1/admin/participants/{id}/deletion { decision: 'erase' | 'reject', reason }
 * Super Admin, with an MFA verification in the last 15 minutes. Acts on a pending GDPR
 * deletion request only — there is no erasure without the participant's request.
 *
 * erase:  deletes the Supabase Auth account. The database cascades from it to the profile,
 *         consents, assessments, answers, scores and reports (the integrity triggers allow a
 *         delete only once the account is gone). The request is marked completed.
 * reject: records why the request cannot be honoured (e.g. a legal retention duty).
 *
 * Both are audited with the reason. Audit history is retained; it holds no answers or emails.
 */

import { z } from 'zod';
import { apiError, json, readJsonObject, UUID_PATTERN } from '@/lib/api/http';
import { requireStaffApi } from '@/lib/admin/guard';
import { audit } from '@/lib/audit';
import { isStaffAccount, latestDeletionRequest } from '@/lib/privacy/data';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const Body = z.object({
  decision: z.enum(['erase', 'reject']),
  reason: z.string().trim().min(10, 'Give a reason of at least 10 characters.').max(500),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffApi(['super_admin'], { recentMfa: true });
  if ('error' in auth) return auth.error;
  const actorId = auth.ctx.user.id;

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return apiError(404, 'NOT_FOUND', 'Participant not found.');
  const parsed = Body.safeParse((await readJsonObject(request)) ?? {});
  if (!parsed.success) return apiError(400, 'REASON_REQUIRED', parsed.error.issues[0]?.message ?? 'Give a reason.');
  const { decision, reason } = parsed.data;

  const admin = getSupabaseAdmin();
  const { available, request: pending } = await latestDeletionRequest(admin, id);
  if (!available) return apiError(503, 'MIGRATION_REQUIRED', 'Run the 20260922_admin_ops.sql migration first.');
  if (pending?.status !== 'pending') return apiError(409, 'NO_PENDING_REQUEST', 'This participant has no pending deletion request.');

  const resolve = (status: 'completed' | 'rejected') =>
    admin
      .from('data_requests')
      .update({ status, resolved_at: new Date().toISOString(), resolved_by: actorId, resolution_note: reason })
      .eq('id', pending.id)
      .eq('status', 'pending');

  if (decision === 'reject') {
    const { error } = await resolve('rejected');
    if (error) return apiError(503, 'SERVICE_UNAVAILABLE', 'The decision could not be saved. Please try again.');
    await audit({ action: 'privacy.deletion.rejected', result: 'success', actorType: 'admin', actorId, objectType: 'profile', objectId: id, details: { request_id: pending.id, reason } });
    return json({ status: 'rejected' });
  }

  if (await isStaffAccount(admin, id)) {
    return apiError(409, 'STAFF_ACCOUNT', 'Revoke this account’s staff roles in Users & Roles before erasing it.');
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(id);
  if (deleteError) {
    console.error('account erasure failed:', deleteError.message);
    await audit({ action: 'privacy.account.erased', result: 'failure', actorType: 'admin', actorId, objectType: 'profile', objectId: id, details: { request_id: pending.id } });
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The account could not be erased. Nothing was deleted; please try again.');
  }
  await resolve('completed');
  await audit({ action: 'privacy.account.erased', result: 'success', actorType: 'admin', actorId, objectType: 'profile', objectId: id, details: { request_id: pending.id, reason } });
  return json({ status: 'erased' });
}

/**
 * POST /api/v1/admin/access — ADM-10 Users and Roles. Super Admin only.
 *
 *   { action: 'grant',     email, role, reason,     named account + role, time-limited by
 *     expiresOn | permanent: true }                  default: an expiry date is required unless
 *                                                    "until revoked" is chosen explicitly
 *   { action: 'revoke',    assignmentId, reason }      immediate: every admin request re-reads roles
 *   { action: 'reset_mfa', profileId, reason }         controlled recovery of a lost authenticator
 *
 * Every action requires a reason, a confirmation in the interface, an MFA verification within
 * the last 15 minutes, and writes an audit event. Grants never produce a shared account: each
 * is tied to one named email. Role records are written with the service role only — there is
 * no participant or staff write policy on role_assignments.
 */

import { z } from 'zod';
import { apiError, json, readJsonObject, UUID_PATTERN } from '@/lib/api/http';
import { requireStaffApi } from '@/lib/admin/guard';
import { grantIsLive, MAX_ACCESS_DAYS, STAFF_ROLES, type StaffRole } from '@/lib/admin/roles';
import { audit } from '@/lib/audit';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const Reason = z.string().trim().min(10, 'Give a reason of at least 10 characters.').max(500);

export async function POST(request: Request) {
  const auth = await requireStaffApi(['super_admin'], { recentMfa: true });
  if ('error' in auth) return auth.error;
  const actorId = auth.ctx.user.id;

  const body = await readJsonObject(request);
  const reason = Reason.safeParse(body?.reason);
  if (!reason.success) return apiError(400, 'REASON_REQUIRED', reason.error.issues[0].message);
  const admin = getSupabaseAdmin();

  // ---- grant
  if (body?.action === 'grant') {
    const email = z.email().max(254).safeParse(typeof body.email === 'string' ? body.email.trim().toLowerCase() : '');
    const role = body.role as StaffRole;
    if (!email.success) return apiError(400, 'INVALID_EMAIL', 'Enter a valid email address.');
    if (!STAFF_ROLES.includes(role)) return apiError(400, 'INVALID_ROLE', 'Choose a role.');

    // ADM-10: access is time-limited by default; "until revoked" must be chosen explicitly.
    let expiresAt: string | null = null;
    if (body.permanent !== true) {
      const day = typeof body.expiresOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.expiresOn) ? body.expiresOn : null;
      const at = day ? Date.parse(`${day}T23:59:59Z`) : NaN;
      if (!day || Number.isNaN(at)) return apiError(400, 'EXPIRY_REQUIRED', 'Choose when this access expires, or select "until revoked".');
      if (at <= Date.now()) return apiError(400, 'EXPIRY_PAST', 'The expiry date must be in the future.');
      if (at > Date.now() + MAX_ACCESS_DAYS * 86400000) return apiError(400, 'EXPIRY_TOO_LONG', `Time-limited access can last at most ${MAX_ACCESS_DAYS} days.`);
      expiresAt = new Date(at).toISOString();
    }

    // Exact match on the normalised (lower-case) address. Not ilike: "_" and "%" in an email
    // would act as wildcards and could match a different account.
    let { data: profile } = await admin.from('profiles').select('id').eq('email', email.data).maybeSingle();
    if (!profile) {
      // A named account for this email; the sign-up trigger creates its profile row.
      const { data: created, error } = await admin.auth.admin.createUser({ email: email.data, email_confirm: true });
      if (error || !created.user) {
        console.error('staff account creation failed:', error?.message);
        return apiError(503, 'SERVICE_UNAVAILABLE', 'The account could not be created. Please try again.');
      }
      profile = { id: created.user.id };
    }

    // An expired grant of the same role is closed first, so the role can be granted again.
    const { data: previous, error: previousError } = await admin
      .from('role_assignments')
      .select('id, expires_at, revoked_at')
      .eq('profile_id', profile.id)
      .eq('role', role)
      .is('revoked_at', null);
    if (previousError?.code === '42703' && expiresAt) {
      return apiError(409, 'MIGRATION_REQUIRED', 'Time-limited access needs the 20260922_admin_ops.sql migration. Run it in Supabase, or grant "until revoked".');
    }
    const expired = (previous ?? []).filter((g) => !grantIsLive(g));
    if (expired.length) {
      await admin.from('role_assignments').update({ revoked_at: new Date().toISOString() }).in('id', expired.map((g) => g.id as string));
    }

    const { error } = await admin
      .from('role_assignments')
      .insert({ profile_id: profile.id, role, granted_by: actorId, note: reason.data, ...(expiresAt ? { expires_at: expiresAt } : {}) });
    if (error) {
      if (error.code === '23505') return apiError(409, 'ALREADY_GRANTED', 'This account already holds that role.');
      console.error('role grant failed:', error.message);
      return apiError(503, 'SERVICE_UNAVAILABLE', 'The role could not be granted. Please try again.');
    }
    await audit({ action: 'admin.role.granted', result: 'success', actorType: 'admin', actorId, objectType: 'profile', objectId: profile.id, details: { role, reason: reason.data, expires_at: expiresAt } });
    return json({ status: 'granted' }, 201);
  }

  // ---- revoke
  if (body?.action === 'revoke') {
    const assignmentId = typeof body.assignmentId === 'string' ? body.assignmentId : '';
    if (!UUID_PATTERN.test(assignmentId)) return apiError(404, 'NOT_FOUND', 'Role assignment not found.');

    const { data: grant } = await admin.from('role_assignments').select('id, profile_id, role, revoked_at').eq('id', assignmentId).maybeSingle();
    if (!grant) return apiError(404, 'NOT_FOUND', 'Role assignment not found.');
    if (grant.revoked_at) return apiError(409, 'ALREADY_REVOKED', 'This role has already been revoked.');

    if (grant.role === 'super_admin') {
      const { count } = await admin.from('role_assignments').select('id', { count: 'exact', head: true }).eq('role', 'super_admin').is('revoked_at', null);
      if ((count ?? 0) <= 1) return apiError(409, 'LAST_SUPER_ADMIN', 'This is the only active Super Admin. Grant another Super Admin first.');
    }

    const { error } = await admin.from('role_assignments').update({ revoked_at: new Date().toISOString() }).eq('id', assignmentId).is('revoked_at', null);
    if (error) {
      console.error('role revoke failed:', error.message);
      return apiError(503, 'SERVICE_UNAVAILABLE', 'The role could not be revoked. Please try again.');
    }
    await audit({ action: 'admin.role.revoked', result: 'success', actorType: 'admin', actorId, objectType: 'profile', objectId: grant.profile_id as string, details: { role: grant.role as string, reason: reason.data } });
    return json({ status: 'revoked' });
  }

  // ---- controlled MFA recovery
  if (body?.action === 'reset_mfa') {
    const profileId = typeof body.profileId === 'string' ? body.profileId : '';
    if (!UUID_PATTERN.test(profileId)) return apiError(404, 'NOT_FOUND', 'Account not found.');
    if (profileId === actorId) return apiError(409, 'SELF_RESET', 'Another Super Admin must reset your own authenticator.');

    const { data: factors, error } = await admin.auth.admin.mfa.listFactors({ userId: profileId });
    if (error) return apiError(503, 'SERVICE_UNAVAILABLE', 'The authenticator could not be reset. Please try again.');
    for (const f of factors?.factors ?? []) {
      const { error: deleteError } = await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: profileId });
      if (deleteError) return apiError(503, 'SERVICE_UNAVAILABLE', 'The authenticator could not be reset. Please try again.');
    }
    await audit({ action: 'admin.mfa.reset', result: 'success', actorType: 'admin', actorId, objectType: 'profile', objectId: profileId, details: { reason: reason.data } });
    return json({ status: 'reset' });
  }

  return apiError(400, 'INVALID_REQUEST', 'Unknown action.');
}

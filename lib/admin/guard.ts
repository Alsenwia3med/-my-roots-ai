/**
 * Admin access gate (ADM-01 "RBAC authorization occurs before protected admin environment
 * access"). Every admin page and API route passes through here, on the server.
 *
 * Order: signed in -> holds an active staff role -> MFA verified this session (AAL2) ->
 * holds a role allowed on this screen. URL guessing reaches none of the protected data:
 * each screen repeats the role check, and Row Level Security repeats it again in the database.
 */

import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { apiError } from '@/lib/api/http';
import { audit } from '@/lib/audit';
import { getParticipant } from '@/lib/supabase/server';
import { grantIsLive, hasAnyRole, STAFF_ROLES, type StaffRole } from './roles';

/** Privileged writes need an MFA verification this recent (ADM-07/ADM-10 "MFA re-auth"). */
export const MFA_REAUTH_WINDOW_MS = 15 * 60 * 1000;

export interface StaffContext {
  supabase: SupabaseClient;
  user: User;
  roles: StaffRole[];
  /** When TOTP was last verified in this session (ms since epoch), or null. */
  mfaVerifiedAt: number | null;
}

export type StaffState =
  | { kind: 'signed_out' }
  | { kind: 'no_role'; user: User }
  | { kind: 'enroll'; ctx: StaffContext }
  | { kind: 'challenge'; ctx: StaffContext; factorId: string }
  | { kind: 'ready'; ctx: StaffContext };

async function activeRoles(supabase: SupabaseClient, userId: string): Promise<StaffRole[]> {
  // RLS: a signed-in user reads only their own grants.
  let { data, error }: { data: { role: string; expires_at?: string | null }[] | null; error: { code?: string; message: string } | null } = await supabase
    .from('role_assignments')
    .select('role, expires_at')
    .eq('profile_id', userId)
    .is('revoked_at', null);
  if (error?.code === '42703') {
    // expires_at not added yet (migration 20260922_admin_ops.sql not run): no grant can expire.
    ({ data, error } = await supabase.from('role_assignments').select('role').eq('profile_id', userId).is('revoked_at', null));
  }
  if (error) throw new Error(`role lookup failed: ${error.message}`);
  return (data ?? [])
    .filter((r) => grantIsLive(r))
    .map((r) => r.role as string)
    .filter((r): r is StaffRole => (STAFF_ROLES as string[]).includes(r));
}

export async function getStaffState(): Promise<StaffState> {
  const { supabase, user } = await getParticipant();
  if (!user) return { kind: 'signed_out' };

  const roles = await activeRoles(supabase, user.id);
  if (roles.length === 0) return { kind: 'no_role', user };

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  // Entries may be bare method names or { method, timestamp }; only the latter carry a time.
  const totp = aal?.currentAuthenticationMethods
    ?.filter((m): m is Exclude<typeof m, string> => typeof m === 'object' && m !== null)
    .find((m) => m.method === 'totp');
  const ctx: StaffContext = {
    supabase,
    user,
    roles,
    mfaVerifiedAt: totp ? totp.timestamp * 1000 : null,
  };
  if (aal?.currentLevel === 'aal2') return { kind: 'ready', ctx };

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verified = factors?.totp?.find((f) => f.status === 'verified');
  return verified ? { kind: 'challenge', ctx, factorId: verified.id } : { kind: 'enroll', ctx };
}

/**
 * For admin pages. Anyone not fully authorised is sent back to ADM-01, which shows the right
 * state. A staff member without the role for this particular screen gets allowed: false and
 * the page renders the permission-denied state instead of any data.
 */
export async function requireStaffPage(allowed: readonly StaffRole[]): Promise<{ ctx: StaffContext; allowed: boolean }> {
  const state = await getStaffState();
  if (state.kind === 'signed_out') redirect('/admin');
  if (state.kind === 'no_role') redirect('/admin?state=denied');
  if (state.kind !== 'ready') redirect('/admin');
  const ok = hasAnyRole(state.ctx.roles, allowed);
  if (!ok) {
    await audit({ action: 'admin.access.denied', result: 'denied', actorType: 'admin', actorId: state.ctx.user.id, details: { reason: 'role' } });
  }
  return { ctx: state.ctx, allowed: ok };
}

/** For admin API routes. Returns the context, or the error response to send. */
export async function requireStaffApi(
  allowed: readonly StaffRole[],
  options: { recentMfa?: boolean } = {},
): Promise<{ ctx: StaffContext } | { error: Response }> {
  const state = await getStaffState();
  if (state.kind === 'signed_out') return { error: apiError(401, 'SESSION_EXPIRED', 'Sign in to continue.') };
  if (state.kind !== 'ready') return { error: apiError(403, 'FORBIDDEN', 'You do not have access to this action.') };
  if (!hasAnyRole(state.ctx.roles, allowed)) {
    await audit({ action: 'admin.access.denied', result: 'denied', actorType: 'admin', actorId: state.ctx.user.id, details: { reason: 'role' } });
    return { error: apiError(403, 'FORBIDDEN', 'You do not have access to this action.') };
  }
  if (options.recentMfa) {
    const at = state.ctx.mfaVerifiedAt;
    if (at === null || Date.now() - at > MFA_REAUTH_WINDOW_MS) {
      return { error: apiError(403, 'MFA_REAUTH_REQUIRED', 'Confirm your identity again with your authenticator code to continue.') };
    }
  }
  return { ctx: state.ctx };
}

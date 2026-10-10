// ADM-10 · Users and Roles (/admin/access). Super Admin only. Named privileged access: who holds
// which role, MFA state, status and last access; grant, revoke and controlled MFA recovery,
// each with a reason, confirmation, recent MFA and an audit event. No password, MFA secret,
// token or credential is ever displayed.
//
// Sign-in time and MFA state live in Supabase Auth, so this screen reads with the service
// role — only after the Super Admin check above has passed.

import styles from '../../admin.module.css';
import AccessManager, { type StaffPerson } from '../../_components/AccessManager';
import { PageHead, PermissionDenied } from '../../_components/PageHead';
import { requireStaffPage } from '@/lib/admin/guard';
import { formatDateTime } from '@/lib/admin/data';
import { grantIsLive, STAFF_ROLES, type StaffRole } from '@/lib/admin/roles';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface GrantRow {
  id: string;
  profile_id: string;
  role: string;
  granted_at: string;
  revoked_at: string | null;
  expires_at?: string | null;
}

export default async function AccessPage() {
  const { ctx, allowed } = await requireStaffPage(['super_admin']);
  if (!allowed) return <PermissionDenied />;

  const admin = getSupabaseAdmin();
  let { data: grants, error }: { data: GrantRow[] | null; error: { code?: string; message: string } | null } = await admin
    .from('role_assignments')
    .select('id, profile_id, role, granted_at, revoked_at, expires_at')
    .order('granted_at', { ascending: false });
  if (error?.code === '42703') {
    // Before migration 20260922_admin_ops.sql: no expiry column yet.
    ({ data: grants, error } = await admin.from('role_assignments').select('id, profile_id, role, granted_at, revoked_at').order('granted_at', { ascending: false }));
  }
  if (error) throw new Error(`role lookup failed: ${error.message}`);

  const staffGrants = (grants ?? []).filter((g) => (STAFF_ROLES as string[]).includes(g.role));
  const ids = [...new Set(staffGrants.map((g) => g.profile_id))];
  const { data: profiles } = ids.length ? await admin.from('profiles').select('id, email').in('id', ids) : { data: [] };

  const people: StaffPerson[] = await Promise.all(
    ids.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      const mine = staffGrants.filter((g) => g.profile_id === id);
      return {
        profileId: id,
        email: ((profiles ?? []).find((p) => p.id === id)?.email as string | undefined) ?? '—',
        mfa: (data.user?.factors ?? []).some((f) => f.status === 'verified'),
        lastAccess: formatDateTime(data.user?.last_sign_in_at ?? null),
        active: mine.some((g) => grantIsLive(g)),
        grants: mine.map((g) => ({
          id: g.id,
          role: g.role as StaffRole,
          grantedAt: formatDateTime(g.granted_at),
          revokedAt: g.revoked_at ? formatDateTime(g.revoked_at) : null,
          expiresAt: g.expires_at ? formatDateTime(g.expires_at) : null,
          expired: !g.revoked_at && !grantIsLive(g),
        })),
      };
    }),
  );
  people.sort((a, b) => Number(b.active) - Number(a.active) || a.email.localeCompare(b.email));

  return (
    <>
      <PageHead title="Users & Roles" subtitle="Manage named privileged access" access="Super Admin" />
      <AccessManager people={people} selfId={ctx.user.id} />
      <div className={styles.notice}>
        <span className={styles.noticeTitle}>Access governance</span>
        Named accounts only — no shared privileged accounts. Every change needs a reason, a confirmation and a recent
        authenticator verification, and is recorded in the audit log. Access is time-limited by default and ends
        automatically at its expiry date. Revocation and expiry take effect on the person&apos;s next request.
      </div>
    </>
  );
}

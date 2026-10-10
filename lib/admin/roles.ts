/**
 * Staff roles and what each may open (Master Requirements RBAC; ADM-01..10 access contracts).
 * The role names are the ones role_assignments already enforces in the database.
 */

export type StaffRole = 'admin' | 'research_admin' | 'super_admin';

export const STAFF_ROLES: readonly StaffRole[] = ['admin', 'research_admin', 'super_admin'];

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  research_admin: 'Research Admin',
  super_admin: 'Super Admin',
};

export interface AdminNavItem {
  label: string;
  href: string;
  /** Roles allowed to open the screen; the screen repeats this check server-side. */
  roles: readonly StaffRole[];
  /** False while the screen is not delivered yet: shown, but not linked. */
  available: boolean;
}

/** Sidebar order follows ADM-02..10. */
export const ADMIN_NAV: readonly AdminNavItem[] = [
  { label: 'Overview', href: '/admin/overview', roles: ['admin', 'super_admin'], available: true },
  { label: 'Participants', href: '/admin/participants', roles: ['admin', 'super_admin'], available: true },
  { label: 'Reports', href: '/admin/reports', roles: ['admin', 'super_admin'], available: true },
  { label: 'Configuration', href: '/admin/configuration', roles: ['admin', 'super_admin'], available: false },
  { label: 'Audit', href: '/admin/audit', roles: ['super_admin'], available: true },
  { label: 'Research Export', href: '/admin/research-export', roles: ['research_admin'], available: true },
  { label: 'Users & Roles', href: '/admin/access', roles: ['super_admin'], available: true },
];

export const hasAnyRole = (roles: readonly StaffRole[], allowed: readonly StaffRole[]) =>
  roles.some((r) => allowed.includes(r));

/** The first screen a signed-in staff member may open. */
export function landingPath(roles: readonly StaffRole[]): string {
  const first = ADMIN_NAV.find((item) => item.available && hasAnyRole(roles, item.roles));
  return first?.href ?? '/admin?state=denied';
}

/** A grant counts until it is revoked or, for time-limited access, until it expires. */
export const grantIsLive = (g: { expires_at?: string | null; revoked_at?: string | null }, now = Date.now()) =>
  !g.revoked_at && (!g.expires_at || Date.parse(g.expires_at) > now);

/** Longest time-limited grant; anything longer must be a deliberate "until revoked" grant. */
export const MAX_ACCESS_DAYS = 365;

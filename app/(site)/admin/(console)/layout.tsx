// ADM console shell: sidebar navigation beside every admin screen (ADM-02..10), with the
// signed-in identity and the Staging/Production badge. Any staff role reaches the shell; each
// screen then checks its own role requirement.

import styles from '../admin.module.css';
import AdminNav from '../_components/AdminNav';
import AdminSignOut from '../_components/AdminSignOut';
import { requireStaffPage } from '@/lib/admin/guard';
import { ROLE_LABELS, STAFF_ROLES } from '@/lib/admin/roles';
import { appEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const { ctx } = await requireStaffPage(STAFF_ROLES);
  const env = appEnv();

  return (
    <div className={styles.wrap}>
      <div className={styles.headRow} style={{ marginBottom: 'var(--zd-space-6)' }}>
        <div className={styles.badges}>
          <span className={`${styles.pill} ${env === 'production' ? styles.pillProduction : ''}`}>{env.toUpperCase()}</span>
          {ctx.roles.map((r) => (
            <span key={r} className={`${styles.pill} ${r === 'super_admin' ? styles.pillSuper : ''}`}>
              {ROLE_LABELS[r]}
            </span>
          ))}
        </div>
        <div className={styles.badges} style={{ alignItems: 'center' }}>
          <span className={`${styles.small} ${styles.muted}`}>{ctx.user.email}</span>
          <AdminSignOut />
        </div>
      </div>
      <div className={styles.console}>
        <AdminNav roles={ctx.roles} />
        <main id="main">{children}</main>
      </div>
    </div>
  );
}

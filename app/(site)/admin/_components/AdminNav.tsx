'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../admin.module.css';
import { ADMIN_NAV, hasAnyRole, type StaffRole } from '@/lib/admin/roles';

/** ADM sidebar. Shows only the screens this person's roles allow; undelivered ones are marked. */
export default function AdminNav({ roles }: { roles: StaffRole[] }) {
  const pathname = usePathname();
  const items = ADMIN_NAV.filter((item) => hasAnyRole(roles, item.roles));

  return (
    <nav className={styles.sidebar} aria-label="Administration">
      {items.map((item) =>
        item.available ? (
          <Link
            key={item.href}
            href={item.href}
            className={styles.navLink}
            aria-current={pathname === item.href || pathname?.startsWith(`${item.href}/`) ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ) : (
          <span key={item.href} className={styles.navDisabled} aria-disabled="true">
            {item.label}
            <span className={styles.navSoon}>Soon</span>
          </span>
        ),
      )}
    </nav>
  );
}

'use client';

import { useState } from 'react';
import styles from '../admin.module.css';

/** Ends the session (POST /api/v1/auth/sign-out) and returns to ADM-01. */
export default function AdminSignOut({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={className ?? `${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch('/api/v1/auth/sign-out', { method: 'POST' }).catch(() => undefined);
        window.location.assign('/admin');
      }}
    >
      Sign out
    </button>
  );
}

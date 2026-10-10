'use client';

import { useState } from 'react';
import styles from '../assessment.module.css';
import { signOut } from './api';
import { clearPendingEmail } from './pendingEmail';
import { PENDING } from '@/lib/assessment/copy';

export default function SignOutButton() {
  const [pending, setPending] = useState(false);
  return (
    <button
      className={styles.btnSecondary}
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        // ROOTS decision of 30 September 2026, section 7: cleared on sign-out.
        clearPendingEmail();
        await signOut();
        window.location.assign('/');
      }}
    >
      {PENDING.signOut}
    </button>
  );
}

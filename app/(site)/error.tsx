'use client';

// SYS-03 · 500 / service error (global boundary). Recover safely: Retry, Home, Contact. The
// incident reference is Next.js's error digest — it correlates with the server log without
// exposing a stack trace, token, health content or infrastructure detail.

import Link from 'next/link';
import styles from './system.module.css';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className={styles.wrap}>
      <div className={styles.card} role="alert">
        <p className={styles.code}>Service error</p>
        <h1 className={styles.title}>Unable to complete request</h1>
        <p className={styles.body}>Something went wrong on our side. Please try again.</p>
        {error.digest && <p className={styles.reference}>Reference {error.digest}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={() => reset()}>Retry</button>
          <Link href="/" className={`${styles.btn} ${styles.btnSecondary}`}>Home</Link>
          <Link href="/contact" className={`${styles.btn} ${styles.btnSecondary}`}>Contact</Link>
        </div>
      </div>
    </main>
  );
}

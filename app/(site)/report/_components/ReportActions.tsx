'use client';

/**
 * RPT-02 header actions. "Download PDF" fetches the PDF generated on the server from the same
 * stored canonical JSON as this page (C-03 §9). "Print" uses the browser's print styles, with
 * collapsed answer modules opened first, because browsers do not print closed <details>.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '../report.module.css';

export default function ReportActions({ reportId }: { reportId: string }) {
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let reopened: HTMLDetailsElement[] = [];
    const before = () => {
      reopened = [...document.querySelectorAll('details')].filter((d) => !d.open);
      reopened.forEach((d) => (d.open = true));
    };
    const after = () => reopened.forEach((d) => (d.open = false));
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  return (
    <div className={styles.toolbarActions}>
      <a className={styles.btn} href={`/api/v1/reports/${reportId}/pdf`} download>
        Download PDF
      </a>
      <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => window.print()}>
        Print
      </button>
      <Link href="/report" className={`${styles.btn} ${styles.btnSecondary}`}>
        All reports
      </Link>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnSecondary}`}
        disabled={signingOut}
        onClick={async () => {
          setSigningOut(true);
          await fetch('/api/v1/auth/sign-out', { method: 'POST' }).catch(() => undefined);
          window.location.assign('/');
        }}
      >
        Secure sign-out
      </button>
    </div>
  );
}

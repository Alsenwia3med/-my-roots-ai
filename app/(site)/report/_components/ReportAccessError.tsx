// RPT-05 · Report Access Error. One generic secure-access message for not found, forbidden and
// invalid, so the page never confirms that a report exists. A known expiry uses the exact C-04
// SESSION-EXPIRED copy. No participant, report, score or token detail is shown.

import Link from 'next/link';
import styles from '../report.module.css';
import { SYSTEM } from '@/lib/assessment/copy';

export type AccessErrorKind = 'expired' | 'unavailable' | 'service';

export default function ReportAccessError({ kind }: { kind: AccessErrorKind }) {
  const message =
    kind === 'expired'
      ? SYSTEM.sessionExpired
      : kind === 'service'
        ? 'The report could not be opened right now. Please try again later.'
        : 'This report cannot be opened with the current access. Request a new secure link to continue.';

  return (
    <main id="main" className={styles.wrap}>
      <div className={styles.errorCard} role="alert">
        <h1 className={styles.errorTitle}>Report not available</h1>
        <p className={styles.para}>{message}</p>
        <div className={styles.errorActions}>
          <Link href="/assessment" className={styles.btn}>Request new secure link</Link>
          <Link href="/contact" className={`${styles.btn} ${styles.btnSecondary}`}>Contact support</Link>
          <Link href="/" className={`${styles.btn} ${styles.btnSecondary}`}>Home</Link>
        </div>
      </div>
    </main>
  );
}

// ASM-03 · Invalid or Expired Link (/assessment/link-error). Generic explanation; no token details.

import Link from 'next/link';
import styles from '../assessment.module.css';
import { PENDING } from '@/lib/assessment/copy';

export default function LinkErrorPage() {
  return (
    <main id="main" className={styles.main}>
      <h1 className={styles.title}>{PENDING.linkErrorHeadline}</h1>
      <p className={styles.lede}>{PENDING.linkErrorBody}</p>
      <div className={styles.actions}>
        <Link className={styles.btn} href="/assessment">
          {PENDING.requestNewLink}
        </Link>
        <Link className={styles.btnSecondary} href="/contact">
          {PENDING.contactSupport}
        </Link>
      </div>
    </main>
  );
}

// ASM-02 · Secure Link Requested (/assessment/check-email). Neutral message: never reveals
// whether an account exists.

import styles from '../assessment.module.css';
import CheckEmail from '../_components/CheckEmail';
import { PENDING } from '@/lib/assessment/copy';

export default function CheckEmailPage() {
  return (
    <main id="main" className={styles.main}>
      <h1 className={styles.title}>{PENDING.checkEmailHeadline}</h1>
      <p className={styles.lede} role="status">
        {PENDING.checkEmailBody}
      </p>
      <CheckEmail />
    </main>
  );
}

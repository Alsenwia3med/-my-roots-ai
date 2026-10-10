// Your data and privacy (/account/privacy) — the participant's GDPR rights in one place:
// download everything held about them (access, portability) and request erasure. Private to
// the signed-in participant.

import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../../report/report.module.css';
import DeletionPanel from './DeletionPanel';
import { SYSTEM } from '@/lib/assessment/copy';
import { latestDeletionRequest } from '@/lib/privacy/data';
import { getParticipant } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your data and privacy — ROOTS-AI™',
  robots: { index: false, follow: false },
};

export default async function PrivacyPage() {
  const { user } = await getParticipant();
  if (!user) {
    return (
      <main id="main" className={styles.wrap}>
        <div className={styles.errorCard} role="alert">
          <h1 className={styles.errorTitle}>Sign in to continue</h1>
          <p className={styles.para}>{SYSTEM.sessionExpired}</p>
          <div className={styles.errorActions}>
            <Link href="/assessment" className={styles.btn}>Request new secure link</Link>
            <Link href="/" className={`${styles.btn} ${styles.btnSecondary}`}>Home</Link>
          </div>
        </div>
      </main>
    );
  }

  const { available, request } = await latestDeletionRequest(getSupabaseAdmin(), user.id);

  return (
    <main id="main" className={styles.wrap}>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.historyTitle}>Your data and privacy</h1>
          <div className={styles.meta}>Download your data or ask us to delete it.</div>
        </div>
        <Link href="/report" className={`${styles.btn} ${styles.btnSecondary}`}>Your reports</Link>
      </div>

      <section className={styles.section} aria-labelledby="download-title">
        <h2 id="download-title" className={styles.sectionTitle}>Download your data</h2>
        <p className={styles.para}>
          One file with everything we hold about your account: your profile, consent decisions, assessments and answers,
          calculated scores and reports. The download is recorded for security.
        </p>
        <div className={styles.historyRow}>
          <a href="/api/v1/me/data-export" className={styles.btn} download>
            Download my data
          </a>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="delete-title">
        <h2 id="delete-title" className={styles.sectionTitle}>Delete your account and data</h2>
        <p className={styles.para}>
          We will permanently delete your account, answers, scores and reports. This cannot be undone, so download your data
          first if you want to keep a copy. A security record that the deletion happened is kept; it contains no answers, name
          or email.
        </p>
        {available ? (
          <DeletionPanel initial={request ? { status: request.status, requestedAt: request.requested_at } : null} />
        ) : (
          <p className={styles.para}>
            To request deletion, please <Link href="/contact">contact us</Link>.
          </p>
        )}
      </section>
    </main>
  );
}

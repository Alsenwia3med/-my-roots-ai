// ASM-01 · Assessment Entry (/assessment). Copy: C-04 §3 "/assessment — Assessment".
//
// Every "Start Your Assessment" button on the site points here. A participant who is already
// signed in is sent straight on to the right step (consent, introduction, resume or submission
// status, decided by /assessment/continue) instead of being asked for their email again.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import styles from './assessment.module.css';
import EntryForm from './_components/EntryForm';
import { ASSESSMENT_ENTRY, SYSTEM } from '@/lib/assessment/copy';
import { getParticipant } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AssessmentEntryPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams;
  // Verified with Supabase Auth (not just the cookie), so an expired session still sees the form.
  const { user } = await getParticipant();
  if (user && session !== 'expired') redirect('/assessment/continue');

  return (
    <main id="main" className={styles.main}>
      {session === 'expired' && (
        <p className={`${styles.banner} ${styles.bannerError}`} role="alert">
          {SYSTEM.sessionExpired}
        </p>
      )}
      <h1 className={styles.title}>{ASSESSMENT_ENTRY.headline}</h1>
      <p className={styles.lede}>{ASSESSMENT_ENTRY.intro}</p>
      <ul className={styles.list}>
        {ASSESSMENT_ENTRY.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <div className={styles.card}>
        <EntryForm />
      </div>

      <nav className={styles.legalLinks} aria-label="Legal">
        <Link className={styles.link} href="/privacy">Privacy</Link>
        <Link className={styles.link} href="/terms">Terms</Link>
        <Link className={styles.link} href="/medical-disclaimer">Medical Disclaimer</Link>
        <Link className={styles.link} href="/ai-disclaimer">AI Disclaimer</Link>
      </nav>
    </main>
  );
}

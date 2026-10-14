// ASM-01 · Assessment Entry (/assessment). Copy: the v1.21 publication-candidate document.
//
// Every "Start Your Assessment" button on the site points here. A participant who is already
// signed in is sent straight on to the right step (consent, introduction, resume or submission
// status, decided by /assessment/continue) instead of being asked for their email again.

import { redirect } from 'next/navigation';
import styles from './assessment.module.css';
import EntryContent from './_components/EntryContent';
import { SYSTEM } from '@/lib/assessment/copy';
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
      <EntryContent />
    </main>
  );
}

// Assessment shell (C-05 §3): logo and participant controls only; no marketing navigation.

import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './assessment.module.css';
import ClearPendingEmail from './_components/ClearPendingEmail';
import { getParticipant } from '@/lib/supabase/server';

// C-04 §10 SEO and Metadata for /assessment. Protected routes are not indexed (proxy.ts).
export const metadata: Metadata = {
  title: 'ROOTS Biological Assessment™',
  description: 'Complete 73 questions across 13 modules and receive a transparent educational report.',
};

export default async function AssessmentLayout({ children }: { children: React.ReactNode }) {
  /*
   * ROOTS decision of 30 September 2026, section 7: the pending address is cleared as soon as the
   * entry/authentication flow completes. A verified session is what "completed" means, so the
   * clear is rendered on every signed-in assessment screen and nowhere else — the entry and
   * check-email screens still need it, and a signed-out visitor has nothing to clear.
   */
  const user = await (async () => {
    try {
      return (await getParticipant()).user;
    } catch {
      // The shell must render for a signed-out visitor even where Supabase is unreachable or
      // unconfigured, as it does during a build. No session means nothing to clear.
      return null;
    }
  })();

  return (
    <div className={styles.page}>
      <header className={styles.shellHeader}>
        <div className={styles.shellHeaderInner}>
          <Link href="/" className={styles.logoLink} aria-label="ROOTS-AI™ home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/roots-logo.svg" alt="ROOTS-AI™" width={37} height={48} className={styles.logo} />
          </Link>
          <div id="assessment-shell-status" className={styles.shellStatus} />
        </div>
      </header>
      {user && <ClearPendingEmail />}
      {children}
    </div>
  );
}

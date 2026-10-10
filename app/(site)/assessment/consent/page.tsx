// ASM-04 · Consent (/assessment/consent). Service consent required; research consent separate
// and optional (C-05 ASM-04; C-04 §9 CONSENT-SERVICE / CONSENT-RESEARCH).

import { redirect } from 'next/navigation';
import styles from '../assessment.module.css';
import ConsentForm from '../_components/ConsentForm';
import { fill, LEGAL_VERSION, PENDING } from '@/lib/assessment/copy';
import { requirePageParticipant } from '@/lib/assessment/guards';
import { hasServiceConsent } from '@/lib/assessment/store';

export const dynamic = 'force-dynamic';

function maskEmail(email: string | undefined): string {
  if (!email) return '';
  const [name, domain] = email.split('@');
  return `${name.slice(0, 1)}${'•'.repeat(Math.max(2, name.length - 1))}@${domain}`;
}

export default async function ConsentPage() {
  const { supabase, user } = await requirePageParticipant();
  if (await hasServiceConsent(supabase, user.id)) redirect('/assessment/continue');

  return (
    <main id="main" className={styles.main}>
      <p className={styles.eyebrow}>{fill(PENDING.signedInAs, { email: maskEmail(user.email) })}</p>
      <h1 className={styles.title}>{PENDING.consentHeadline}</h1>
      <div className={styles.card}>
        <ConsentForm />
        <p className={`${styles.body} ${styles.muted}`}>
          {fill(PENDING.consentVersion, { version: LEGAL_VERSION.version, date: LEGAL_VERSION.effectiveDate })}
        </p>
      </div>
    </main>
  );
}

// ASM-05 · Assessment Introduction (/assessment/start). Zones: welcome, instructions (C-04
// bullets), save/resume privacy, 13-module preview (no scores), Start Module 1.

import { redirect } from 'next/navigation';
import styles from '../assessment.module.css';
import StartButton from '../_components/StartButton';
import { ASSESSMENT_ENTRY, PENDING } from '@/lib/assessment/copy';
import { requireConsentedParticipant } from '@/lib/assessment/guards';
import { MODULES } from '@/lib/assessment/questionBank';
import { getInProgressAssessment, loadAnswers } from '@/lib/assessment/store';

export const dynamic = 'force-dynamic';

export default async function StartPage() {
  const { supabase } = await requireConsentedParticipant();
  const inProgress = await getInProgressAssessment(supabase);
  if (inProgress && Object.keys(await loadAnswers(supabase, inProgress.id)).length) {
    redirect(`/assessment/${inProgress.id}/resume`);
  }

  return (
    <main id="main" className={styles.main}>
      <h1 className={styles.title}>{PENDING.startHeadline}</h1>
      <p className={styles.lede}>{ASSESSMENT_ENTRY.intro}</p>
      <ul className={styles.list}>
        {ASSESSMENT_ENTRY.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <p className={styles.body}>{PENDING.savePrivacy}</p>

      <h2 className={`${styles.label} ${styles.body}`}>{PENDING.modulesHeading}</h2>
      <ol className={styles.moduleList}>
        {MODULES.map((m) => (
          <li key={m.module_id} className={styles.moduleItem}>
            <span>
              {m.module_order}. {m.module_title}
            </span>
          </li>
        ))}
      </ol>

      <div className={styles.actions}>
        <StartButton />
      </div>
    </main>
  );
}

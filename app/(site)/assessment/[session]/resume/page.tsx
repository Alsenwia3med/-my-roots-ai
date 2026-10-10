// ASM-08 · Resume Summary (/assessment/[session]/resume). No health-answer preview; progress,
// last saved time, questionnaire version, Resume Assessment and a confirmed restart.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import styles from '../../assessment.module.css';
import RestartButton from '../../_components/RestartButton';
import { fill, LABELS, PENDING } from '@/lib/assessment/copy';
import { requireOwnedAssessment } from '@/lib/assessment/guards';
import { moduleStates, resumeModuleOrder } from '@/lib/assessment/progress';
import { getModuleByOrder } from '@/lib/assessment/questionBank';
import { loadAnswers } from '@/lib/assessment/store';

export const dynamic = 'force-dynamic';

export default async function ResumePage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = await params;
  const { supabase, assessment } = await requireOwnedAssessment(session);
  if (assessment.status === 'submitted') redirect(`/assessment/${assessment.id}/submitted`);
  if (assessment.status !== 'in_progress') redirect('/assessment/continue');

  const answered = Object.keys(await loadAnswers(supabase, assessment.id));
  const complete = moduleStates(answered).filter((m) => m.state === 'complete').length;
  const resumeAt = resumeModuleOrder(answered);
  const resumeModule = getModuleByOrder(resumeAt)!;
  const allComplete = complete === 13;

  return (
    <main id="main" className={styles.main}>
      <h1 className={styles.title}>{PENDING.resumeHeadline}</h1>
      <p className={styles.lede}>
        {fill(PENDING.resumeProgress, { complete, n: resumeAt, title: resumeModule.module_title })}
      </p>
      <div className={styles.card}>
        <p className={styles.body}>
          {assessment.last_saved_at
            ? fill(PENDING.lastSaved, {
                time: new Date(assessment.last_saved_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC',
              })
            : PENDING.notSavedYet}
        </p>
        <p className={`${styles.body} ${styles.muted}`}>
          {fill(PENDING.questionnaireVersion, { version: assessment.questionnaire_version })}
        </p>
      </div>
      <div className={styles.actions}>
        <Link
          className={styles.btn}
          href={allComplete ? `/assessment/${assessment.id}/review` : `/assessment/${assessment.id}/module/${resumeAt}`}
        >
          {LABELS.resumeAssessment}
        </Link>
        <RestartButton assessmentId={assessment.id} />
      </div>
    </main>
  );
}

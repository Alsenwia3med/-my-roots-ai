// ASM-09 · Review and Submit (/assessment/[session]/review). 13 modules with Complete / Needs
// attention, links to unanswered required questions, optional omissions allowed, boundary text.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import styles from '../../assessment.module.css';
import SubmitPanel from '../../_components/SubmitPanel';
import { LABELS, PENDING } from '@/lib/assessment/copy';
import { requireOwnedAssessment } from '@/lib/assessment/guards';
import { moduleStates } from '@/lib/assessment/progress';
import { getQuestion } from '@/lib/assessment/questionBank';
import { loadAnswers } from '@/lib/assessment/store';

export const dynamic = 'force-dynamic';

export default async function ReviewPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = await params;
  const { supabase, user, assessment } = await requireOwnedAssessment(session);
  if (assessment.status === 'submitted') redirect(`/assessment/${assessment.id}/submitted`);
  if (assessment.status !== 'in_progress') redirect('/assessment/continue');

  const states = moduleStates(Object.keys(await loadAnswers(supabase, assessment.id)));
  // RLS: the participant's own profile only.
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle();
  const complete = states.every((m) => m.state === 'complete');

  return (
    <main id="main" className={styles.main}>
      <h1 className={styles.title}>{PENDING.reviewHeadline}</h1>
      <p className={`${styles.lede} ${styles.muted}`}>{PENDING.reviewOptional}</p>

      <ol className={styles.moduleList}>
        {states.map(({ module, state, missing }) => (
          <li key={module.module_id} className={styles.moduleItem}>
            <span>
              {module.module_order}. {module.module_title}
            </span>
            <span className={`${styles.state} ${state === 'complete' ? styles.stateComplete : styles.stateAttention}`}>
              {state === 'complete' ? LABELS.complete : LABELS.needsAttention}
            </span>
            {missing.length > 0 && (
              <ul style={{ flexBasis: '100%', display: 'grid', gap: 4, paddingLeft: 20 }}>
                {missing.map((questionId) => (
                  <li key={questionId}>
                    <Link className={styles.link} href={`/assessment/${assessment.id}/module/${module.module_order}#${questionId}`}>
                      {getQuestion(questionId)?.question_text}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      <p className={styles.body}>{PENDING.reviewBoundary}</p>

      <SubmitPanel assessmentId={assessment.id} complete={complete} initialName={(profile?.display_name as string | null) ?? null} />
    </main>
  );
}

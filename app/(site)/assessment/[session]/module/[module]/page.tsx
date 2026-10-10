// ASM-06 · Module Question Shell (/assessment/[session]/module/[1..13]).

import { notFound, redirect } from 'next/navigation';
import styles from '../../../assessment.module.css';
import ModuleShell from '../../../_components/ModuleShell';
import { requireOwnedAssessment } from '@/lib/assessment/guards';
import { getModuleByOrder, getModuleQuestions } from '@/lib/assessment/questionBank';
import { loadAnswers } from '@/lib/assessment/store';
import { assessmentIdleTimeoutMinutes } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function ModulePage({ params }: { params: Promise<{ session: string; module: string }> }) {
  const { session, module } = await params;
  const order = Number(module);
  const current = Number.isInteger(order) ? getModuleByOrder(order) : undefined;
  if (!current) notFound();

  const { supabase, assessment } = await requireOwnedAssessment(session);
  if (assessment.status === 'submitted') redirect(`/assessment/${assessment.id}/submitted`);
  if (assessment.status !== 'in_progress') redirect('/assessment/continue');

  const answers = await loadAnswers(supabase, assessment.id);

  return (
    <main id="main" className={styles.main}>
      <ModuleShell
        key={current.module_id}
        assessmentId={assessment.id}
        module={current}
        questions={getModuleQuestions(current.module_id)}
        initialAnswers={answers}
        initialLastSavedAt={assessment.last_saved_at}
        idleTimeoutMinutes={assessmentIdleTimeoutMinutes()}
      />
    </main>
  );
}

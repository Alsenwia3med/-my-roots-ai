// Routes a verified participant to the right step (after the secure link, or from any "Start Your
// Assessment" button while signed in). Renders nothing:
//   no consent yet               -> consent (ASM-04)
//   assessment in progress       -> resume summary (ASM-08), or introduction if nothing answered
//   has submitted before         -> their reports (/report), which offers "Start a new assessment"
//   first visit                  -> introduction (ASM-05)

import { redirect } from 'next/navigation';
import { requirePageParticipant } from '@/lib/assessment/guards';
import { getInProgressAssessment, getLatestSubmittedAssessment, hasServiceConsent, loadAnswers } from '@/lib/assessment/store';

export const dynamic = 'force-dynamic';

export default async function ContinuePage() {
  const { supabase, user } = await requirePageParticipant();

  if (!(await hasServiceConsent(supabase, user.id))) redirect('/assessment/consent');

  const inProgress = await getInProgressAssessment(supabase);
  if (inProgress) {
    const answers = await loadAnswers(supabase, inProgress.id);
    redirect(Object.keys(answers).length ? `/assessment/${inProgress.id}/resume` : '/assessment/start');
  }

  const submitted = await getLatestSubmittedAssessment(supabase);
  if (submitted) redirect('/report');

  redirect('/assessment/start');
}

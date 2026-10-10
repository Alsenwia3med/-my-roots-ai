// ASM-10 · Report Generating / ASM-11 · Submission Recovery (/assessment/[session]/submitted).
// Shows the submission reference and timestamp and the true pipeline state: answers received,
// scores calculated (C-02), report prepared (C-03). Ready: a link to the report. If the report
// could not be completed: ASM-11 — the exact C-04 recovery copy and "Retry Report Preparation",
// which re-runs preparation only; there is never a "Submit again".

import Link from 'next/link';
import { redirect } from 'next/navigation';
import styles from '../../assessment.module.css';
import RetryReportButton from '../../_components/RetryReportButton';
import SignOutButton from '../../_components/SignOutButton';
import { fill, PENDING } from '@/lib/assessment/copy';
import { requireOwnedAssessment } from '@/lib/assessment/guards';

export const dynamic = 'force-dynamic';

/** C-04 exact copy (ASM-11 contract). */
const REPORT_FAILED_COPY =
  'Your answers were submitted safely, but the report could not be completed. Try again later or contact support through the Contact page.';

export default async function SubmittedPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = await params;
  const { supabase, assessment } = await requireOwnedAssessment(session);
  if (assessment.status !== 'submitted') redirect(`/assessment/${assessment.id}/resume`);

  // Participant session: RLS returns only this participant's own rows.
  const [{ data: scoreRow }, { data: report }] = await Promise.all([
    supabase.from('scores').select('id').eq('assessment_id', assessment.id).maybeSingle(),
    supabase.from('reports').select('id, status').eq('assessment_id', assessment.id).maybeSingle(),
  ]);
  const scored = Boolean(scoreRow);
  const ready = report?.status === 'completed';

  const time = new Date(assessment.submitted_at!).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
  const done = <span className={`${styles.state} ${styles.stateComplete}`}>✓</span>;
  const pending = <span className={styles.muted}>{PENDING.stepPending}</span>;

  return (
    <main id="main" className={styles.main}>
      <h1 className={styles.title}>{PENDING.submittedHeadline}</h1>
      <div className={styles.card} role="status">
        <p className={styles.body}>{fill(PENDING.submissionReference, { reference: assessment.submission_reference ?? '' })}</p>
        <p className={styles.body}>{fill(PENDING.submittedAt, { time })}</p>
      </div>
      <ol className={styles.steps}>
        <li className={styles.step}>
          <span>{PENDING.stepAnswersReceived}</span>
          {done}
        </li>
        <li className={styles.step}>
          <span>{PENDING.stepScores}</span>
          {scored ? done : pending}
        </li>
        <li className={styles.step}>
          <span>{PENDING.stepReport}</span>
          {ready ? done : pending}
        </li>
      </ol>

      {ready ? (
        <div className={styles.actions}>
          <Link href={`/report/${report!.id}`} className={styles.btn}>
            Open your report
          </Link>
          <Link href="/report" className={styles.btnSecondary}>
            View all your reports
          </Link>
          <SignOutButton />
        </div>
      ) : (
        <>
          <div className={styles.card} role="alert">
            <p className={styles.body}>{REPORT_FAILED_COPY}</p>
          </div>
          <div className={styles.actions}>
            <RetryReportButton assessmentId={assessment.id} />
            <Link href="/contact" className={styles.btnSecondary}>
              Contact Support
            </Link>
            <SignOutButton />
          </div>
        </>
      )}
    </main>
  );
}

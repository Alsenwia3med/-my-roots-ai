// Report history (/report) — SOW 3.5 "Users can view past reports". Every submitted assessment,
// newest first, with its report and headline scores; plus the way to start (or continue) the
// next assessment. Private to the signed-in participant; each report opened is audited on
// /report/[id]. Sharing is not offered: C-03 RPT-06 requires report access to be private.

import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './report.module.css';
import ReportAccessError from './_components/ReportAccessError';
import { listOwnReports } from '@/lib/report/history';
import { getParticipant } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your reports — ROOTS-AI™',
  robots: { index: false, follow: false },
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { dateStyle: 'long', timeZone: 'UTC' }) : '—';

export default async function ReportHistoryPage() {
  const { supabase, user } = await getParticipant();
  if (!user) return <ReportAccessError kind="expired" />;

  const [history, { data: inProgress }] = await Promise.all([
    listOwnReports(supabase, user.id),
    // Filtered by owner explicitly: RLS would also show staff everyone's assessments.
    supabase.from('assessments').select('id').eq('profile_id', user.id).eq('status', 'in_progress').maybeSingle(),
  ]);

  const next = inProgress
    ? { href: '/assessment/continue', label: 'Continue your assessment' }
    : { href: '/assessment/start', label: 'Start a new assessment' };

  return (
    <main id="main" className={styles.wrap}>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.historyTitle}>Your reports</h1>
          <div className={styles.meta}>Every assessment you have submitted, newest first.</div>
        </div>
        <Link href={next.href} className={styles.btn}>
          {next.label}
        </Link>
      </div>

      {history.length === 0 ? (
        <div className={styles.section}>
          <p className={styles.para}>You have not submitted an assessment yet.</p>
        </div>
      ) : (
        <ol className={styles.historyList}>
          {history.map((h) => {
            const ready = h.report?.status === 'completed';
            return (
              <li key={h.assessmentId} className={styles.section}>
                <div className={styles.historyRow}>
                  <div>
                    <div className={styles.itemLabel}>Submitted {formatDate(h.submittedAt)}</div>
                    <div className={styles.meta}>
                      {ready ? `Report ${h.report!.reference}` : 'Report not yet available'} · Questionnaire {h.questionnaireVersion}
                    </div>
                    {h.biologicalState !== null && (
                      <div className={styles.para}>
                        Biological State {h.biologicalState}/100{h.confidenceLabel ? ` · Confidence ${h.confidenceLabel}` : ''}
                      </div>
                    )}
                  </div>
                  {ready ? (
                    <Link href={`/report/${h.report!.id}`} className={styles.btn}>
                      Open report
                    </Link>
                  ) : (
                    // The submitted page offers ASM-11 "Retry Report Preparation".
                    <Link href={`/assessment/${h.assessmentId}/submitted`} className={`${styles.btn} ${styles.btnSecondary}`}>
                      Check status
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className={styles.meta}>
        <Link href="/account/privacy">Your data and privacy</Link> — download your data or request deletion.
      </p>
    </main>
  );
}

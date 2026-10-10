// RPT-01/02/03/05 · Participant report (/report/[id]).
//
// RPT-01 access: the owner's session only — the report is read through Row Level Security, so
// another participant's report reads as not found, and every outcome shows the same generic
// RPT-05 page (existence is never confirmed). RPT-02: the 19 sections, rendered only from the
// stored canonical JSON, after its hash is re-verified. Every successful view is audited.

import type { Metadata } from 'next';
import styles from '../report.module.css';
import ReportAccessError from '../_components/ReportAccessError';
import ReportActions from '../_components/ReportActions';
import ReportNav from '../_components/ReportNav';
import Section, { formatDate } from '../_components/ReportSectionView';
import { UUID_PATTERN } from '@/lib/api/http';
import { audit } from '@/lib/audit';
import { loadOwnedReport } from '@/lib/report/access';
import { EDUCATIONAL_BADGE } from '@/lib/report/c03-content';
import { headlineMetrics } from '@/lib/report/metrics';
import { getParticipant } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ROOTS Biological Intelligence Report™',
  robots: { index: false, follow: false },
};

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return <ReportAccessError kind="unavailable" />;

  const { supabase, user } = await getParticipant();
  if (!user) return <ReportAccessError kind="expired" />;

  const owned = await loadOwnedReport(supabase, user.id, id, 'report.viewed');
  if (!owned.ok) return <ReportAccessError kind={owned.kind} />;
  const { report, row } = owned;

  await audit({ action: 'report.viewed', result: 'success', actorId: user.id, objectType: 'report', objectId: row.id });
  if (!row.first_viewed_at) {
    await getSupabaseAdmin().from('reports').update({ first_viewed_at: new Date().toISOString() }).eq('id', row.id).is('first_viewed_at', null);
  }

  const metrics = headlineMetrics(report);

  return (
    <main id="main" className={styles.wrap}>
      <div className={styles.toolbar}>
        <div>
          <div className={styles.toolbarId}>Report {report.report_id}</div>
          <div className={styles.meta}>
            {formatDate(report.generated_at)} · Report template {report.report_template_version}
          </div>
        </div>
        <ReportActions reportId={row.id} />
      </div>

      <div className={styles.layout}>
        <ReportNav sections={report.sections.map((s) => ({ number: s.number, title: s.title }))} />

        <div>
          <div className={styles.cover}>
            <div className={styles.badge}>{EDUCATIONAL_BADGE}</div>
            <h1 className={styles.coverTitle}>{report.report_title}</h1>
            <div className={styles.coverName}>{report.participant_display}</div>
            <div className={styles.coverMeta}>
              Report {report.report_id} · {formatDate(report.generated_at)}
            </div>
            <div className={styles.coverMeta}>
              Questionnaire {report.questionnaire_version} · Scoring {report.scoring_version}
            </div>
          </div>

          <div className={styles.metrics}>
            {metrics.map((m) => (
              <div key={m.label} className={styles.metric}>
                <div className={styles.metricLabel}>{m.label}</div>
                <div className={`${styles.metricValue} ${/\d/.test(m.value) ? '' : styles.metricText}`}>{m.value}</div>
                <div className={styles.metricNote}>{m.note}</div>
              </div>
            ))}
          </div>

          {report.sections.map((section) => (
            <Section key={section.number} section={section} />
          ))}

          <footer className={styles.footer} data-report-footer>
            <strong>Versions</strong>
            <div>
              Questionnaire {report.questionnaire_version} · Scoring {report.scoring_version} · Report {report.report_template_version} · Narrative{' '}
              {report.narrative_template_version} · Disclaimer {report.disclaimer_version}
            </div>
            <div>Audit reference: {report.audit_trace_reference}</div>
            <a className={styles.link} href="#section-19">Medical and AI Disclaimer</a>
          </footer>
        </div>
      </div>

      {/* PDF running footer (C-03 §2): report ID, generated timestamp, version, boundary. */}
      <div className={styles.printFooter} aria-hidden="true">
        {report.report_id} · {formatDate(report.generated_at)} · v{report.report_template_version} · {EDUCATIONAL_BADGE}
      </div>
    </main>
  );
}

// ADM-02 · Operations Overview (/admin/overview). Operational state without unnecessary health
// detail: counts, queues, release status, system health and — for Super Admins only — a
// preview of recent privileged events. Where no source exists yet, the screen says so rather
// than showing an invented value.

import Link from 'next/link';
import styles from '../../admin.module.css';
import { PageHead, PermissionDenied } from '../../_components/PageHead';
import { requireStaffPage } from '@/lib/admin/guard';
import { formatDateTime, overviewMetrics, listAudit, shortId } from '@/lib/admin/data';
import { QUESTIONNAIRE_VERSION } from '@/lib/assessment/questionBank';
import { REPORT_TEMPLATE_VERSION } from '@/lib/report/c03-content';
import { SCORING_VERSION } from '@/lib/scoring/c02-ruleset';
import { pseudonym } from '@/lib/admin/format';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { C01_SOURCE, C02_SOURCE } from '@/lib/versions';

export const dynamic = 'force-dynamic';

const NOT_CONFIGURED = 'Not configured';

export default async function OverviewPage() {
  const { ctx, allowed } = await requireStaffPage(['admin', 'super_admin']);
  if (!allowed) return <PermissionDenied />;

  const m = await overviewMetrics(ctx.supabase);
  const isSuper = ctx.roles.includes('super_admin');
  const recent = isSuper ? await listAudit(ctx.supabase, { page: 1 }) : null;
  // data_requests is server-only (service role); read after the staff check above.
  const { data: deletionQueue } = await getSupabaseAdmin()
    .from('data_requests')
    .select('id, profile_id, requested_at')
    .eq('status', 'pending')
    .order('requested_at')
    .limit(10);
  const value = (v: number | null) => (v === null ? '—' : v.toLocaleString('en-GB'));

  const metrics = [
    { label: 'Assessments in progress', value: value(m.inProgress) },
    { label: 'Submitted', value: value(m.submitted) },
    { label: 'Reports ready', value: value(m.reportsReady) },
    { label: 'Reports failed', value: value(m.reportsFailed) },
    { label: 'Open incidents', value: NOT_CONFIGURED },
  ];

  return (
    <>
      <PageHead title="Operations Overview" subtitle="Operational state without unnecessary health detail" access="Admin / Super Admin" />

      <div className={styles.metrics}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metric}>
            <div className={styles.metricLabel}>{metric.label}</div>
            <div className={styles.metricValue} style={metric.value === NOT_CONFIGURED ? { fontSize: 16, color: 'var(--zd-muted)' } : undefined}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Queues</h2>
      <div className={styles.card}>
        <div className={styles.label}>Recent report failures</div>
        {m.failures.length === 0 ? (
          <p className={styles.muted}>No report failures.</p>
        ) : (
          <ul className={styles.timeline}>
            {m.failures.map((f) => (
              <li key={f.assessment_id as string}>
                <Link className={`${styles.link} ${styles.mono}`} href={`/admin/reports?status=failed&detail=${f.id as string}`}>
                  {shortId(f.assessment_id as string)}
                </Link>
                <span className={styles.muted}>v{f.report_version as string}</span>
                <span className={styles.muted}>{formatDateTime(f.created_at as string)}</span>
              </li>
            ))}
          </ul>
        )}
        <hr className={styles.divider} />
        <div className={styles.label}>Pending deletion requests</div>
        {!deletionQueue?.length ? (
          <p className={styles.muted}>No pending deletion requests.</p>
        ) : (
          <ul className={styles.timeline}>
            {deletionQueue.map((d) => (
              <li key={d.id as string}>
                <Link className={`${styles.link} ${styles.mono}`} href={`/admin/participants/${d.profile_id as string}`}>
                  {pseudonym(d.profile_id as string)}
                </Link>
                <span className={styles.muted}>requested {formatDateTime(d.requested_at as string)}</span>
              </li>
            ))}
          </ul>
        )}
        <hr className={styles.divider} />
        <div className={styles.label}>Support actions</div>
        <p className={styles.muted}>{NOT_CONFIGURED}</p>
      </div>

      <h2 className={styles.sectionTitle}>Release status</h2>
      <div className={`${styles.card} ${styles.kv}`}>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Questionnaire</span>
          <span className={styles.kvValue}>{C01_SOURCE.label} · questionnaire {QUESTIONNAIRE_VERSION}</span>
        </div>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Scoring</span>
          <span className={styles.kvValue}>{C02_SOURCE.label} · scoring {SCORING_VERSION}</span>
        </div>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Report template</span>
          <span className={styles.kvValue}>C-03 v{REPORT_TEMPLATE_VERSION}</span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>System health</h2>
      <div className={`${styles.card} ${styles.kv}`}>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Services</span>
          <span className={styles.kvValue} style={{ color: m.healthy ? 'var(--zd-success)' : 'var(--zd-error)' }}>
            {m.healthy ? 'Operational' : 'Degraded — some data could not be read'}
          </span>
        </div>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Backups</span>
          <span className={styles.kvValue}>Managed by the database provider; not reported to the application</span>
        </div>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Last restore test</span>
          <span className={styles.kvValue}>Not recorded</span>
        </div>
      </div>

      {isSuper && recent && (
        <>
          <h2 className={styles.sectionTitle}>Audit preview</h2>
          <div className={styles.card}>
            <span className={`${styles.pill} ${styles.pillSuper}`}>SUPER ADMIN ONLY</span>
            <ul className={styles.timeline} style={{ marginTop: 'var(--zd-space-4)' }}>
              {recent.rows.slice(0, 5).map((e) => (
                <li key={e.id}>
                  <span className={styles.muted}>{formatDateTime(e.occurred_at)}</span>
                  <span className={styles.mono}>{e.action}</span>
                  <span>{e.result}</span>
                </li>
              ))}
            </ul>
            <p className={`${styles.muted} ${styles.small}`} style={{ marginTop: 'var(--zd-space-3)' }}>
              Role-gated preview; no participant health detail. <Link className={styles.link} href="/admin/audit">Open audit viewer</Link>
            </p>
          </div>
        </>
      )}
    </>
  );
}

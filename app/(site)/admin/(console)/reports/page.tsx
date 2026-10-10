// ADM-05 · Report Operations (/admin/reports). Admin. Monitor report generation and recover
// failures: filters (status, date, version), a paged report table, and a failure-detail panel
// with the failure code, a safe trace reference, recovery and a link to the audit events.
// Recovery only — scores and answers are never edited from this screen, and report content
// (answers, narrative) is never shown here.

import Link from 'next/link';
import styles from '../../admin.module.css';
import ConfirmAction from '../../_components/ConfirmAction';
import { PageHead, PermissionDenied } from '../../_components/PageHead';
import { requireStaffPage } from '@/lib/admin/guard';
import { hasAnyRole } from '@/lib/admin/roles';
import { formatDateTime, isRecoverable, listReports, reportVersions, shortId, type ReportFilters } from '@/lib/admin/data';

export const dynamic = 'force-dynamic';

type Search = { status?: string; version?: string; from?: string; to?: string; page?: string; detail?: string };

const STATUS_LABELS = { completed: 'Ready', generating: 'Generating', failed: 'Failed' } as const;

/** Plain-language meaning of each failure code written by report generation. */
const FAILURE_TEXT: Record<string, string> = {
  SCORES_MISSING: 'No stored scores for this assessment, so no report could be built.',
  SCORES_MISMATCH: 'Recomputed scores differ from the stored scores. The report is withheld; escalate — do not retry repeatedly.',
  REPORT_WRITE_FAILED: 'The report was built but could not be saved.',
  UNKNOWN: 'Unexpected error during generation.',
};

const isDate = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { ctx, allowed } = await requireStaffPage(['admin', 'super_admin']);
  if (!allowed) return <PermissionDenied />;

  const sp = await searchParams;
  const versions = await reportVersions(ctx.supabase);
  const filters: ReportFilters = {
    status: sp.status && sp.status in STATUS_LABELS ? (sp.status as ReportFilters['status']) : undefined,
    version: sp.version && versions.includes(sp.version) ? sp.version : undefined,
    from: isDate(sp.from),
    to: isDate(sp.to),
    page: Number(sp.page) || 1,
  };
  const result = await listReports(ctx.supabase, filters);
  const selected = sp.detail ? result.rows.find((r) => r.id === sp.detail) : undefined;
  const canSeeAudit = hasAnyRole(ctx.roles, ['super_admin']);

  const href = (extra: Record<string, string>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v && k !== 'page') q.set(k, String(v));
    q.set('page', String(result.page));
    for (const [k, v] of Object.entries(extra)) q.set(k, v);
    return `/admin/reports?${q.toString()}`;
  };

  return (
    <>
      <PageHead title="Report Operations" subtitle="Monitor generation and recover approved failures" access="Admin" />

      <h2 className={styles.sectionTitle}>Filters</h2>
      <form className={`${styles.card} ${styles.filters}`} method="get" action="/admin/reports">
        <div>
          <label className={styles.label} htmlFor="r-status">Status</label>
          <select id="r-status" name="status" className={styles.input} defaultValue={filters.status ?? ''}>
            <option value="">All</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={styles.label} htmlFor="r-from">Created from</label>
          <input id="r-from" type="date" name="from" className={styles.input} defaultValue={filters.from ?? ''} />
        </div>
        <div>
          <label className={styles.label} htmlFor="r-to">Created to</label>
          <input id="r-to" type="date" name="to" className={styles.input} defaultValue={filters.to ?? ''} />
        </div>
        <div>
          <label className={styles.label} htmlFor="r-version">Version</label>
          <select id="r-version" name="version" className={styles.input} defaultValue={filters.version ?? ''}>
            <option value="">All</option>
            {versions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className={styles.actions} style={{ marginTop: 0 }}>
          <button type="submit" className={styles.btn}>Apply</button>
          <Link href="/admin/reports" className={`${styles.btn} ${styles.btnSecondary}`}>Clear</Link>
        </div>
      </form>

      <h2 className={styles.sectionTitle}>Reports</h2>
      <div className={styles.card}>
        {result.rows.length === 0 ? (
          <p className={styles.empty}>No reports match these filters.</p>
        ) : (
          <div className={styles.tableScroll} role="region" aria-label="Reports, scrollable" tabIndex={0}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Report ID</th>
                  <th scope="col">Participant</th>
                  <th scope="col">Versions</th>
                  <th scope="col">Status</th>
                  <th scope="col">Timestamps</th>
                  <th scope="col" aria-label="Detail" />
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.id} aria-selected={selected?.id === r.id || undefined}>
                    <td className={styles.mono}>{r.reference ?? shortId(r.id)}</td>
                    <td className={styles.mono}>{r.pseudonym}</td>
                    <td className={styles.small}>Report {r.reportVersion}<br />Questionnaire {r.questionnaireVersion ?? '—'}</td>
                    <td>{STATUS_LABELS[r.status]}</td>
                    <td className={styles.small}>
                      Created {formatDateTime(r.createdAt)}
                      <br />
                      {r.generatedAt ? `Generated ${formatDateTime(r.generatedAt)}` : `Updated ${formatDateTime(r.updatedAt)}`}
                    </td>
                    <td><Link className={styles.link} href={href({ detail: r.id })}>Detail</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.pagination}>
        <span>Page {result.page} of {result.totalPages} · {result.total.toLocaleString('en-GB')} report{result.total === 1 ? '' : 's'}</span>
        <span className={styles.badges}>
          {result.page > 1 && <Link className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} href={href({ page: String(result.page - 1) })}>Previous</Link>}
          {result.page < result.totalPages && <Link className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} href={href({ page: String(result.page + 1) })}>Next</Link>}
        </span>
      </div>

      <h2 className={styles.sectionTitle}>Failure detail</h2>
      <div className={styles.card}>
        {!selected ? (
          <p className={styles.empty}>Select a report to see its detail.</p>
        ) : (
          <>
            <div className={styles.kv}>
              <div className={styles.kvRow}><span className={styles.kvKey}>Report</span><span className={`${styles.kvValue} ${styles.mono}`}>{selected.reference ?? selected.id}</span></div>
              <div className={styles.kvRow}><span className={styles.kvKey}>Status</span><span className={styles.kvValue}>{STATUS_LABELS[selected.status]}</span></div>
              <div className={styles.kvRow}>
                <span className={styles.kvKey}>Failure code</span>
                <span className={styles.kvValue}>
                  {selected.status === 'failed' ? (
                    <>
                      <span className={styles.mono}>{selected.failureCode ?? 'UNKNOWN'}</span>
                      <br />
                      <span className={styles.small}>{FAILURE_TEXT[selected.failureCode ?? 'UNKNOWN'] ?? FAILURE_TEXT.UNKNOWN}</span>
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvKey}>Safe trace reference</span>
                <span className={`${styles.kvValue} ${styles.mono}`}>assessment/{selected.assessmentId} · report/{selected.id}</span>
              </div>
            </div>
            <div className={styles.actions}>
              {isRecoverable(selected) && (
                <ConfirmAction
                  label="Retry report"
                  title="Retry report preparation?"
                  body={`The report for ${selected.pseudonym} will be prepared again from the submitted answers and stored scores. Scores are never edited. This action is recorded in the audit log.`}
                  endpoint={`/api/v1/admin/reports/${selected.id}/retry`}
                  confirmLabel="Retry now"
                  successText="The report has been prepared."
                />
              )}
              {canSeeAudit && (
                <Link className={styles.link} href={`/admin/audit?ref=${selected.assessmentId}`}>Audit events →</Link>
              )}
            </div>
          </>
        )}
      </div>
      <p className={`${styles.muted} ${styles.small}`} style={{ marginTop: 'var(--zd-space-3)' }}>
        Recovery only. Scores are never edited from this screen.
      </p>
    </>
  );
}

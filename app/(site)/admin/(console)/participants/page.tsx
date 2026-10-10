// ADM-03 · Participants (/admin/participants). Filters limited to status, date and report
// state; pseudonymous identity with masked email; open detail or resend the approved link.
// No free-text health-answer search, no bulk export, server-side pagination with the filters
// persisted in the URL.

import Link from 'next/link';
import styles from '../../admin.module.css';
import { PageHead, PermissionDenied } from '../../_components/PageHead';
import ResendLinkButton from '../../_components/ResendLinkButton';
import { requireStaffPage } from '@/lib/admin/guard';
import {
  formatDateTime,
  listParticipants,
  REPORT_LABELS,
  STATUS_LABELS,
  type ParticipantStatus,
  type ReportState,
} from '@/lib/admin/data';

export const dynamic = 'force-dynamic';

type Search = { status?: string; report?: string; from?: string; to?: string; page?: string };

const isDate = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export default async function ParticipantsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { ctx, allowed } = await requireStaffPage(['admin', 'super_admin']);
  if (!allowed) return <PermissionDenied />;

  const sp = await searchParams;
  const status = sp.status && sp.status in STATUS_LABELS ? (sp.status as ParticipantStatus) : undefined;
  const report = sp.report && sp.report in REPORT_LABELS ? (sp.report as ReportState) : undefined;
  const from = isDate(sp.from);
  const to = isDate(sp.to);
  const result = await listParticipants(ctx.supabase, { status, report, from, to, page: Number(sp.page) || 1 });

  const pageHref = (page: number) => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (report) q.set('report', report);
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    q.set('page', String(page));
    return `/admin/participants?${q.toString()}`;
  };

  return (
    <>
      <PageHead title="Participants" subtitle="Find and operate participant records" access="Admin" />

      <h2 className={styles.sectionTitle}>Filters</h2>
      <form className={`${styles.card} ${styles.filters}`} method="get" action="/admin/participants">
        <div>
          <label className={styles.label} htmlFor="f-status">Status</label>
          <select id="f-status" name="status" className={styles.input} defaultValue={status ?? ''}>
            <option value="">All</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={styles.label} htmlFor="f-from">Joined from</label>
          <input id="f-from" type="date" name="from" className={styles.input} defaultValue={from ?? ''} />
        </div>
        <div>
          <label className={styles.label} htmlFor="f-to">Joined to</label>
          <input id="f-to" type="date" name="to" className={styles.input} defaultValue={to ?? ''} />
        </div>
        <div>
          <label className={styles.label} htmlFor="f-report">Report state</label>
          <select id="f-report" name="report" className={styles.input} defaultValue={report ?? ''}>
            <option value="">All</option>
            {Object.entries(REPORT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className={styles.actions} style={{ marginTop: 0 }}>
          <button type="submit" className={styles.btn}>Apply</button>
          <Link href="/admin/participants" className={`${styles.btn} ${styles.btnSecondary}`}>Clear</Link>
        </div>
      </form>

      <h2 className={styles.sectionTitle}>Participant records</h2>
      <div className={styles.card}>
        {result.rows.length === 0 ? (
          <p className={styles.empty}>No participants match these filters.</p>
        ) : (
          <div className={styles.tableScroll} role="region" aria-label="Participant records, scrollable" tabIndex={0}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Participant</th>
                  <th scope="col">Masked email</th>
                  <th scope="col">Status</th>
                  <th scope="col">Report</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Last activity</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.mono}>{p.pseudonym}</td>
                    <td>{p.maskedEmail}</td>
                    <td>{STATUS_LABELS[p.status]}</td>
                    <td>{REPORT_LABELS[p.reportState]}</td>
                    <td>{formatDateTime(p.createdAt)}</td>
                    <td>{formatDateTime(p.lastActivity)}</td>
                    <td>
                      <div className={styles.badges}>
                        <Link className={styles.link} href={`/admin/participants/${p.id}`}>Open detail</Link>
                        <ResendLinkButton participantId={p.id} pseudonym={p.pseudonym} compact />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.pagination}>
        <span>
          Page {result.page} of {result.totalPages} · {result.total.toLocaleString('en-GB')} participant{result.total === 1 ? '' : 's'}
        </span>
        <span className={styles.badges}>
          {result.page > 1 && <Link className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} href={pageHref(result.page - 1)}>Previous</Link>}
          {result.page < result.totalPages && <Link className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} href={pageHref(result.page + 1)}>Next</Link>}
        </span>
      </div>
      <p className={`${styles.muted} ${styles.small}`} style={{ marginTop: 'var(--zd-space-3)' }}>
        No free-text health-answer search. No bulk export.
      </p>
    </>
  );
}

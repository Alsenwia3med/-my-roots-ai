// ADM-08 · Audit Viewer (/admin/audit). Super Admin only. Review append-only privileged and
// security events: filters, a paged event table and structured detail with secrets and
// personal data redacted. There is no delete or edit control — the database refuses both.

import Link from 'next/link';
import styles from '../../admin.module.css';
import { PageHead, PermissionDenied } from '../../_components/PageHead';
import { requireStaffPage } from '@/lib/admin/guard';
import { formatDateTime, listAudit, redactDetails, shortId } from '@/lib/admin/data';
import { appEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

type Search = { actor?: string; action?: string; object?: string; ref?: string; result?: string; from?: string; to?: string; page?: string; event?: string };

const isDate = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
const clean = (v?: string) => (v ? v.trim().slice(0, 80) || undefined : undefined);

export default async function AuditPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { ctx, allowed } = await requireStaffPage(['super_admin']);
  if (!allowed) return <PermissionDenied />;

  const sp = await searchParams;
  const filters = {
    actor: clean(sp.actor),
    action: clean(sp.action),
    object: clean(sp.object),
    ref: clean(sp.ref),
    result: ['success', 'denied', 'failure'].includes(sp.result ?? '') ? sp.result : undefined,
    from: isDate(sp.from),
    to: isDate(sp.to),
    page: Number(sp.page) || 1,
  };
  const result = await listAudit(ctx.supabase, filters);
  const selected = sp.event ? result.rows.find((r) => r.id === sp.event) : undefined;

  const href = (extra: Record<string, string>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v && k !== 'page') q.set(k, String(v));
    q.set('page', String(result.page));
    for (const [k, v] of Object.entries(extra)) q.set(k, v);
    return `/admin/audit?${q.toString()}`;
  };

  return (
    <>
      <PageHead title="Audit Viewer" subtitle="Append-only privileged and security events" access="Super Admin" />

      <div className={styles.notice}>
        <span className={styles.noticeTitle}>Append-only audit evidence</span>
        No delete or edit control. Records cannot be changed, including by administrators.
      </div>

      <h2 className={styles.sectionTitle}>Filters</h2>
      <form className={`${styles.card} ${styles.filters}`} method="get" action="/admin/audit">
        <div>
          <label className={styles.label} htmlFor="a-actor">Actor</label>
          <input id="a-actor" name="actor" className={styles.input} placeholder="admin, participant, or account ID" defaultValue={filters.actor ?? ''} />
        </div>
        <div>
          <label className={styles.label} htmlFor="a-action">Action</label>
          <input id="a-action" name="action" className={styles.input} placeholder="e.g. auth.secure_link" defaultValue={filters.action ?? ''} />
        </div>
        <div>
          <label className={styles.label} htmlFor="a-object">Object</label>
          <input id="a-object" name="object" className={styles.input} placeholder="e.g. assessment" defaultValue={filters.object ?? ''} />
        </div>
        <div>
          <label className={styles.label} htmlFor="a-result">Result</label>
          <select id="a-result" name="result" className={styles.input} defaultValue={filters.result ?? ''}>
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="denied">Denied</option>
            <option value="failure">Failure</option>
          </select>
        </div>
        <div>
          <label className={styles.label} htmlFor="a-from">From</label>
          <input id="a-from" type="date" name="from" className={styles.input} defaultValue={filters.from ?? ''} />
        </div>
        <div>
          <label className={styles.label} htmlFor="a-to">To</label>
          <input id="a-to" type="date" name="to" className={styles.input} defaultValue={filters.to ?? ''} />
        </div>
        <div>
          <span className={styles.label}>Environment</span>
          <span className={styles.pill}>{appEnv().toUpperCase()}</span>
        </div>
        {filters.ref && (
          <div>
            <span className={styles.label}>Object ID</span>
            <span className={styles.mono}>{shortId(filters.ref)}</span>
            <input type="hidden" name="ref" value={filters.ref} />
          </div>
        )}
        <div className={styles.actions} style={{ marginTop: 0 }}>
          <button type="submit" className={styles.btn}>Apply</button>
          <Link href="/admin/audit" className={`${styles.btn} ${styles.btnSecondary}`}>Clear</Link>
        </div>
      </form>

      <h2 className={styles.sectionTitle}>Audit events</h2>
      <div className={styles.card}>
        {result.rows.length === 0 ? (
          <p className={styles.empty}>No events match these filters.</p>
        ) : (
          <div className={styles.tableScroll} role="region" aria-label="Audit events, scrollable" tabIndex={0}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Timestamp</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Action</th>
                  <th scope="col">Object reference</th>
                  <th scope="col">Result</th>
                  <th scope="col" aria-label="Detail" />
                </tr>
              </thead>
              <tbody>
                {result.rows.map((e) => (
                  <tr key={e.id} aria-selected={selected?.id === e.id || undefined}>
                    <td>{formatDateTime(e.occurred_at)}</td>
                    <td>{e.actor_type} <span className={styles.mono}>{shortId(e.actor_id)}</span></td>
                    <td className={styles.mono}>{e.action}</td>
                    <td>{e.object_type ?? '—'} <span className={styles.mono}>{shortId(e.object_id)}</span></td>
                    <td>{e.result}</td>
                    <td><Link className={styles.link} href={href({ event: e.id })}>Detail</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.pagination}>
        <span>Page {result.page} of {result.totalPages} · {result.total.toLocaleString('en-GB')} events</span>
        <span className={styles.badges}>
          {result.page > 1 && <Link className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} href={href({ page: String(result.page - 1) })}>Previous</Link>}
          {result.page < result.totalPages && <Link className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} href={href({ page: String(result.page + 1) })}>Next</Link>}
        </span>
      </div>

      <h2 className={styles.sectionTitle}>Structured detail</h2>
      <div className={styles.card}>
        {selected ? (
          <>
            <div className={styles.kv}>
              <div className={styles.kvRow}><span className={styles.kvKey}>Event</span><span className={`${styles.kvValue} ${styles.mono}`}>{selected.id}</span></div>
              <div className={styles.kvRow}><span className={styles.kvKey}>Action</span><span className={`${styles.kvValue} ${styles.mono}`}>{selected.action}</span></div>
            </div>
            <pre className={styles.pre}>{JSON.stringify(redactDetails(selected.details), null, 2)}</pre>
            <p className={styles.noticeTitle} style={{ marginTop: 'var(--zd-space-2)' }}>Secrets / personal data: redacted</p>
          </>
        ) : (
          <p className={styles.muted}>Select an event to see its structured detail.</p>
        )}
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} disabled title="Audit export requires an approved export binding">
            Export (not configured)
          </button>
        </div>
      </div>
    </>
  );
}

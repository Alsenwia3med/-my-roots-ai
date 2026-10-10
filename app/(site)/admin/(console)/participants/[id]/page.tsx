// ADM-04 · Participant Detail (/admin/participants/[id]). Minimum necessary identity, lifecycle
// timeline, assessment completion and version, report status, request state and logged
// actions. Raw answers are shown only when role and purpose permit: no purpose-approval step
// exists yet, so they are withheld. Submitted answers are read-only; there is no edit action.

import { notFound } from 'next/navigation';
import styles from '../../../admin.module.css';
import { PageHead, PermissionDenied } from '../../../_components/PageHead';
import ResendLinkButton from '../../../_components/ResendLinkButton';
import { requireStaffPage } from '@/lib/admin/guard';
import { formatDateTime, getParticipantDetail, REPORT_LABELS, shortId, STATUS_LABELS } from '@/lib/admin/data';
import { UUID_PATTERN } from '@/lib/api/http';
import { audit } from '@/lib/audit';
import { hasAnyRole } from '@/lib/admin/roles';
import { latestDeletionRequest } from '@/lib/privacy/data';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import ConfirmAction from '../../../_components/ConfirmAction';

const DELETION_LABELS = { pending: 'Pending', completed: 'Completed', rejected: 'Rejected', cancelled: 'Withdrawn by participant' } as const;

export const dynamic = 'force-dynamic';

export default async function ParticipantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { ctx, allowed } = await requireStaffPage(['admin', 'super_admin']);
  if (!allowed) return <PermissionDenied />;

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const p = await getParticipantDetail(ctx.supabase, id);
  if (!p) notFound();

  // Viewing a participant record is a privileged read, and is logged.
  await audit({ action: 'admin.participant.viewed', result: 'success', actorType: 'admin', actorId: ctx.user.id, objectType: 'profile', objectId: id });

  const status = p.current ? STATUS_LABELS[p.current.status] : STATUS_LABELS.not_started;

  // Request state lives in server-only tables (service role), read after the role check above.
  const admin = getSupabaseAdmin();
  const [deletion, exportEvent] = await Promise.all([
    latestDeletionRequest(admin, id),
    admin.from('audit_logs').select('occurred_at').eq('action', 'privacy.data.exported').eq('actor_id', id).eq('result', 'success').order('occurred_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const lastExport = (exportEvent.data?.occurred_at as string | undefined) ?? null;
  const isSuper = hasAnyRole(ctx.roles, ['super_admin']);

  return (
    <>
      <PageHead title="Participant Detail" subtitle="Review participant lifecycle and authorized actions" access="Admin" />

      <h2 className={styles.sectionTitle}>Identity</h2>
      <div className={`${styles.card} ${styles.kv}`}>
        <div className={styles.kvRow}><span className={styles.kvKey}>Participant</span><span className={`${styles.kvValue} ${styles.mono}`}>{p.pseudonym}</span></div>
        <div className={styles.kvRow}><span className={styles.kvKey}>Email</span><span className={styles.kvValue}>{p.maskedEmail}</span></div>
        <div className={styles.kvRow}><span className={styles.kvKey}>Account</span><span className={styles.kvValue}>{p.accountStatus}</span></div>
        <p className={`${styles.muted} ${styles.small}`}>Minimum necessary profile and contact detail only.</p>
      </div>

      <h2 className={styles.sectionTitle}>Timeline</h2>
      <div className={styles.card}>
        <ol className={styles.timeline}>
          {p.timeline.map((t) => (
            <li key={t.label}>
              <span className={styles.kvKey}>{t.label}</span>
              <span className={t.at ? styles.kvValue : styles.muted}>{t.at ? formatDateTime(t.at) : 'Not yet'}</span>
            </li>
          ))}
        </ol>
      </div>

      <h2 className={styles.sectionTitle}>Assessment</h2>
      <div className={`${styles.card} ${styles.kv}`}>
        <div className={styles.kvRow}><span className={styles.kvKey}>Status</span><span className={styles.kvValue}>{status}</span></div>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Completion</span>
          <span className={styles.kvValue}>{p.current ? `${p.current.progress_percent}%` : '—'}</span>
        </div>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Questionnaire version</span>
          <span className={styles.kvValue}>{p.current ? `C-01 v${p.current.questionnaire_version}` : '—'}</span>
        </div>
        <div className={styles.kvRow}><span className={styles.kvKey}>Assessments on record</span><span className={styles.kvValue}>{p.assessmentCount}</span></div>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Raw answers</span>
          <span className={styles.muted}>Withheld — shown only when role and approved purpose permit.</span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Report</h2>
      <div className={`${styles.card} ${styles.kv}`}>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Status</span>
          <span className={styles.kvValue}>{REPORT_LABELS[(p.report?.status ?? 'none') as keyof typeof REPORT_LABELS]}</span>
        </div>
        <div className={styles.kvRow}><span className={styles.kvKey}>Version</span><span className={styles.kvValue}>{p.report?.report_version ?? '—'}</span></div>
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} disabled title="Available once reports are generated">
            Secure open
          </button>
          <ResendLinkButton participantId={p.id} pseudonym={p.pseudonym} />
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Requests</h2>
      <div className={`${styles.card} ${styles.kv}`}>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Deletion request</span>
          {!deletion.available ? (
            <span className={styles.muted}>Not available until the 20260922 migration is run</span>
          ) : deletion.request ? (
            <span className={styles.kvValue}>
              {DELETION_LABELS[deletion.request.status]} · requested {formatDateTime(deletion.request.requested_at)}
              {deletion.request.resolved_at ? ` · resolved ${formatDateTime(deletion.request.resolved_at)}` : ''}
            </span>
          ) : (
            <span className={styles.muted}>None recorded</span>
          )}
        </div>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Access request</span>
          {lastExport ? (
            <span className={styles.kvValue}>Self-service download · last {formatDateTime(lastExport)}</span>
          ) : (
            <span className={styles.muted}>None recorded</span>
          )}
        </div>
        {deletion.request?.status === 'pending' && (
          isSuper ? (
            <div className={styles.actions}>
              <ConfirmAction
                label="Erase account and data"
                title={`Erase ${p.pseudonym}?`}
                body="This permanently deletes the account, consents, assessments, answers, scores and reports. It cannot be undone. The audit history is kept. Requires a recent authenticator verification."
                endpoint={`/api/v1/admin/participants/${p.id}/deletion`}
                payload={{ decision: 'erase' }}
                requireReason
                danger
                confirmLabel="Erase permanently"
                successText="The account and its data have been erased."
                redirectTo="/admin/participants"
              />
              <ConfirmAction
                label="Reject request"
                title="Reject the deletion request?"
                body="Record why the request cannot be honoured (for example a legal retention duty). The participant's data is kept."
                endpoint={`/api/v1/admin/participants/${p.id}/deletion`}
                payload={{ decision: 'reject' }}
                requireReason
                confirmLabel="Reject request"
                successText="The request has been rejected."
              />
            </div>
          ) : (
            <p className={`${styles.muted} ${styles.small}`}>A Super Admin carries out deletion requests.</p>
          )
        )}
      </div>

      <h2 className={styles.sectionTitle}>Audit</h2>
      <div className={styles.card}>
        {p.logged.length === 0 ? (
          <p className={styles.muted}>No logged actions.</p>
        ) : (
          <div className={styles.tableScroll} role="region" aria-label="Logged actions, scrollable" tabIndex={0}>
            <table className={styles.table}>
              <thead>
                <tr><th scope="col">When</th><th scope="col">Action</th><th scope="col">Actor</th><th scope="col">Result</th></tr>
              </thead>
              <tbody>
                {p.logged.map((e) => (
                  <tr key={e.id}>
                    <td>{formatDateTime(e.occurred_at)}</td>
                    <td className={styles.mono}>{e.action}</td>
                    <td>{e.actor_type} {e.actor_type === 'admin' ? <span className={styles.mono}>{shortId(e.actor_id)}</span> : null}</td>
                    <td>{e.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className={`${styles.muted} ${styles.small}`} style={{ marginTop: 'var(--zd-space-3)' }}>
          Submitted answers are read-only; there is no edit action.
        </p>
      </div>

      <div className={styles.notice}>
        <span className={styles.noticeTitle}>Authorization boundary</span>
        Every privileged write requires confirmation and an audit event; reason where stated.
      </div>
    </>
  );
}

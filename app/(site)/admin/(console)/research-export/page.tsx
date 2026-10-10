// ADM-09 · Research Export (/admin/research-export). Research Admin. Create an approved,
// de-identified export in six steps: purpose reference, approved cohort criteria, allow-listed
// field preview, risk check, generate (encrypted · expiring · audited), and export history.
// No direct identifiers and no unrestricted database export: the fields, the consent criterion
// and the minimum cohort size are fixed in lib/research.

import Link from 'next/link';
import styles from '../../admin.module.css';
import ConfirmAction from '../../_components/ConfirmAction';
import { PageHead, PermissionDenied } from '../../_components/PageHead';
import { requireStaffPage } from '@/lib/admin/guard';
import { formatDateTime, maskEmail } from '@/lib/admin/format';
import { CONSENT_CRITERION, purgeExpired, selectCohort } from '@/lib/research/export';
import { EXPORT_FIELDS, EXPORT_TTL_HOURS, MIN_CELL_SIZE, normalizeFields, riskCheck } from '@/lib/research/fields';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type Search = { purpose?: string; qv?: string; from?: string; to?: string; f?: string | string[]; preview?: string };

const isDate = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export default async function ResearchExportPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { ctx, allowed } = await requireStaffPage(['research_admin']);
  if (!allowed) return <PermissionDenied />;

  const sp = await searchParams;
  const admin = getSupabaseAdmin();
  await purgeExpired(admin);

  const { data: versionRows } = await admin.from('assessments').select('questionnaire_version').eq('status', 'submitted');
  const versions = [...new Set((versionRows ?? []).map((r) => r.questionnaire_version as string))].sort();

  const purpose = sp.purpose?.trim().slice(0, 200) ?? '';
  const qv = sp.qv && versions.includes(sp.qv) ? sp.qv : undefined;
  const from = isDate(sp.from);
  const to = isDate(sp.to);
  const fields = normalizeFields(sp.preview ? [sp.f ?? []].flat() : undefined);
  const previewing = sp.preview === '1' && purpose.length >= 3;

  const cohortSize = previewing ? (await selectCohort(admin, { questionnaireVersion: qv, from, to })).length : null;
  const risk = cohortSize === null ? null : riskCheck(cohortSize, fields);

  const { data: history } = await admin
    .from('research_exports')
    .select('id, requested_by, purpose_reference, row_count, checksum, payload, expires_at, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  const requesterIds = [...new Set((history ?? []).map((h) => h.requested_by as string))];
  const { data: requesters } = requesterIds.length ? await admin.from('profiles').select('id, email').in('id', requesterIds) : { data: [] };
  const requesterEmail = new Map((requesters ?? []).map((p) => [p.id as string, p.email as string | null]));

  return (
    <>
      <PageHead title="Research Export" subtitle="Create approved de-identified export" access="Research Admin" />

      <form method="get" action="/admin/research-export">
        <input type="hidden" name="preview" value="1" />

        <h2 className={styles.sectionTitle}>1. Purpose</h2>
        <div className={styles.card}>
          <label className={styles.label} htmlFor="x-purpose">Required project / purpose reference</label>
          <input id="x-purpose" name="purpose" className={styles.input} required minLength={3} maxLength={200} defaultValue={purpose} placeholder="e.g. ethics approval or project reference" />
          {sp.preview === '1' && purpose.length < 3 && <p className={styles.error} role="alert">Enter the approved project or purpose reference.</p>}
        </div>

        <h2 className={styles.sectionTitle}>2. Approved cohort criteria</h2>
        <div className={`${styles.card} ${styles.filters}`}>
          <div>
            <label className={styles.label} htmlFor="x-qv">Cohort (questionnaire version)</label>
            <select id="x-qv" name="qv" className={styles.input} defaultValue={qv ?? ''}>
              <option value="">All submitted assessments</option>
              {versions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="x-from">Submitted from</label>
            <input id="x-from" type="date" name="from" className={styles.input} defaultValue={from ?? ''} />
          </div>
          <div>
            <label className={styles.label} htmlFor="x-to">Submitted to</label>
            <input id="x-to" type="date" name="to" className={styles.input} defaultValue={to ?? ''} />
          </div>
          <div>
            <span className={styles.label}>Consent</span>
            <span className={styles.pill}>{CONSENT_CRITERION}</span>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>3. Field preview</h2>
        <div className={styles.card}>
          <p className={styles.label}>Allow-listed only · Direct identifiers excluded</p>
          <div className={styles.filters}>
            {EXPORT_FIELDS.map((f) => (
              <label key={f.key} className={styles.small} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  name="f"
                  value={f.key}
                  defaultChecked={fields.includes(f.key)}
                  disabled={'required' in f && f.required}
                />
                {f.label}
              </label>
            ))}
          </div>
          <p className={`${styles.muted} ${styles.small}`}>
            No email, name, account ID, IP address, free text or individual answers can be exported. Dates are reduced to the month.
          </p>
          <div className={styles.actions}>
            <button type="submit" className={styles.btn}>Run risk check</button>
            <Link href="/admin/research-export" className={`${styles.btn} ${styles.btnSecondary}`}>Clear</Link>
          </div>
        </div>
      </form>

      <h2 className={styles.sectionTitle}>4. Risk check</h2>
      <div className={styles.card}>
        {!risk ? (
          <p className={styles.empty}>Enter a purpose and run the risk check.</p>
        ) : (
          <div className={styles.kv}>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Cell-size validation</span>
              <span className={`${styles.kvValue} ${risk.cellSize.ok ? styles.success : styles.error}`}>
                {risk.cellSize.ok ? 'Pass' : 'Fail'} — {risk.cellSize.rows} participant{risk.cellSize.rows === 1 ? '' : 's'} (minimum {MIN_CELL_SIZE})
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Direct-identifier validation</span>
              <span className={`${styles.kvValue} ${risk.directIdentifiers.ok ? styles.success : styles.error}`}>
                {risk.directIdentifiers.ok ? 'Pass — allow-listed pseudonymised fields only' : `Fail — ${risk.directIdentifiers.rejected.join(', ') || 'no fields selected'}`}
              </span>
            </div>
          </div>
        )}
        <p className={`${styles.muted} ${styles.small}`}>Generation blocked unless risk checks pass.</p>
      </div>

      <h2 className={styles.sectionTitle}>5. Generate</h2>
      <div className={styles.card}>
        <p className={styles.label}>Encrypted · Expiring · Audited</p>
        <p className={styles.small}>
          The file is stored encrypted, can be downloaded only by you, and is destroyed {EXPORT_TTL_HOURS} hours after generation.
        </p>
        {risk?.ok ? (
          <div className={styles.actions}>
            <ConfirmAction
              label="Generate export"
              title="Generate research export?"
              body={`${cohortSize} consented participants, ${fields.length} fields, for "${purpose}". This action requires a recent authenticator verification and is recorded in the audit log.`}
              endpoint="/api/v1/admin/research-export"
              payload={{ purpose, questionnaireVersion: qv, from, to, fields }}
              confirmLabel="Generate"
              successText="Export generated. Download it from the export history below."
            />
          </div>
        ) : (
          <p className={styles.muted}>Available once the risk checks pass.</p>
        )}
      </div>

      <h2 className={styles.sectionTitle}>6. Export history</h2>
      <div className={styles.card}>
        {!history?.length ? (
          <p className={styles.empty}>No exports yet.</p>
        ) : (
          <div className={styles.tableScroll} role="region" aria-label="Export history, scrollable" tabIndex={0}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Requester</th>
                  <th scope="col">Purpose</th>
                  <th scope="col">Rows</th>
                  <th scope="col">Checksum</th>
                  <th scope="col">Expiry</th>
                  <th scope="col">Audit event</th>
                  <th scope="col" aria-label="Download" />
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const live = h.payload !== null && Date.parse(h.expires_at as string) > Date.now();
                  const mine = h.requested_by === ctx.user.id;
                  return (
                    <tr key={h.id as string}>
                      <td>{maskEmail(requesterEmail.get(h.requested_by as string) ?? null)}</td>
                      <td>{h.purpose_reference as string}</td>
                      <td>{h.row_count as number}</td>
                      <td className={styles.mono} title={h.checksum as string}>{(h.checksum as string).slice(0, 12)}…</td>
                      <td>{live ? formatDateTime(h.expires_at as string) : 'Expired · destroyed'}</td>
                      <td className={`${styles.mono} ${styles.small}`}>research.export.generated<br />{(h.id as string).slice(0, 8)}</td>
                      <td>
                        {live && mine ? (
                          <a className={styles.link} href={`/api/v1/admin/research-export/${h.id as string}/download`}>Download</a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

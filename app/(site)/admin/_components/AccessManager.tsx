'use client';

/**
 * ADM-10 actions: grant, revoke and MFA reset. Each opens a confirmation with a required
 * reason; the server additionally demands an authenticator verification from the last
 * 15 minutes and returns MFA_REAUTH_REQUIRED otherwise.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import styles from '../admin.module.css';
import { ROLE_LABELS, STAFF_ROLES, type StaffRole } from '@/lib/admin/roles';

export interface StaffPerson {
  profileId: string;
  email: string;
  mfa: boolean;
  lastAccess: string;
  active: boolean;
  grants: { id: string; role: StaffRole; grantedAt: string; revokedAt: string | null; expiresAt: string | null; expired: boolean }[];
}

type Pending =
  | { action: 'grant'; email: string; role: StaffRole; expiresOn?: string; permanent?: boolean }
  | { action: 'revoke'; assignmentId: string; label: string }
  | { action: 'reset_mfa'; profileId: string; label: string };

export default function AccessManager({ people, selfId }: { people: StaffPerson[]; selfId: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('admin');
  // ADM-10: time-limited by default ("no permanent default"); 30 days unless changed.
  const [expiresOn, setExpiresOn] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [permanent, setPermanent] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; reauth?: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function open(p: Pending) {
    setPending(p);
    setReason('');
    setError(null);
    dialog.current?.showModal();
  }

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...pending, reason }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ text: body?.error?.message ?? 'The change could not be made.', reauth: body?.error?.code === 'MFA_REAUTH_REQUIRED' });
        return;
      }
      dialog.current?.close();
      setNotice(
        pending.action === 'grant' ? 'Access granted.' : pending.action === 'revoke' ? 'Access revoked.' : 'Authenticator reset. They will set up a new one at their next sign-in.',
      );
      if (pending.action === 'grant') setEmail('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const title = !pending
    ? ''
    : pending.action === 'grant'
      ? `Grant ${ROLE_LABELS[pending.role]} to ${pending.email} ${pending.permanent ? 'until revoked' : `until ${pending.expiresOn}`}?`
      : pending.action === 'revoke'
        ? `Revoke ${pending.label}?`
        : `Reset the authenticator for ${pending.label}?`;

  return (
    <>
      <h2 className={styles.sectionTitle}>Invite</h2>
      <form
        className={`${styles.card} ${styles.filters}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (email.includes('@')) open({ action: 'grant', email: email.trim().toLowerCase(), role, ...(permanent ? { permanent: true } : { expiresOn }) });
        }}
      >
        <div>
          <label className={styles.label} htmlFor="g-email">Named account email</label>
          <input id="g-email" type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className={styles.label} htmlFor="g-role">Role</label>
          <select id="g-role" className={styles.input} value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={styles.label} htmlFor="g-expiry">Access expires</label>
          <input
            id="g-expiry"
            type="date"
            className={styles.input}
            value={expiresOn}
            min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
            onChange={(e) => setExpiresOn(e.target.value)}
            disabled={permanent}
            required={!permanent}
          />
          <label className={styles.small} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input type="checkbox" checked={permanent} onChange={(e) => setPermanent(e.target.checked)} />
            Until revoked (no expiry)
          </label>
        </div>
        <div className={styles.actions} style={{ marginTop: 0 }}>
          <button type="submit" className={styles.btn}>Grant access</button>
        </div>
        <p className={`${styles.muted} ${styles.small}`} style={{ gridColumn: '1 / -1' }}>
          The person signs in at /admin with the Google account for this email, then sets up their authenticator.
        </p>
      </form>

      {notice && <p className={styles.success} role="status">{notice}</p>}

      <h2 className={styles.sectionTitle}>Users</h2>
      <div className={styles.card}>
        {people.length === 0 ? (
          <p className={styles.empty}>No privileged users.</p>
        ) : (
          <div className={styles.tableScroll} role="region" aria-label="Privileged users, scrollable" tabIndex={0}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Roles</th>
                  <th scope="col">MFA</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last access</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => {
                  const active = p.grants.filter((g) => !g.revokedAt && !g.expired);
                  const expired = p.grants.filter((g) => g.expired);
                  return (
                    <tr key={p.profileId}>
                      <td>{p.email}{p.profileId === selfId ? <span className={styles.muted}> (you)</span> : null}</td>
                      <td>
                        {active.length ? (
                          active.map((g) => (
                            <div key={g.id}>
                              {ROLE_LABELS[g.role]}
                              <span className={`${styles.muted} ${styles.small}`}>{g.expiresAt ? ` · expires ${g.expiresAt}` : ' · until revoked'}</span>
                            </div>
                          ))
                        ) : (
                          <span className={styles.muted}>None</span>
                        )}
                        {expired.map((g) => (
                          <div key={g.id} className={`${styles.muted} ${styles.small}`}>{ROLE_LABELS[g.role]} expired {g.expiresAt}</div>
                        ))}
                      </td>
                      <td>{p.mfa ? 'Enrolled' : <span className={styles.muted}>Not set up</span>}</td>
                      <td>{p.active ? 'Active' : <span className={styles.muted}>{expired.length ? 'Expired' : 'Revoked'}</span>}</td>
                      <td>{p.lastAccess}</td>
                      <td>
                        <div className={styles.badges}>
                          {active.map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                              onClick={() => open({ action: 'revoke', assignmentId: g.id, label: `${ROLE_LABELS[g.role]} from ${p.email}` })}
                            >
                              Revoke {ROLE_LABELS[g.role]}
                            </button>
                          ))}
                          {p.mfa && p.profileId !== selfId && (
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                              onClick={() => open({ action: 'reset_mfa', profileId: p.profileId, label: p.email })}
                            >
                              Reset MFA
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <dialog ref={dialog} className={styles.dialog} aria-labelledby="access-title">
        <h2 id="access-title" className={styles.sectionTitle} style={{ marginTop: 0 }}>{title}</h2>
        <label className={styles.label} htmlFor="access-reason">Reason (required)</label>
        <textarea
          id="access-reason"
          className={styles.input}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          aria-describedby="access-reason-hint"
        />
        <p id="access-reason-hint" className={`${styles.muted} ${styles.small}`}>
          At least 10 characters. Recorded in the audit log — do not include personal or health information.
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error.text}{' '}
            {error.reauth && (
              <Link className={styles.link} href="/admin?reauth=1&next=/admin/access">Verify now</Link>
            )}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={confirm} disabled={busy || reason.trim().length < 10}>
            {busy ? 'Saving…' : 'Confirm'}
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => dialog.current?.close()}>
            Cancel
          </button>
        </div>
      </dialog>
    </>
  );
}

'use client';

/**
 * A privileged admin write behind the shared admin contract: confirmation dialog, an optional
 * required reason, MFA re-authentication when the server asks for it, and a refresh of the
 * screen afterwards so the result is visible. The server audits every attempt.
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import styles from '../admin.module.css';

interface Props {
  label: string;
  title: string;
  body: string;
  endpoint: string;
  confirmLabel: string;
  successText: string;
  /** Extra JSON fields sent with the request. */
  payload?: Record<string, unknown>;
  /** Ask for a reason of at least 10 characters and send it as { reason }. */
  requireReason?: boolean;
  danger?: boolean;
  compact?: boolean;
  /** Go here after success (e.g. when the record no longer exists), instead of refreshing. */
  redirectTo?: string;
}

export default function ConfirmAction({ label, title, body, endpoint, confirmLabel, successText, payload, requireReason, danger, compact, redirectTo }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string; reauth?: boolean } | null>(null);

  async function run() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, ...(requireReason ? { reason } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ ok: true, text: successText });
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } else {
        setMessage({ ok: false, text: data?.error?.message ?? 'The action could not be completed.', reauth: data?.error?.code === 'MFA_REAUTH_REQUIRED' });
      }
    } catch {
      setMessage({ ok: false, text: 'The action could not be completed.' });
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = !busy && (!requireReason || reason.trim().length >= 10);

  return (
    <>
      <button
        type="button"
        className={compact ? styles.link : `${styles.btn} ${danger ? styles.btnDanger : styles.btnSecondary}`}
        style={compact ? { background: 'none', border: 0, padding: 0, font: 'inherit', cursor: 'pointer' } : undefined}
        onClick={() => {
          setMessage(null);
          dialog.current?.showModal();
        }}
      >
        {label}
      </button>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`}>
        <h2 id={`${id}-title`} className={styles.sectionTitle} style={{ marginTop: 0 }}>
          {title}
        </h2>
        <p>{body}</p>
        {requireReason && !message?.ok && (
          <>
            <label className={styles.label} htmlFor={`${id}-reason`}>Reason (required)</label>
            <textarea
              id={`${id}-reason`}
              className={styles.input}
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </>
        )}
        {message && (
          <p className={message.ok ? styles.success : styles.error} role="status">
            {message.text}{' '}
            {message.reauth && (
              <Link className={styles.link} href={`/admin?reauth=1&next=${encodeURIComponent(pathname)}`}>Verify now</Link>
            )}
          </p>
        )}
        <div className={styles.actions}>
          {!message?.ok && (
            <button type="button" className={`${styles.btn} ${danger ? styles.btnDanger : ''}`} onClick={run} disabled={!canSubmit}>
              {busy ? 'Working…' : confirmLabel}
            </button>
          )}
          <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => dialog.current?.close()}>
            {message?.ok ? 'Close' : 'Cancel'}
          </button>
        </div>
      </dialog>
    </>
  );
}

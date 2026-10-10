'use client';

/** "Resend link" with the confirmation every privileged action requires (shared admin contract). */

import { useRef, useState } from 'react';
import styles from '../admin.module.css';

export default function ResendLinkButton({ participantId, pseudonym, compact }: { participantId: string; pseudonym: string; compact?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/participants/${participantId}/resend-link`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      setMessage(res.ok ? { ok: true, text: 'A new secure link has been sent.' } : { ok: false, text: body?.error?.message ?? 'The link could not be sent.' });
    } catch {
      setMessage({ ok: false, text: 'The link could not be sent.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={compact ? styles.link : `${styles.btn} ${styles.btnSecondary}`}
        style={compact ? { background: 'none', border: 0, padding: 0, font: 'inherit', cursor: 'pointer' } : undefined}
        onClick={() => {
          setMessage(null);
          dialog.current?.showModal();
        }}
      >
        Resend link
      </button>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby={`resend-${participantId}`}>
        <h2 id={`resend-${participantId}`} className={styles.sectionTitle} style={{ marginTop: 0 }}>
          Resend secure link?
        </h2>
        <p>
          {pseudonym} will be emailed a new one-time secure link. This action is recorded in the audit log.
        </p>
        {message && (
          <p className={message.ok ? styles.success : styles.error} role="status">
            {message.text}
          </p>
        )}
        <div className={styles.actions}>
          {!message?.ok && (
            <button type="button" className={styles.btn} onClick={send} disabled={busy}>
              {busy ? 'Sending…' : 'Send link'}
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

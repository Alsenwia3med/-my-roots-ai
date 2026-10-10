'use client';

/** Request (with confirmation) or withdraw an account-deletion request. */

import { useState } from 'react';
import styles from '../../report/report.module.css';

type State = { status: 'pending' | 'completed' | 'rejected' | 'cancelled'; requestedAt: string } | null;

// UTC, like every other date in the product: without it the request date is read in the
// browser's zone and can show the day before the one recorded. Review point 34.
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { dateStyle: 'long', timeZone: 'UTC' });

export default function DeletionPanel({ initial }: { initial: State }) {
  const [state, setState] = useState<State>(initial);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(action: 'request' | 'cancel') {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/me/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message ?? 'Your request could not be recorded. Please try again.');
        return;
      }
      setState(action === 'request' ? { status: 'pending', requestedAt: body.requested_at ?? new Date().toISOString() } : null);
      setConfirming(false);
    } catch {
      setError('Your request could not be recorded. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (state?.status === 'pending') {
    return (
      <div role="status">
        <p className={styles.para}>
          <strong>Deletion requested on {formatDate(state.requestedAt)}.</strong> Our team will carry it out and you will no
          longer be able to sign in once it is done. You can withdraw the request until then.
        </p>
        {error && <p className={styles.para} role="alert">{error}</p>}
        <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => send('cancel')} disabled={busy}>
          {busy ? 'Working…' : 'Withdraw request'}
        </button>
      </div>
    );
  }

  return (
    <div>
      {state?.status === 'rejected' && (
        <p className={styles.para}>Your previous request could not be completed. Please contact us if you have questions.</p>
      )}
      {error && <p className={styles.para} role="alert">{error}</p>}
      {confirming ? (
        <div role="group" aria-label="Confirm deletion request">
          <p className={styles.para}>
            <strong>Are you sure?</strong> Once carried out, your account and all your data are permanently deleted.
          </p>
          <div className={styles.historyRow} style={{ justifyContent: 'flex-start' }}>
            <button type="button" className={styles.btn} onClick={() => send('request')} disabled={busy}>
              {busy ? 'Sending…' : 'Yes, request deletion'}
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setConfirming(true)}>
          Request deletion
        </button>
      )}
    </div>
  );
}

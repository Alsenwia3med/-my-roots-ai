'use client';

// ASM-08 zone 5: restart requires explicit destructive confirmation (C-05 §12 Destructive actions).

import { useRef, useState } from 'react';
import styles from '../assessment.module.css';
import { apiFetch, ApiRequestError } from './api';
import { PENDING } from '@/lib/assessment/copy';

export default function RestartButton({ assessmentId }: { assessmentId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function restart() {
    setPending(true);
    setError(false);
    try {
      await apiFetch(`/api/v1/assessments/${assessmentId}/archive`, { method: 'POST', body: JSON.stringify({ confirm: true }) });
      const { assessment } = await apiFetch<{ assessment: { id: string } }>('/api/v1/assessments', { method: 'POST' });
      window.location.assign(`/assessment/${assessment.id}/module/1`);
    } catch (e) {
      if (e instanceof ApiRequestError && e.status === 401) {
        window.location.assign('/assessment?session=expired');
        return;
      }
      setError(true);
      setPending(false);
    }
  }

  return (
    <>
      <button className={styles.btnSecondary} type="button" onClick={() => dialog.current?.showModal()}>
        {PENDING.restart}
      </button>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="restart-title">
        <h2 id="restart-title" className={styles.dialogTitle}>
          {PENDING.restartConfirmTitle}
        </h2>
        <p className={styles.body}>{PENDING.restartConfirmBody}</p>
        {error && (
          <p className={styles.error} role="alert">
            {PENDING.startFailed}
          </p>
        )}
        <div className={styles.actions}>
          <button className={styles.btnDanger} type="button" onClick={restart} disabled={pending}>
            {PENDING.restartConfirm}
          </button>
          <button className={styles.btnSecondary} type="button" onClick={() => dialog.current?.close()} disabled={pending}>
            {PENDING.cancel}
          </button>
        </div>
      </dialog>
    </>
  );
}

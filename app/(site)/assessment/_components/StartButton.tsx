'use client';

import { useState } from 'react';
import styles from '../assessment.module.css';
import { apiFetch, ApiRequestError } from './api';
import { LABELS, PENDING } from '@/lib/assessment/copy';

export default function StartButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      const { assessment } = await apiFetch<{ assessment: { id: string } }>('/api/v1/assessments', { method: 'POST' });
      window.location.assign(`/assessment/${assessment.id}/module/1`);
    } catch (e) {
      if (e instanceof ApiRequestError && e.status === 401) {
        window.location.assign('/assessment?session=expired');
        return;
      }
      setError(PENDING.startFailed);
      setPending(false);
    }
  }

  return (
    <>
      <button className={styles.btn} type="button" onClick={start} disabled={pending}>
        {LABELS.startModule1}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
}

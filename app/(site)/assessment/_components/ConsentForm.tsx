'use client';

import Link from 'next/link';
import { useId, useState, type FormEvent } from 'react';
import styles from '../assessment.module.css';
import { apiFetch, ApiRequestError, signOut } from './api';
import { LABELS, PENDING, SYSTEM } from '@/lib/assessment/copy';

export default function ConsentForm() {
  const id = useId();
  const [service, setService] = useState(false);
  const [research, setResearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service) {
      setError(PENDING.consentRequired);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await apiFetch('/api/v1/consents', { method: 'POST', body: JSON.stringify({ service: true, research }) });
      window.location.assign('/assessment/start');
    } catch (e) {
      if (e instanceof ApiRequestError && e.status === 401) {
        window.location.assign('/assessment?session=expired');
        return;
      }
      setError(PENDING.consentSaveFailed);
      setPending(false);
    }
  }

  async function decline() {
    await signOut();
    window.location.assign('/');
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={service}
            onChange={(e) => {
              setService(e.target.checked);
              setError(null);
            }}
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          <span>{SYSTEM.consentService}</span>
        </label>
        <p className={styles.help}>
          <Link className={styles.link} href="/terms">Terms of Service</Link> ·{' '}
          <Link className={styles.link} href="/privacy">Privacy Notice</Link> ·{' '}
          <Link className={styles.link} href="/medical-disclaimer">Medical Disclaimer</Link> ·{' '}
          <Link className={styles.link} href="/ai-disclaimer">AI Disclaimer</Link>
        </p>
      </div>

      <label className={styles.check}>
        <input type="checkbox" checked={research} onChange={(e) => setResearch(e.target.checked)} />
        <span>{SYSTEM.consentResearch}</span>
      </label>

      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button className={styles.btn} type="submit" disabled={pending}>
          {LABELS.agreeAndContinue}
        </button>
        <button className={styles.btnSecondary} type="button" onClick={decline} disabled={pending}>
          {PENDING.decline}
        </button>
      </div>
    </form>
  );
}

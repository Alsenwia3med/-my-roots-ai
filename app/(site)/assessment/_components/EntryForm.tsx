'use client';

// ASM-01 zones 3-5: email, launch eligibility acknowledgement (C-01 VAL-010), secure-link request.

import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import styles from '../assessment.module.css';
import { storePendingEmail } from './pendingEmail';
import { apiFetch, ApiRequestError } from './api';
import { ASSESSMENT_ENTRY, PENDING } from '@/lib/assessment/copy';
import { VAL } from '@/lib/assessment/validation';


export default function EntryForm({ initialEmail = '' }: { initialEmail?: string }) {
  const router = useRouter();
  const id = useId();
  const [email, setEmail] = useState(initialEmail);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!ageConfirmed) {
      setAgeError(true);
      return;
    }
    setSending(true);
    try {
      const result = await apiFetch<{ status: string; demoLink?: string }>('/api/v1/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email, ageConfirmed }),
      });
      if (result.demoLink) {
        window.location.assign(result.demoLink);
        return;
      }
      // Kept for the resend action on ASM-02 only, never placed in the URL (C-05 §12), and
      // cleared the moment the participant signs in — see ./pendingEmail.ts.
      storePendingEmail(email);
      router.push('/assessment/check-email');
    } catch (e) {
      setError(e instanceof ApiRequestError && e.status !== 0 && e.status < 500 ? e.message : PENDING.requestFailed);
      setSending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div>
        <label className={styles.label} htmlFor={`${id}-email`}>
          {PENDING.emailLabel}
        </label>
        <input
          id={`${id}-email`}
          className={styles.input}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby={`${id}-email-help${error ? ` ${id}-error` : ''}`}
          aria-invalid={error ? true : undefined}
        />
        <p id={`${id}-email-help`} className={styles.help}>
          {PENDING.emailPrivacyNote}
        </p>
      </div>

      <div>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => {
              setAgeConfirmed(e.target.checked);
              setAgeError(false);
            }}
            aria-describedby={ageError ? `${id}-age-error` : undefined}
            aria-invalid={ageError || undefined}
            required
          />
          <span>{PENDING.ageAcknowledgement}</span>
        </label>
        {ageError && (
          <p id={`${id}-age-error`} className={styles.error} role="alert">
            {VAL['VAL-010']}
          </p>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div>
        <button className={styles.btn} type="submit" disabled={sending}>
          {sending ? PENDING.sendingLink : ASSESSMENT_ENTRY.cta}
        </button>
      </div>
    </form>
  );
}


'use client';

// ASM-09 zone 5: Submit Assessment (idempotent; repeated submit disabled while pending) and
// Back to Answers (C-05 §12 Submission).

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '../assessment.module.css';
import { apiFetch, ApiRequestError } from './api';
import { LABELS, PENDING } from '@/lib/assessment/copy';
import { VAL } from '@/lib/assessment/validation';
import { DISPLAY_NAME_MAX, normalizeDisplayName } from '@/lib/profile/displayName';

export default function SubmitPanel({
  assessmentId,
  complete,
  initialName,
}: {
  assessmentId: string;
  complete: boolean;
  initialName: string | null;
}) {
  const [key, setKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialName ?? '');
  const [nameError, setNameError] = useState<string | null>(null);

  // The same key is reused for retries of this submission, so a retry cannot create a second one.
  useEffect(() => {
    const storageKey = `roots-submit-key-${assessmentId}`;
    let value = sessionStorage.getItem(storageKey);
    if (!value) {
      value = crypto.randomUUID();
      sessionStorage.setItem(storageKey, value);
    }
    setKey(value);
  }, [assessmentId]);

  async function submit() {
    if (!key) return;
    setError(null);

    // The name goes on the report cover, which is written at submission — so save it first.
    const normalized = normalizeDisplayName(name);
    if (!normalized.ok) {
      setNameError(PENDING.reportNameInvalid);
      return;
    }
    setNameError(null);
    setPending(true);
    if (normalized.value !== (initialName ?? null)) {
      try {
        await apiFetch('/api/v1/profile', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ display_name: normalized.value }),
        });
      } catch (e) {
        if (e instanceof ApiRequestError && e.status === 401) return window.location.assign('/assessment?session=expired');
        setNameError(e instanceof ApiRequestError && e.status === 400 ? PENDING.reportNameInvalid : PENDING.reportNameSaveFailed);
        setPending(false);
        return;
      }
    }

    try {
      await apiFetch(`/api/v1/assessments/${assessmentId}/submit`, { method: 'POST', headers: { 'Idempotency-Key': key } });
      window.location.assign(`/assessment/${assessmentId}/submitted`);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (e.status === 401) return window.location.assign('/assessment?session=expired');
        if (e.status === 409) return window.location.assign(`/assessment/${assessmentId}/submitted`);
        if (e.status === 422) {
          setError(VAL['VAL-009']);
          setPending(false);
          window.location.reload();
          return;
        }
      }
      setError(PENDING.submitFailed);
      setPending(false);
    }
  }

  return (
    <>
      {!complete && (
        <p className={`${styles.banner} ${styles.bannerError}`} role="alert">
          {VAL['VAL-009']}
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.question} style={{ marginTop: 'var(--zd-space-6)' }}>
        <label className={styles.legend} htmlFor="report-name">
          {PENDING.reportNameLabel}
        </label>
        <p id="report-name-hint" className={styles.help}>
          {PENDING.reportNameHint}
        </p>
        <input
          id="report-name"
          className={styles.input}
          value={name}
          maxLength={DISPLAY_NAME_MAX}
          autoComplete="name"
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? 'report-name-hint report-name-error' : 'report-name-hint'}
        />
        {nameError && (
          <p id="report-name-error" className={styles.error} role="alert">
            {nameError}
          </p>
        )}
      </div>
      <div className={styles.actions}>
        <button className={styles.btn} type="button" onClick={submit} disabled={!complete || pending || !key}>
          {pending ? PENDING.submitting : LABELS.submitAssessment}
        </button>
        <Link className={styles.btnSecondary} href={`/assessment/${assessmentId}/module/1`}>
          {LABELS.backToAnswers}
        </Link>
      </div>
    </>
  );
}

'use client';

/**
 * ADM-01 multi-factor step: first-time authenticator setup ("enroll") or the required
 * 6-digit challenge ("challenge"). A failure is announced to assistive technology.
 */

import { useRef, useState } from 'react';
import styles from '../admin.module.css';

interface Props {
  mode: 'enroll' | 'challenge';
  factorId?: string;
  /** Where to go once verified. */
  next: string;
}

interface Enrolment {
  factorId: string;
  qrCode: string;
  secret: string;
}

export default function MfaStep({ mode, factorId, next }: Props) {
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  async function startEnrolment() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/mfa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'enroll' }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? 'The service is temporarily unavailable. Please try again.');
      setEnrolment(body as Enrolment);
      setTimeout(() => codeRef.current?.focus(), 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The service is temporarily unavailable. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    const id = mode === 'enroll' ? enrolment?.factorId : factorId;
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/mfa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'verify', factorId: id, code }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? 'That code did not match. Please try again.');
      window.location.assign(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That code did not match. Please try again.');
      setCode('');
      codeRef.current?.focus();
      setBusy(false);
    }
  }

  const codeForm = (
    <form onSubmit={verify} noValidate>
      <label className={styles.label} htmlFor="mfa-code">
        6-digit code from your authenticator app
      </label>
      <input
        ref={codeRef}
        id="mfa-code"
        className={styles.codeInput}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'mfa-error' : undefined}
        required
      />
      <div className={styles.actions}>
        <button type="submit" className={`${styles.btn} ${styles.btnBlock}`} disabled={busy || code.length !== 6}>
          {busy ? 'Verifying…' : 'Verify'}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <h2 className={styles.stepTitle}>Multi-factor authentication</h2>

      {mode === 'challenge' && (
        <>
          <p className={`${styles.muted} ${styles.small}`}>Required challenge. Enter the current code from your authenticator app.</p>
          <div style={{ marginTop: 'var(--zd-space-3)' }}>{codeForm}</div>
        </>
      )}

      {mode === 'enroll' && !enrolment && (
        <>
          <p className={`${styles.muted} ${styles.small}`}>
            Administrator access requires an authenticator app, such as Google Authenticator or Microsoft Authenticator.
            Set one up once; you will then enter its code each time you sign in.
          </p>
          <div className={styles.actions}>
            <button type="button" className={`${styles.btn} ${styles.btnBlock}`} onClick={startEnrolment} disabled={busy}>
              {busy ? 'Preparing…' : 'Set up authenticator'}
            </button>
          </div>
        </>
      )}

      {mode === 'enroll' && enrolment && (
        <>
          <p className={`${styles.muted} ${styles.small}`}>Scan this code with your authenticator app, then enter the 6-digit code it shows.</p>
          {/* Supabase returns the QR code as an SVG data URI. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.qr} src={enrolment.qrCode} alt="QR code for adding ROOTS-AI administrator access to an authenticator app" />
          <p className={`${styles.muted} ${styles.small}`}>Cannot scan? Enter this setup key instead:</p>
          <p className={styles.secret}>{enrolment.secret}</p>
          <div style={{ marginTop: 'var(--zd-space-4)' }}>{codeForm}</div>
        </>
      )}

      {error && (
        <p id="mfa-error" className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

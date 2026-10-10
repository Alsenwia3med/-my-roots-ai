'use client';

// ASM-02 zones 3-4: rate-limited resend after a timer, and a safe way to change the email.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '../assessment.module.css';
import { apiFetch, ApiRequestError } from './api';
import { clearPendingEmail, readPendingEmail } from './pendingEmail';
import { fill, PENDING } from '@/lib/assessment/copy';

const RESEND_AFTER_SECONDS = 60;

export default function CheckEmail() {
  const [email, setEmail] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(RESEND_AFTER_SECONDS);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => setEmail(readPendingEmail()), []);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  async function resend() {
    if (!email) return;
    setSending(true);
    setMessage(null);
    try {
      await apiFetch('/api/v1/auth/magic-link', { method: 'POST', body: JSON.stringify({ email, ageConfirmed: true }) });
      setMessage(PENDING.checkEmailBody);
      setSeconds(RESEND_AFTER_SECONDS);
    } catch (e) {
      setMessage(e instanceof ApiRequestError && e.status === 429 ? e.message : PENDING.requestFailed);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className={styles.actions}>
        {email && (
          <button className={styles.btn} type="button" onClick={resend} disabled={seconds > 0 || sending}>
            {PENDING.resend}
          </button>
        )}
        <Link
          className={styles.btnSecondary}
          href="/assessment"
          onClick={clearPendingEmail}
        >
          {PENDING.changeEmail}
        </Link>
      </div>
      {email && seconds > 0 && (
        <p className={`${styles.body} ${styles.muted}`} aria-live="polite">
          {fill(PENDING.resendWait, { seconds })}
        </p>
      )}
      {message && (
        <p className={styles.body} role="status">
          {message}
        </p>
      )}
    </>
  );
}

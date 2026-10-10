'use client';

/**
 * ASM-11 "Retry Report Preparation". Invokes report-generation recovery only — never a new
 * submission. On success the page refreshes into the ASM-10 ready state; on failure it stays in
 * the recoverable ASM-11 state with the submitted answers untouched.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../assessment.module.css';

export default function RetryReportButton({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failedAgain, setFailedAgain] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.btn}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailedAgain(false);
          const res = await fetch(`/api/v1/assessments/${assessmentId}/report`, { method: 'POST' }).catch(() => null);
          if (res?.ok) {
            router.refresh();
            return;
          }
          setFailedAgain(true);
          setBusy(false);
        }}
      >
        {busy ? 'Retrying…' : 'Retry Report Preparation'}
      </button>
      {failedAgain && (
        <p className={styles.muted} role="alert">
          The report is still not ready. Your answers remain safely submitted.
        </p>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function SubmittedPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/assessment/sessions/${sessionId}/result`, { method: "POST" })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as { error?: string; validationErrors?: Array<{ message?: string }> } | null;
        if (!response.ok) throw new Error(payload?.error ?? "Your report could not be generated yet.");
        if (cancelled) return;
        setIsReady(true);
        router.push(`/report/${sessionId}`);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Your report could not be generated yet.");
      });
    return () => { cancelled = true; };
  }, [sessionId, attempt, router]);

  function retry() {
    setError(null);
    setIsReady(false);
    setAttempt((value) => value + 1);
  }

  if (isReady) {
    return <main className="route-shell route-shell-wide submitted-page"><p className="eyebrow">ROOTS / SUBMITTED</p><h1>Your report is ready</h1><p className="route-lede">Your answers were submitted and the report record passed its integrity check.</p><Link href={`/report/${sessionId}`} className="primary-button">Open your report</Link></main>;
  }

  return <main className="route-shell route-shell-wide submitted-page" aria-busy={!error}>
    <p className="eyebrow">ROOTS / SUBMITTED</p>
    <h1>{error ? "Report generation needs another try" : "Preparing your report"}</h1>
    <p className="route-lede" role="status">{error ?? "Your scores are calculated first; governed explanatory content follows."}</p>
    {error ? <div className="form-actions"><button type="button" className="primary-button" onClick={retry}>Try again</button><Link href={`/assessment/${sessionId}/review`} className="secondary-button">Back to review</Link></div> : <div className="generation-indicator" aria-hidden="true"><span /><span /><span /></div>}
    <p className="review-boundary">If generation continues to fail, your submitted answers remain saved. Contact support through the Contact page.</p>
  </main>;
}

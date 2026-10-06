"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { assessmentModules } from "@/lib/canonicalAssessment";

type Progress = {
  completedModules: string[];
  completedModuleCount: number;
  totalModules: number;
  currentModuleId: string;
  percentComplete: number;
  isComplete: boolean;
};

export default function ReviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/assessment/sessions/${sessionId}/progress`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Your saved assessment could not be verified.");
        return response.json() as Promise<Progress>;
      })
      .then((payload) => {
        if (!cancelled) setProgress(payload);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Your saved assessment could not be verified.");
      });
    return () => { cancelled = true; };
  }, [sessionId]);

  async function submitAssessment() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    router.push(`/assessment/${sessionId}/submitted`);
  }

  if (error && !progress) {
    return <main className="route-shell route-shell-wide"><p className="eyebrow">ROOTS / REVIEW</p><h1>Review unavailable</h1><p className="route-lede">{error}</p><Link href="/assessment" className="primary-button">Start a new assessment</Link></main>;
  }

  if (!progress) {
    return <main className="route-shell route-shell-wide" aria-busy="true"><p className="eyebrow">ROOTS / REVIEW</p><h1>Preparing your review</h1><p className="route-lede" role="status">Checking your saved modules before submission…</p></main>;
  }

  const nextModule = assessmentModules.find((module) => !progress.completedModules.includes(module.id));
  return <main className="route-shell route-shell-wide review-page">
    <p className="eyebrow">ROOTS / REVIEW</p>
    <h1>Review your assessment</h1>
    <p className="route-lede">Your answers are saved. Review the module status below, then submit only when you are ready. No score is shown until the report is generated.</p>
    <section className="review-summary" aria-label="Assessment completion">
      <div><strong>{progress.completedModuleCount} / {progress.totalModules}</strong><span>modules complete</span></div>
      <div><strong>{progress.percentComplete}%</strong><span>required answers saved</span></div>
      <div><strong>{progress.isComplete ? "Ready" : "In progress"}</strong><span>submission status</span></div>
    </section>
    <ol className="review-module-list">
      {assessmentModules.map((module) => {
        const complete = progress.completedModules.includes(module.id);
        return <li className={complete ? "complete" : "incomplete"} key={module.id}><span className="review-module-status" aria-hidden="true">{complete ? "✓" : "—"}</span><span><strong>{module.title}</strong><small>{complete ? "Complete" : "Needs your responses"}</small></span></li>;
      })}
    </ol>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions">
      {nextModule ? <Link href={`/assessment/${sessionId}/module/${nextModule.id}`} className="secondary-button">Continue assessment</Link> : <button type="button" className="primary-button" onClick={submitAssessment} disabled={isSubmitting}>{isSubmitting ? "Submitting…" : "Submit and generate report"}</button>}
    </div>
    <p className="review-boundary">Submitting creates an immutable report record from the completed answers. Educational — Not a Diagnosis.</p>
  </main>;
}

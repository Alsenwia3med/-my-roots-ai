"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ExistingSession = { sessionId: string; completedModules: string[]; updatedAt?: string };

export default function AssessmentStartPage() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSession, setExistingSession] = useState<ExistingSession | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/assessment/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ session?: ExistingSession | null }>;
      })
      .then((payload) => {
        if (!cancelled && payload?.session) setExistingSession(payload.session);
      })
      .catch(() => {
        // The optional resume lookup must never block a new session.
      });
    return () => { cancelled = true; };
  }, []);

  async function startAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Enter your email address to continue.");
      return;
    }
    if (!consent) {
      setError("Please acknowledge the service terms before continuing.");
      return;
    }
    setIsStarting(true);
    try {
      const response = await fetch("/api/assessment/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, serviceConsent: true }),
      });
      const payload = await response.json().catch(() => null) as { sessionId?: string; error?: string } | null;
      if (!response.ok || !payload?.sessionId) throw new Error(payload?.error ?? "We could not create a secure assessment session. Please try again.");
      router.push(`/assessment/${payload.sessionId}/module/M01`);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "We could not create a secure assessment session. Please try again.");
      setIsStarting(false);
    }
  }

  return <main className="route-shell">
    <section className="assessment-entry-card">
      <p className="eyebrow">ROOTS / ASSESSMENT</p>
      <h1>Your ROOTS Biological Assessment</h1>
      <p className="route-lede">Answer 73 questions across 13 short modules. Most people finish in about 10–12 minutes. You can save, pause and resume securely.</p>
      <ul className="assessment-bullets">
        <li>Use your usual experience during the last four weeks unless a question says otherwise.</li>
        <li>There are no &quot;good&quot; answers. Choose what best reflects your experience.</li>
        <li>N/A is available only where approved and is never treated as zero.</li>
        <li>Your answers generate educational wellness indicators, not a diagnosis.</li>
        <li>If you may be in immediate danger, contact local emergency services; this form is not monitored for emergencies.</li>
      </ul>
      <form className="route-form" onSubmit={startAssessment} noValidate>
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required aria-describedby="email-help" />
        <p id="email-help" className="field-help">We use your email only to send your secure link. See the <Link href="/privacy">Privacy Notice</Link>.</p>
        <label className="consent-row" htmlFor="service-consent"><input id="service-consent" name="service-consent" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span>I confirm that I am 18 or older.</span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="continue-button" type="submit" disabled={isStarting || !email.trim() || !consent}>{isStarting ? "Creating your private session…" : "Begin Assessment"}</button>
      </form>
    </section>
    {existingSession && <section className="resume-card" aria-labelledby="resume-heading"><div><p className="eyebrow">SAVED SESSION</p><h2 id="resume-heading">Continue where you left off</h2><p>{existingSession.completedModules.length} of 13 modules are complete{existingSession.updatedAt ? ` · Last saved ${new Date(existingSession.updatedAt).toLocaleString()}` : ""}.</p></div><button type="button" className="secondary-button" onClick={() => router.push(`/assessment/${existingSession.sessionId}/resume`)}>Resume assessment</button></section>}
  </main>;
}

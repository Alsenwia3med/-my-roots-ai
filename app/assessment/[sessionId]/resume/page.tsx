"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { assessmentModules } from "@/lib/canonicalAssessment";

type SessionState = { completedModules: string[]; updatedAt?: string };

export default function ResumePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/assessment/sessions/${sessionId}`).then(async (response) => {
      if (!response.ok) throw new Error("missing");
      setSession(await response.json());
    }).catch(() => setError(true));
  }, [sessionId]);

  if (error) return <main className="route-shell"><p className="eyebrow">ROOTS / RESUME</p><h1>Session unavailable</h1><p className="route-lede">Request a new assessment session to continue safely.</p><Link className="primary-button" href="/assessment">Start a new assessment</Link></main>;
  if (!session) return <main className="route-shell"><p className="eyebrow">ROOTS / RESUME</p><h1>Checking your saved assessment</h1><p className="route-lede">Your answers remain private while we verify the session.</p></main>;

  const nextModule = assessmentModules.find((module) => !session.completedModules.includes(module.id));
  const isComplete = session.completedModules.length >= assessmentModules.length;
  return <main className="route-shell"><p className="eyebrow">ROOTS / RESUME</p><h1>Welcome back</h1><p className="route-lede">You have completed {session.completedModules.length} of {assessmentModules.length} modules.{isComplete ? " Your answers are ready for review." : nextModule ? ` Continue from ${nextModule.title}.` : ""}</p><p className="save-meta">Last saved: {session.updatedAt ? new Date(session.updatedAt).toLocaleString() : "Not available"}</p><Link className="primary-button" href={isComplete ? `/assessment/${sessionId}/review` : `/assessment/${sessionId}/module/${nextModule?.id ?? "M13"}`}>{isComplete ? "Review assessment" : "Resume assessment"}</Link></main>;
}
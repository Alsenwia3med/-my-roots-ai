"use client";

import { FormEvent, use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { assessmentModules, type AssessmentModule } from "@/lib/canonicalAssessment";
import QuestionCard from "@/components/ui/QuestionCard";
import ProgressBar from "@/components/ui/ProgressBar";

export default function ModulePage({ params }: { params: Promise<{ sessionId: string; moduleId: string }> }) {
  const { sessionId, moduleId } = use(params);
  const router = useRouter();
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string | number | string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "failed">("saved");
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedModule: AssessmentModule | undefined = assessmentModules.find((item) => item.id === moduleId);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/assessment/sessions/${sessionId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("session unavailable");
        const payload = await response.json();
        if (cancelled) return;
        setSavedAnswers(payload.answers ?? {});
      })
      .catch(() => {
        if (!cancelled) router.replace("/assessment");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [sessionId, router]);

  if (!selectedModule) {
    return <main className="route-shell"><h1>Module not found</h1><p className="route-lede">This learning branch does not exist.</p></main>;
  }
  const activeModule: AssessmentModule = selectedModule;

  function collectAnswers(form: HTMLFormElement) {
    const formData = new FormData(form);
    const answers: Record<string, string | string[]> = {};
    activeModule.questions.forEach((question) => {
      if (question.type === "decimal_with_unit") {
        // Package the numeric value and the canonical unit into one answer.
        const value = String(formData.get(`${question.id}__value`) ?? "").trim();
        const unit = String(formData.get(`${question.id}__unit`) ?? "").trim();
        if (value !== "" && unit !== "") {
          answers[question.id] = JSON.stringify({ value: Number(value), unit });
        }
        return;
      }
      // A multi-select answer is ALWAYS an array, even when only one option is
      // selected. Collapsing a single selection to a bare string makes the
      // canonical validator treat a multi-select as a scalar, so a perfectly
      // valid single choice (e.g. Q13 = NONE) is reported as "must have a valid
      // response" and the module can never be submitted.
      const values = formData.getAll(question.id).map(String);
      if (question.type === "multi_select") {
        if (values.length > 0) answers[question.id] = values;
        return;
      }
      if (values.length === 1) answers[question.id] = values[0];
      if (values.length > 1) answers[question.id] = values;
    });
    return answers;
  }

  /**
   * Persist the current answers.
   *
   * The server accepts a partial autosave and returns HTTP 200 with a
   * `validationErrors` array describing required questions that are still
   * unanswered elsewhere in the module. A partial autosave does not mark that
   * module complete; only a complete module submission advances progress.
   */
  async function persistAnswers(
    answers: Record<string, string | string[]>,
    requireComplete = false,
  ): Promise<{ ok: boolean; errors: string[] }> {
    setSaveStatus("saving");
    const response = await fetch(`/api/assessment/sessions/${sessionId}/answers`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleId: activeModule.id, answers }) });
    const payload = await response.json().catch(() => null) as { validationErrors?: Array<{ message?: string }>; error?: string } | null;
    const errors = (payload?.validationErrors ?? [])
      .map((item) => item?.message ?? "")
      .filter(Boolean);
    const stored = response.ok;
    const ok = stored && (!requireComplete || errors.length === 0);
    setSaveStatus(stored ? "saved" : "failed");
    if (stored) setSavedAnswers((current) => ({ ...current, ...answers }));
    // If the session expired, redirect to the start page. Use the router (a
    // client-side navigation) rather than assigning window.location.href, which
    // is both a full page reload and flagged by the Next.js lint rules.
    if (response.status === 400 && payload?.error?.includes("expired")) {
      router.replace("/assessment");
    }
    return { ok, errors };
  }

  function queueAutosave(form: HTMLFormElement) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(() => { void persistAnswers(collectAnswers(form)); }, 700);
  }

  /** Enforce NONE / N/A mutual exclusivity at the point of interaction. */
  function onChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLInputElement;
    if (target.type === "checkbox" && target.name.startsWith("Q")) {
      const boxes = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name="${target.name}"]`));
      if (target.checked && target.dataset.exclusive === "true") {
        boxes.filter((box) => box !== target).forEach((box) => (box.checked = false));
      } else if (target.checked) {
        boxes.filter((box) => box.dataset.exclusive === "true").forEach((box) => (box.checked = false));
      }
    }
    queueAutosave(event.currentTarget);
  }

  async function submitModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const answers = collectAnswers(event.currentTarget);
    // On submit the module must be complete: the server validates every required
    // response against C-01, and an incomplete module must not be advanced past.
    const { ok: saved, errors } = await persistAnswers(answers, true);
    if (!saved) {
      setSubmitErrors(errors);
      return;
    }
    setSubmitErrors([]);
    const moduleIndex = assessmentModules.findIndex((item) => item.id === activeModule.id);
    const nextModule = assessmentModules[moduleIndex + 1];
    if (nextModule) {
      router.push(`/assessment/${sessionId}/module/${nextModule.id}`);
      return;
    }
    // Final module: require an explicit review step before producing the report.
    router.push(`/assessment/${sessionId}/review`);
  }

  if (isLoading) {
    return <main className="route-shell route-shell-wide" aria-busy="true">
      <p className="eyebrow">MODULE {activeModule.order} OF 13</p>
      <h1>{activeModule.title}</h1>
      <p className="route-lede" role="status">Loading your saved answers before continuing…</p>
    </main>;
  }

  return (
    <main className="route-shell route-shell-wide">
      <p className="eyebrow">MODULE {activeModule.order} OF 13</p>
      <h1>{activeModule.title}</h1>
      <p className="route-lede">{activeModule.purpose}. Use your usual experience during the last four weeks unless a question says otherwise.</p>
      <ProgressBar current={activeModule.order} total={assessmentModules.length} className="route-progress" />
      <form className="question-form" onSubmit={submitModule} onChange={onChange}>
        <div className={`save-status save-status-${saveStatus}`} role="status" aria-live="polite">
          {saveStatus === "saving" ? "Saving…" : saveStatus === "failed" ? (
            <>
              Save failed. Your session may have expired. <Link href="/assessment" className="text-blue-600 hover:underline">Start a new assessment</Link>.
            </>
          ) : "Saved"}
        </div>
        {submitErrors.length > 0 && (
          // Shown only when the participant presses Continue with required
          // answers still missing. Autosave progress never reports a failure.
          <div className="save-status save-status-failed" role="alert">
            <p>Please complete the required responses before continuing:</p>
            <ul>
              {submitErrors.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        )}
        {activeModule.questions.map((question) => <QuestionCard key={question.id} question={question} defaultValue={savedAnswers[question.id]} />)}
        <button className="continue-button" type="submit">{activeModule.order === assessmentModules.length ? "Review and Submit" : "Save and Continue"}</button>
      </form>
    </main>
  );
}

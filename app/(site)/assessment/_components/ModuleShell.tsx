'use client';

/**
 * ASM-06 Module Question Shell with ASM-07 Save and Exit.
 *
 * - Controls come only from C-01 (type, options, required, N/A); errors use C-01 VAL wording.
 * - Autosave: a stable change (selection, or blur / pause after typing) is validated locally and
 *   sent to the server; "Saved" appears only after the server acknowledges (C-05 §12). A failed
 *   save keeps the entry on this device, shows C-04 SAVE-FAIL and retries on reconnect.
 * - Next / Back / Save & Exit flush pending saves first, so navigation never loses answers.
 * - Next is governed (C-05 ASM-06 zones 4-5): every required question on this module must have a
 *   valid answer — or an explicit N/A where C-01 allows it — before moving on. Missing answers are
 *   highlighted inline with a summary at the top; missing is never treated as N/A. Back is always
 *   allowed.
 * - Inactivity warning with "stay signed in"; on expiry the view is cleared and C-04
 *   SESSION-EXPIRED is shown (C-05 ASM-06 zone 7; §12 Sessions).
 */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from '../assessment.module.css';
import { ApiRequestError, apiFetch, signOut } from './api';
import QuestionField from './QuestionField';
import ShellStatus from './ShellStatus';
import { fill, LABELS, PENDING, SYSTEM } from '@/lib/assessment/copy';
import { progressPercent } from '@/lib/assessment/progress';
import type { Module, Question } from '@/lib/assessment/questionBank';
import { validateAnswer, type RawAnswer } from '@/lib/assessment/validation';

type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

interface SaveResponse {
  errors: Record<string, { rule: string; message: string }>;
  saved_at: string;
  progress_percent: number;
}

const SAVE_DEBOUNCE_MS = 600;
const WARN_BEFORE_MS = 2 * 60 * 1000;

export default function ModuleShell({
  assessmentId,
  module,
  questions,
  initialAnswers,
  initialLastSavedAt,
  idleTimeoutMinutes,
}: {
  assessmentId: string;
  module: Module;
  questions: Question[];
  initialAnswers: Record<string, RawAnswer>;
  initialLastSavedAt: string | null;
  idleTimeoutMinutes: number;
}) {
  const [answers, setAnswers] = useState<Record<string, RawAnswer>>(initialAnswers);
  // Latest answers without waiting for a render: a typed value committed on blur is seen by the
  // Next click that caused the blur.
  const answersRef = useRef<Record<string, RawAnswer>>(initialAnswers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialLastSavedAt);
  const [expired, setExpired] = useState(false);
  const [offline, setOffline] = useState(false);
  const [warningMinutes, setWarningMinutes] = useState<number | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [dialogError, setDialogError] = useState(false);

  const pending = useRef(new Map<string, RawAnswer | null>());
  const inflight = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivity = useRef(Date.now());
  const dialogRef = useRef<HTMLDialogElement>(null);

  const total = 13;
  const percent = useMemo(() => progressPercent(Object.keys(answers)), [answers]);

  const expire = useCallback(() => {
    pending.current.clear();
    setExpired(true);
    dialogRef.current?.close();
  }, []);

  const flush = useCallback(async (): Promise<boolean> => {
    if (inflight.current) await inflight.current;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (pending.current.size === 0) return true;

    const batch = new Map(pending.current);
    pending.current.clear();
    setSaveState('saving');

    const run = (async () => {
      try {
        const result = await apiFetch<SaveResponse>(`/api/v1/assessments/${assessmentId}/responses`, {
          method: 'PUT',
          body: JSON.stringify({
            currentModule: module.module_order,
            answers: [...batch].map(([question_id, value]) => ({ question_id, value })),
          }),
        });
        const serverErrors = Object.entries(result.errors ?? {});
        if (serverErrors.length) {
          setErrors((prev) => ({ ...prev, ...Object.fromEntries(serverErrors.map(([q, e]) => [q, e.message])) }));
        }
        setLastSavedAt(result.saved_at);
        setSaveState(pending.current.size ? 'saving' : 'saved');
        return serverErrors.length === 0;
      } catch (error) {
        // Keep the unsent entries unless the participant has changed them again since.
        batch.forEach((value, question) => {
          if (!pending.current.has(question)) pending.current.set(question, value);
        });
        if (error instanceof ApiRequestError && error.status === 401) {
          expire();
          return false;
        }
        setSaveState('failed');
        return false;
      }
    })();

    inflight.current = run;
    const ok = await run;
    inflight.current = null;
    return ok && pending.current.size === 0 ? true : ok ? flush() : false;
  }, [assessmentId, expire, module.module_order]);

  const commit = useCallback(
    (questionId: string, value: RawAnswer | null) => {
      lastActivity.current = Date.now();
      if (value !== null) {
        const result = validateAnswer(questionId, value);
        if (!result.ok) {
          setErrors((prev) => ({ ...prev, [questionId]: result.message }));
          pending.current.delete(questionId);
          return;
        }
        value = result.answer.raw_value;
      }
      setErrors((prev) => {
        if (!(questionId in prev)) return prev;
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      const nextAnswers = { ...answersRef.current };
      if (value === null) delete nextAnswers[questionId];
      else nextAnswers[questionId] = value;
      answersRef.current = nextAnswers;
      setAnswers(nextAnswers);
      pending.current.set(questionId, value);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
    },
    [flush]
  );

  const reportInvalid = useCallback((questionId: string, message: string | null) => {
    setErrors((prev) => {
      if (message === null) {
        if (!(questionId in prev)) return prev;
        const next = { ...prev };
        delete next[questionId];
        return next;
      }
      return { ...prev, [questionId]: message };
    });
  }, []);

  const focusQuestion = (questionId: string) => {
    document.getElementById(questionId)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    document.getElementById(`${questionId}-control`)?.focus({ preventScroll: true });
  };

  async function go(href: string, direction: 'back' | 'next') {
    if (navigating) return;
    const invalid = questions.find((q) => errors[q.question_id]);
    if (invalid && direction === 'next') {
      focusQuestion(invalid.question_id);
      return;
    }
    if (direction === 'next') {
      // Required and unanswered on this module: highlight every one and stay here.
      const missing = questions.filter((q) => q.required && answersRef.current[q.question_id] === undefined);
      if (missing.length) {
        setErrors((prev) => ({ ...prev, ...Object.fromEntries(missing.map((q) => [q.question_id, PENDING.answerRequired])) }));
        focusQuestion(missing[0].question_id);
        return;
      }
    }
    setNavigating(true);
    if (await flush()) {
      window.location.assign(href);
      return;
    }
    setNavigating(false);
  }

  // Never leave the buttons disabled: re-enable when the page is shown again from the browser's
  // back/forward cache, and if the next page has not loaded after a while (slow network).
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setNavigating(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);
  useEffect(() => {
    if (!navigating) return;
    const t = setTimeout(() => setNavigating(false), 12000);
    return () => clearTimeout(t);
  }, [navigating]);

  async function saveAndExit() {
    setDialogError(false);
    if (await flush()) {
      await signOut();
      window.location.assign('/');
      return;
    }
    setDialogError(true);
  }

  // Offline / reconnect (SYS-05).
  useEffect(() => {
    const update = () => {
      setOffline(!navigator.onLine);
      if (navigator.onLine) void flush();
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [flush]);

  // Warn before leaving with unsaved entries.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pending.current.size > 0 || inflight.current) event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Inactivity warning and expiry.
  useEffect(() => {
    const limit = idleTimeoutMinutes * 60 * 1000;
    const markActive = () => {
      lastActivity.current = Date.now();
    };
    const events = ['keydown', 'pointerdown', 'input'] as const;
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    const interval = setInterval(async () => {
      const remaining = limit - (Date.now() - lastActivity.current);
      if (remaining <= 0) {
        clearInterval(interval);
        await flush();
        await signOut();
        expire();
      } else if (remaining <= WARN_BEFORE_MS) {
        setWarningMinutes(Math.max(1, Math.ceil(remaining / 60000)));
      } else {
        setWarningMinutes(null);
      }
    }, 15000);
    return () => {
      clearInterval(interval);
      events.forEach((e) => window.removeEventListener(e, markActive));
    };
  }, [expire, flush, idleTimeoutMinutes]);

  async function staySignedIn() {
    try {
      await apiFetch('/api/v1/auth/session');
      lastActivity.current = Date.now();
      setWarningMinutes(null);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) expire();
    }
  }

  if (expired) {
    return (
      <>
        <p className={`${styles.banner} ${styles.bannerError}`} role="alert">
          {SYSTEM.sessionExpired}
        </p>
        <div className={styles.actions}>
          <Link className={styles.btn} href="/assessment">
            {PENDING.requestNewLink}
          </Link>
        </div>
      </>
    );
  }

  const savedTime = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  const isLast = module.module_order === total;

  return (
    <>
      <ShellStatus>
        <span className={styles.saveStatus} role="status" aria-live="polite">
          {saveState === 'saving' && LABELS.saving}
          {saveState === 'saved' && SYSTEM.save}
          {saveState === 'failed' && LABELS.failed}
        </span>
        <button className={styles.btnGhost} type="button" onClick={() => dialogRef.current?.showModal()}>
          {LABELS.saveAndExit}
        </button>
      </ShellStatus>

      <p className={styles.eyebrow}>
        {fill(PENDING.moduleOf, { n: module.module_order })} · {fill(PENDING.percentComplete, { percent })}
      </p>
      <div
        className={styles.progressBar}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={fill(PENDING.percentComplete, { percent })}
      >
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>

      <h1 className={styles.title}>{module.module_title}</h1>
      <p className={styles.lede}>{module.purpose}</p>

      {offline && (
        <p className={styles.banner} role="status">
          {PENDING.offline}
        </p>
      )}
      {saveState === 'failed' && (
        <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
          <p>{SYSTEM.saveFail}</p>
          <button className={styles.btnSecondary} type="button" onClick={() => void flush()}>
            {PENDING.retrySave}
          </button>
        </div>
      )}
      {warningMinutes !== null && (
        <div className={styles.banner} role="alert">
          <p>{fill(PENDING.sessionWarning, { minutes: warningMinutes })}</p>
          <button className={styles.btnSecondary} type="button" onClick={staySignedIn}>
            {PENDING.extendSession}
          </button>
        </div>
      )}
      {Object.keys(errors).length > 0 && (
        <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
          {questions.some((q) => errors[q.question_id] === PENDING.answerRequired) && <p>{PENDING.completeModuleToContinue}</p>}
          <ul>
            {questions
              .filter((q) => errors[q.question_id])
              .map((q) => (
                <li key={q.question_id}>
                  <a className={styles.link} href={`#${q.question_id}`}>
                    {q.question_text}
                  </a>{' '}
                  — {errors[q.question_id]}
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className={styles.questions}>
        {questions.map((q) => (
          <QuestionField
            key={q.question_id}
            question={q}
            value={answers[q.question_id]}
            error={errors[q.question_id] ?? null}
            onCommit={commit}
            onInvalid={reportInvalid}
          />
        ))}
      </div>

      <nav className={styles.moduleNav} aria-label="Assessment navigation">
        {module.module_order > 1 ? (
          <button
            className={styles.btnSecondary}
            type="button"
            disabled={navigating}
            onClick={() => go(`/assessment/${assessmentId}/module/${module.module_order - 1}`, 'back')}
          >
            {LABELS.back}
          </button>
        ) : (
          <span />
        )}
        <button
          className={styles.btn}
          type="button"
          disabled={navigating}
          aria-busy={navigating || undefined}
          onClick={() => go(isLast ? `/assessment/${assessmentId}/review` : `/assessment/${assessmentId}/module/${module.module_order + 1}`, 'next')}
        >
          {navigating ? PENDING.movingOn : LABELS.next}
        </button>
      </nav>

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="save-exit-title">
        <h2 id="save-exit-title" className={styles.dialogTitle}>
          {PENDING.saveExitTitle}
        </h2>
        <p className={styles.body}>{savedTime ? fill(PENDING.lastSaved, { time: savedTime }) : PENDING.notSavedYet}</p>
        <p className={styles.body}>{PENDING.saveExitBody}</p>
        {dialogError && (
          <p className={styles.error} role="alert">
            {SYSTEM.saveFail}
          </p>
        )}
        <div className={styles.actions}>
          <button className={styles.btn} type="button" onClick={saveAndExit}>
            {LABELS.saveAndExit}
          </button>
          <button className={styles.btnSecondary} type="button" onClick={() => dialogRef.current?.close()}>
            {LABELS.continueAssessment}
          </button>
        </div>
      </dialog>
    </>
  );
}

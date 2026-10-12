'use client';

/**
 * DESIGN PREVIEW ONLY — not part of the participant flow.
 *
 * Renders a real C-01 module with the real QuestionField controls, so the redesigned question
 * screens can be reviewed without signing in or a database. Answers live in memory and are never
 * sent anywhere. Mirrors the markup of ModuleShell (same classes, same copy constants).
 */

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import styles from '../assessment.module.css';
import QuestionField from '../_components/QuestionField';
import ShellStatus from '../_components/ShellStatus';
import { fill, LABELS, PENDING } from '@/lib/assessment/copy';
import { progressPercent } from '@/lib/assessment/progress';
import type { Module, Question } from '@/lib/assessment/questionBank';
import { validateAnswer, type RawAnswer } from '@/lib/assessment/validation';

export default function PreviewModule({ module, questions }: { module: Module; questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, RawAnswer>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const percent = useMemo(() => progressPercent(Object.keys(answers)), [answers]);
  const total = 13;

  const commit = (questionId: string, value: RawAnswer | null) => {
    if (value !== null) {
      const result = validateAnswer(questionId, value);
      if (!result.ok) {
        setErrors((prev) => ({ ...prev, [questionId]: result.message }));
        return;
      }
      value = result.answer.raw_value;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === null) delete next[questionId];
      else next[questionId] = value;
      return next;
    });
  };
  const reportInvalid = (questionId: string, message: string | null) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (message === null) delete next[questionId];
      else next[questionId] = message;
      return next;
    });

  return (
    <>
      <ShellStatus>
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
          <Link className={styles.btnSecondary} href={`/assessment/preview?m=${module.module_order - 1}`}>
            {LABELS.back}
          </Link>
        ) : (
          <span />
        )}
        <Link
          className={styles.btn}
          href={module.module_order < total ? `/assessment/preview?m=${module.module_order + 1}` : '/assessment/preview?screen=entry'}
        >
          {LABELS.next}
        </Link>
      </nav>

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="save-exit-title">
        <h2 id="save-exit-title" className={styles.dialogTitle}>
          {PENDING.saveExitTitle}
        </h2>
        <p className={styles.body}>{PENDING.notSavedYet}</p>
        <p className={styles.body}>{PENDING.saveExitBody}</p>
        <div className={styles.actions}>
          <button className={styles.btnSecondary} type="button" onClick={() => dialogRef.current?.close()}>
            {LABELS.continueAssessment}
          </button>
        </div>
      </dialog>
    </>
  );
}

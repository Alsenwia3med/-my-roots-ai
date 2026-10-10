'use client';

/**
 * One C-01 question. Control per question_type; N/A only where C-01 allows it; help text and
 * errors are programmatically associated (WCAG 2.2 AA; C-05 §13). Selections save immediately;
 * typed values save when they become stable (blur, or a pause for free text).
 */

import { memo, useEffect, useRef, useState } from 'react';
import styles from '../assessment.module.css';
import { fill, PENDING } from '@/lib/assessment/copy';
import { getOptions, naOption, offersSeparateNa, participantHelpText, type Question } from '@/lib/assessment/questionBank';
import { VAL, validateAnswer, type RawAnswer } from '@/lib/assessment/validation';

interface Props {
  question: Question;
  value: RawAnswer | undefined;
  error: string | null;
  onCommit: (questionId: string, value: RawAnswer | null) => void;
  onInvalid: (questionId: string, message: string | null) => void;
}

const isNa = (v: RawAnswer | undefined): v is { na: true } =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && 'na' in v;

/** Question types answered by picking from a list, which share the warm option surface. */
const CHOICE_TYPES = new Set<Question['question_type']>([
  'single_select',
  'likert',
  'multi_select',
  'integer_scale',
]);

function QuestionField({ question, value, error, onCommit, onInvalid }: Props) {
  const q = question;
  const ids = {
    control: `${q.question_id}-control`,
    help: `${q.question_id}-help`,
    error: `${q.question_id}-error`,
  };
  const help = participantHelpText(q);
  const describedBy = [help ? ids.help : null, error ? ids.error : null].filter(Boolean).join(' ') || undefined;

  const legend = (
    <>
      {q.question_text}
      <span className={styles.requiredTag}>{q.required ? PENDING.required : PENDING.optional}</span>
    </>
  );

  const helpAndError = (
    <>
      {help && (
        <p id={ids.help} className={styles.help}>
          {help}
        </p>
      )}
      {error && (
        <p id={ids.error} className={styles.error}>
          {error}
        </p>
      )}
    </>
  );

  let control: React.ReactNode;

  switch (q.question_type) {
    case 'single_select':
    case 'likert':
      control = (
        <fieldset className={styles.fieldset} aria-describedby={describedBy}>
          <legend className={styles.legend}>{legend}</legend>
          {helpAndError}
          <div className={styles.options} id={ids.control} tabIndex={-1} role="radiogroup" aria-required={q.required} aria-label={q.question_text}>
            {getOptions(q)
              .filter((o) => !o.is_na || q.allow_na)
              .map((o) => (
                <label key={o.option_id} className={styles.option}>
                  <input
                    type="radio"
                    name={q.question_id}
                    value={o.option_id}
                    checked={value === o.option_id}
                    onChange={() => onCommit(q.question_id, o.option_id)}
                  />
                  <span>{o.display_label}</span>
                </label>
              ))}
          </div>
        </fieldset>
      );
      break;

    case 'multi_select': {
      const selected = Array.isArray(value) ? value : [];
      const na = naOption(q);
      const exclusive = (id: string) => id === 'NONE' || id === na?.option_id;
      const toggle = (id: string, checked: boolean) => {
        let next = checked ? [...selected, id] : selected.filter((s) => s !== id);
        if (checked) next = exclusive(id) ? [id] : next.filter((s) => !exclusive(s));
        onCommit(q.question_id, next.length ? next : null);
      };
      control = (
        <fieldset className={styles.fieldset} aria-describedby={describedBy}>
          <legend className={styles.legend}>{legend}</legend>
          {helpAndError}
          <div className={styles.options} id={ids.control} tabIndex={-1}>
            {getOptions(q)
              .filter((o) => !o.is_na || q.allow_na)
              .map((o) => (
                <label key={o.option_id} className={styles.option}>
                  <input
                    type="checkbox"
                    name={q.question_id}
                    value={o.option_id}
                    checked={selected.includes(o.option_id)}
                    onChange={(e) => toggle(o.option_id, e.target.checked)}
                  />
                  <span>{o.display_label}</span>
                </label>
              ))}
          </div>
        </fieldset>
      );
      break;
    }

    case 'integer_scale':
      control = (
        <fieldset className={styles.fieldset} aria-describedby={describedBy}>
          <legend className={styles.legend}>{legend}</legend>
          {helpAndError}
          <div className={styles.scale} id={ids.control} tabIndex={-1} role="radiogroup" aria-required={q.required} aria-label={q.question_text}>
            {Array.from({ length: 11 }, (_, n) => (
              <label key={n} className={styles.option}>
                <input
                  type="radio"
                  name={q.question_id}
                  value={n}
                  checked={value === n}
                  onChange={() => onCommit(q.question_id, n)}
                />
                <span>{n}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
      break;

    case 'integer':
    case 'decimal':
      control = (
        <NumberField question={q} value={value} ids={ids} describedBy={describedBy} legend={legend} helpAndError={helpAndError} error={error} onCommit={onCommit} onInvalid={onInvalid} />
      );
      break;

    case 'decimal_with_unit':
      control = (
        <WaistField question={q} value={value} ids={ids} describedBy={describedBy} legend={legend} helpAndError={helpAndError} error={error} onCommit={onCommit} onInvalid={onInvalid} />
      );
      break;

    case 'free_text':
      control = (
        <FreeTextField question={q} value={value} ids={ids} describedBy={describedBy} legend={legend} helpAndError={helpAndError} error={error} onCommit={onCommit} />
      );
      break;
  }

  return (
    <section
      id={q.question_id}
      className={styles.question}
      data-choice={CHOICE_TYPES.has(q.question_type) ? 'true' : undefined}
      data-invalid={error ? true : undefined}
    >
      {control}
    </section>
  );
}

interface InputFieldProps {
  question: Question;
  value: RawAnswer | undefined;
  ids: { control: string; help: string; error: string };
  describedBy: string | undefined;
  legend: React.ReactNode;
  helpAndError: React.ReactNode;
  error: string | null;
  onCommit: Props['onCommit'];
  onInvalid?: Props['onInvalid'];
}

function NaToggle({ question, checked, onChange }: { question: Question; checked: boolean; onChange: (checked: boolean) => void }) {
  if (!offersSeparateNa(question)) return null;
  return (
    <label className={styles.check}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{PENDING.notApplicable}</span>
    </label>
  );
}

function NumberField({ question: q, value, ids, describedBy, legend, helpAndError, error, onCommit, onInvalid }: InputFieldProps) {
  const [text, setText] = useState(typeof value === 'number' ? String(value) : '');
  const na = isNa(value);

  function commitText() {
    const trimmed = text.trim();
    if (trimmed === '') {
      if (!na && value !== undefined) onCommit(q.question_id, null);
      return;
    }
    const n = Number(trimmed);
    const result = validateAnswer(q.question_id, Number.isFinite(n) ? n : NaN);
    if (!result.ok) {
      onInvalid?.(q.question_id, result.message);
      return;
    }
    if (n !== value) onCommit(q.question_id, n);
  }

  return (
    <fieldset className={styles.fieldset} aria-describedby={describedBy}>
      <legend className={styles.legend}>{legend}</legend>
      {helpAndError}
      <div className={styles.numberRow}>
        <label className={styles.srOnly} htmlFor={ids.control}>
          {q.question_text}
        </label>
        <input
          id={ids.control}
          className={styles.input}
          type="text"
          inputMode={q.question_type === 'integer' ? 'numeric' : 'decimal'}
          value={na ? '' : text}
          disabled={na}
          required={q.required}
          aria-required={q.required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            setText(e.target.value);
            if (error) onInvalid?.(q.question_id, null);
          }}
          onBlur={commitText}
          onKeyDown={(e) => e.key === 'Enter' && commitText()}
        />
      </div>
      <NaToggle
        question={q}
        checked={na}
        onChange={(checked) => {
          if (checked) {
            setText('');
            onCommit(q.question_id, { na: true });
          } else {
            onCommit(q.question_id, null);
          }
        }}
      />
    </fieldset>
  );
}

function WaistField({ question: q, value, ids, describedBy, legend, helpAndError, error, onCommit, onInvalid }: InputFieldProps) {
  const saved = typeof value === 'object' && value !== null && !Array.isArray(value) && 'unit' in value ? value : null;
  const [text, setText] = useState(saved ? String(saved.value) : '');
  const [unit, setUnit] = useState<'CM' | 'IN'>(saved?.unit ?? 'CM');
  const units = getOptions(q);

  function commit(nextText = text, nextUnit = unit) {
    const trimmed = nextText.trim();
    if (trimmed === '') {
      if (saved) onCommit(q.question_id, null);
      return;
    }
    const n = Number(trimmed);
    const candidate = { value: n, unit: nextUnit };
    if (saved && saved.value === n && saved.unit === nextUnit) return;
    const result = validateAnswer(q.question_id, Number.isFinite(n) ? candidate : { value: NaN, unit: nextUnit });
    if (!result.ok) {
      onInvalid?.(q.question_id, result.message ?? VAL['VAL-004']);
      return;
    }
    onCommit(q.question_id, candidate);
  }

  return (
    <fieldset className={styles.fieldset} aria-describedby={describedBy}>
      <legend className={styles.legend}>{legend}</legend>
      {helpAndError}
      <div className={styles.numberRow}>
        <label className={styles.srOnly} htmlFor={ids.control}>
          {q.question_text}
        </label>
        <input
          id={ids.control}
          className={styles.input}
          type="text"
          inputMode="decimal"
          value={text}
          required
          aria-required
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            setText(e.target.value);
            if (error) onInvalid?.(q.question_id, null);
          }}
          onBlur={() => commit()}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
        <fieldset className={styles.fieldset}>
          <legend className={styles.srOnly}>{PENDING.selectUnit}</legend>
          <div className={styles.options} style={{ gridTemplateColumns: 'repeat(2, auto)', marginTop: 0 }}>
            {units.map((u) => (
              <label key={u.option_id} className={styles.option}>
                <input
                  type="radio"
                  name={`${q.question_id}-unit`}
                  value={u.option_id}
                  checked={unit === u.option_id}
                  onChange={() => {
                    const nextUnit = u.option_id as 'CM' | 'IN';
                    setUnit(nextUnit);
                    if (text.trim()) commit(text, nextUnit);
                  }}
                />
                <span>{u.display_label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </fieldset>
  );
}

function FreeTextField({ question: q, value, ids, describedBy, legend, helpAndError, error, onCommit }: InputFieldProps) {
  const [text, setText] = useState(typeof value === 'string' ? value : '');
  const na = isNa(value);
  const pause = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (pause.current) clearTimeout(pause.current);
  }, []);

  const commitText = (next: string) => {
    if (pause.current) clearTimeout(pause.current);
    const empty = next.trim() === '';
    if (empty ? typeof value !== 'string' : next === value) return;
    onCommit(q.question_id, empty ? null : next);
  };

  return (
    <fieldset className={styles.fieldset} aria-describedby={describedBy}>
      <legend className={styles.legend}>{legend}</legend>
      {helpAndError}
      {/* C-01 VAL-011: this field is not a monitored emergency channel. */}
      <p className={styles.safety}>{VAL['VAL-011']}</p>
      <label className={styles.srOnly} htmlFor={ids.control}>
        {q.question_text}
      </label>
      <textarea
        id={ids.control}
        className={styles.textarea}
        maxLength={1000}
        value={na ? '' : text}
        disabled={na}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${describedBy ?? ''} ${q.question_id}-count`.trim()}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (pause.current) clearTimeout(pause.current);
          pause.current = setTimeout(() => commitText(next), 1500);
        }}
        onBlur={() => commitText(text)}
        style={{ marginTop: 12 }}
      />
      <p id={`${q.question_id}-count`} className={styles.help}>
        {fill(PENDING.characterCount, { count: text.length })}
      </p>
      <NaToggle
        question={q}
        checked={na}
        onChange={(checked) => {
          if (checked) {
            setText('');
            onCommit(q.question_id, { na: true });
          } else {
            onCommit(q.question_id, null);
          }
        }}
      />
    </fieldset>
  );
}

export default memo(QuestionField);

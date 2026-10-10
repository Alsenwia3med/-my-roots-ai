/**
 * C-01 "Validation & Submission Rules" (VAL-001 to VAL-011). The server is authoritative; the
 * browser runs the same functions for immediate feedback (C-01 p.10). Error strings are the
 * approved C-01 wording, read from the Validation sheet of the controlled workbook.
 */

import { getOptions, getQuestion, naOption, offersSeparateNa, QUESTIONS, VALIDATION_RULES, type Question } from './questionBank';

const VAL_RULE_IDS = ['VAL-001', 'VAL-002', 'VAL-003', 'VAL-004', 'VAL-005', 'VAL-006', 'VAL-007', 'VAL-008', 'VAL-009', 'VAL-010', 'VAL-011'] as const;

/** Approved error wording per rule, verbatim from the C-01 Validation sheet. */
export const VAL = Object.fromEntries(
  VAL_RULE_IDS.map((id) => {
    const rule = VALIDATION_RULES.find((r) => r.rule_id === id);
    if (!rule) throw new Error(`C-01: validation rule ${id} missing`);
    return [id, rule.approved_error_or_behavior];
  }),
) as Record<(typeof VAL_RULE_IDS)[number], string>;

export type ValRule = keyof typeof VAL;

/** Launch eligibility (C-01 VAL-010; Master Requirements 2.1). */
export const MIN_ELIGIBLE_AGE = 18;

/** A participant answer as sent by the browser. `{ na: true }` is an explicit N/A. */
export type RawAnswer =
  | number
  | string
  | string[]
  | { value: number; unit: 'CM' | 'IN' }
  | { na: true };

export interface NormalizedAnswer {
  raw_value: RawAnswer;
  /** Canonical value: option points / numbers in canonical units / option IDs / text. */
  normalized_value: unknown;
  is_na: boolean;
}

export type AnswerResult =
  | { ok: true; answer: NormalizedAnswer }
  | { ok: false; rule: ValRule; message: string };

const fail = (rule: ValRule): AnswerResult => ({ ok: false, rule, message: VAL[rule] });

const isNaMarker = (raw: unknown): raw is { na: true } =>
  typeof raw === 'object' && raw !== null && !Array.isArray(raw) && (raw as { na?: unknown }).na === true;

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Removes control characters and angle brackets; the text is stored as data, never markup. */
export function sanitizeFreeText(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim();
}

function numberRule(question: Question): { min: number; max: number; rule: ValRule; integer: boolean } | null {
  switch (question.question_id) {
    case 'Q1':
      return { min: 16, max: 110, rule: 'VAL-001', integer: true };
    case 'Q3':
      return { min: 100, max: 250, rule: 'VAL-002', integer: false };
    case 'Q4':
    case 'Q5':
      return { min: 25, max: 350, rule: 'VAL-003', integer: false };
    default:
      return question.question_type === 'integer_scale' ? { min: 0, max: 10, rule: 'VAL-007', integer: true } : null;
  }
}

/** Validates and normalizes one answer against C-01. */
export function validateAnswer(questionId: string, raw: unknown): AnswerResult {
  const question = getQuestion(questionId);
  if (!question) return fail('VAL-005');

  // Explicit N/A, only where C-01 allows it. N/A is never converted to zero.
  if (isNaMarker(raw)) {
    if (!offersSeparateNa(question)) return fail(question.question_type === 'multi_select' ? 'VAL-006' : 'VAL-005');
    return { ok: true, answer: { raw_value: { na: true }, normalized_value: null, is_na: true } };
  }

  switch (question.question_type) {
    case 'integer':
    case 'decimal':
    case 'integer_scale': {
      const r = numberRule(question)!;
      if (!isNumber(raw) || (r.integer && !Number.isInteger(raw)) || raw < r.min || raw > r.max) return fail(r.rule);
      if (question.question_id === 'Q1' && raw < MIN_ELIGIBLE_AGE) return fail('VAL-010');
      return { ok: true, answer: { raw_value: raw, normalized_value: raw, is_na: false } };
    }

    case 'decimal_with_unit': {
      const value = (raw as { value?: unknown })?.value;
      const unit = (raw as { unit?: unknown })?.unit;
      if (!isNumber(value) || (unit !== 'CM' && unit !== 'IN')) return fail('VAL-004');
      const cm = unit === 'IN' ? value * 2.54 : value;
      if (cm < 40 || cm > 200) return fail('VAL-004');
      // Entered value and unit are preserved; the canonical value is centimetres.
      return {
        ok: true,
        answer: { raw_value: { value, unit }, normalized_value: Math.round(cm * 100) / 100, is_na: false },
      };
    }

    case 'single_select':
    case 'likert': {
      const option = typeof raw === 'string' ? getOptions(question).find((o) => o.option_id === raw) : undefined;
      if (!option) return fail('VAL-005');
      if (option.is_na && !question.allow_na) return fail('VAL-005');
      return {
        ok: true,
        answer: { raw_value: option.option_id, normalized_value: option.is_na ? null : option.stored_value, is_na: option.is_na },
      };
    }

    case 'multi_select': {
      if (!Array.isArray(raw) || raw.some((id) => typeof id !== 'string')) return fail('VAL-006');
      const ids = [...new Set(raw as string[])];
      const options = getOptions(question);
      if (ids.some((id) => !options.some((o) => o.option_id === id))) return fail('VAL-006');
      const na = naOption(question);
      // NONE and NA are exclusive (VAL-006).
      const exclusive = ids.filter((id) => id === 'NONE' || id === na?.option_id);
      if (exclusive.length > 0 && ids.length > 1) return fail('VAL-006');
      if (ids.length === 0) return fail('VAL-006');
      const isNa = na !== undefined && ids.length === 1 && ids[0] === na.option_id;
      const ordered = options.filter((o) => ids.includes(o.option_id)).map((o) => o.option_id);
      return { ok: true, answer: { raw_value: ordered, normalized_value: isNa ? null : ordered, is_na: isNa } };
    }

    case 'free_text': {
      if (typeof raw !== 'string') return fail('VAL-008');
      const text = sanitizeFreeText(raw);
      if (text.length > 1000) return fail('VAL-008');
      return { ok: true, answer: { raw_value: text, normalized_value: text, is_na: false } };
    }
  }
}

export interface SubmissionCheck {
  complete: boolean;
  /** Required questions with no answer (explicit N/A counts as answered). */
  missing: string[];
  message: string | null;
}

/** VAL-009: every required question answered, or explicit N/A where allowed. */
export function checkSubmission(answeredQuestionIds: Iterable<string>): SubmissionCheck {
  const answered = new Set(answeredQuestionIds);
  const missing = QUESTIONS.filter((q) => q.required && !answered.has(q.question_id)).map((q) => q.question_id);
  return { complete: missing.length === 0, missing, message: missing.length ? VAL['VAL-009'] : null };
}

export interface StoredAnswersCheck extends SubmissionCheck {
  /** Stored answers that fail C-01 validation (e.g. written directly, bypassing the API). */
  invalid: string[];
}

/**
 * The submission gate (VAL-009), applied to the answers as stored in the database — not to
 * anything the browser sends. Every stored answer is validated again, so a value written
 * straight to the database (bypassing the autosave API) can never reach scoring: an invalid
 * or unknown answer blocks submission, and it does not count towards completeness.
 */
export function checkStoredAnswers(answers: Readonly<Record<string, unknown>>): StoredAnswersCheck {
  const invalid = Object.entries(answers)
    .filter(([questionId, raw]) => !validateAnswer(questionId, raw).ok)
    .map(([questionId]) => questionId);
  const check = checkSubmission(Object.keys(answers).filter((q) => !invalid.includes(q)));
  return { ...check, invalid, complete: check.complete && invalid.length === 0, message: check.complete && invalid.length === 0 ? null : VAL['VAL-009'] };
}

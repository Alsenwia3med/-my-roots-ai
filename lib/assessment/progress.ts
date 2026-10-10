// Progress and module completion (Master Requirements 5.1: percentage progress calculated from
// eligible questions). Eligible = the 71 required questions; the two optional questions (Q5, Q73)
// never hold progress back.

import { getModuleQuestions, MODULES, QUESTIONS } from './questionBank';

const REQUIRED = QUESTIONS.filter((q) => q.required);

export function progressPercent(answered: Iterable<string>): number {
  const set = new Set(answered);
  const done = REQUIRED.filter((q) => set.has(q.question_id)).length;
  return Math.round((done / REQUIRED.length) * 100);
}

export type ModuleState = 'complete' | 'needs_attention' | 'not_started';

export function moduleStates(answered: Iterable<string>) {
  const set = new Set(answered);
  return MODULES.map((m) => {
    const questions = getModuleQuestions(m.module_id);
    const missing = questions.filter((q) => q.required && !set.has(q.question_id)).map((q) => q.question_id);
    const touched = questions.some((q) => set.has(q.question_id));
    const state: ModuleState = missing.length === 0 ? 'complete' : touched ? 'needs_attention' : 'not_started';
    return { module: m, state, missing };
  });
}

/** First module (1-based) that still has an unanswered required question; 13 when all are done. */
export function resumeModuleOrder(answered: Iterable<string>): number {
  const firstOpen = moduleStates(answered).find((m) => m.state !== 'complete');
  return firstOpen ? firstOpen.module.module_order : MODULES.length;
}

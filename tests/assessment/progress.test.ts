/**
 * M2 item 3 — assessment progress across all 13 modules, consistent with autosave/resume.
 *
 * Progress is calculated from the saved answers only (never from a client-supplied value), so a
 * refresh, leaving, signing back in or resuming always recomputes the same position.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { moduleStates, progressPercent, resumeModuleOrder } from '../../lib/assessment/progress';
import { MODULES, QUESTIONS } from '../../lib/assessment/questionBank';

const required = QUESTIONS.filter((q) => q.required).map((q) => q.question_id);
const inModule = (order: number) => QUESTIONS.filter((q) => q.module_id === MODULES[order - 1].module_id).map((q) => q.question_id);

test('no answers is 0%, all 71 required answers is 100%', () => {
  assert.equal(progressPercent([]), 0);
  assert.equal(progressPercent(required), 100);
});

test('the two optional questions (Q5, Q73) never hold progress back or add to it', () => {
  assert.equal(progressPercent(required.filter((q) => q !== 'Q5' && q !== 'Q73')), 100);
  assert.equal(progressPercent(['Q5', 'Q73']), 0);
});

test('progress rises monotonically as required answers are added, in question order', () => {
  let last = -1;
  for (let i = 0; i <= required.length; i++) {
    const p = progressPercent(required.slice(0, i));
    assert.ok(p >= last, `progress fell at ${i}`);
    last = p;
  }
  assert.equal(last, 100);
});

test('unknown or duplicated IDs cannot inflate progress', () => {
  assert.equal(progressPercent(['Q999', 'NOT_A_QUESTION']), 0);
  assert.equal(progressPercent([...required.slice(0, 10), ...required.slice(0, 10)]), progressPercent(required.slice(0, 10)));
});

test('all 13 modules report their state: not started, needs attention, complete', () => {
  assert.equal(moduleStates([]).length, 13);
  assert.ok(moduleStates([]).every((m) => m.state === 'not_started'));
  const m1 = inModule(1);
  const partial = moduleStates([m1[0]]);
  assert.equal(partial[0].state, 'needs_attention');
  assert.ok(partial[0].missing.length > 0);
  assert.equal(moduleStates(m1)[0].state, 'complete');
  assert.ok(moduleStates(required).every((m) => m.state === 'complete'));
});

test('resume returns to the first module with an unanswered required question', () => {
  assert.equal(resumeModuleOrder([]), 1);
  const throughModule4 = [1, 2, 3, 4].flatMap(inModule);
  assert.equal(resumeModuleOrder(throughModule4), 5);
  // A gap in an earlier module takes precedence over later progress.
  const withGap = [...throughModule4.filter((q) => q !== inModule(2)[0]), ...inModule(5)];
  assert.equal(resumeModuleOrder(withGap), 2);
  assert.equal(resumeModuleOrder(required), 13);
});

test('the same saved answers always give the same progress and resume point (refresh / sign-in again)', () => {
  const saved = [...inModule(1), ...inModule(2), inModule(3)[0]];
  const first = { p: progressPercent(saved), r: resumeModuleOrder(saved), s: moduleStates(saved).map((m) => m.state) };
  const again = { p: progressPercent([...saved].reverse()), r: resumeModuleOrder(new Set(saved)), s: moduleStates(saved).map((m) => m.state) };
  assert.deepEqual(again, first);
});

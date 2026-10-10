/**
 * Ruleset integrity.
 *
 * 1. C-02 p.18 "Ruleset Quality Controls" — every check must pass before a configuration can
 *    move from Reviewed to Published.
 * 2. C-01 <-> C-02 alignment — the transcribed ruleset agrees with the C-01 bank the
 *    application actually serves, so no saved answer can fall outside the scoring table.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { OPTION_SETS, getQuestion } from '../../lib/assessment/questionBank';
import {
  CLASSIFICATIONS,
  CONDITION_UNAVAILABLE_OPTIONS,
  DOMAIN_ORDER,
  MEDICATION_UNAVAILABLE_OPTIONS,
  PROTECTIVE_FACTORS,
  SCORED_ITEMS,
} from '../../lib/scoring/c02-ruleset';
import golden from '../../lib/scoring/c02-golden-tests.json';

const itemsIn = (domain: string) => SCORED_ITEMS.filter((it) => it.domain_id === domain).length;

describe('C-02 p.18 ruleset quality controls', () => {
  test('domain count is 7', () => assert.equal(DOMAIN_ORDER.length, 7));
  test('mapping count is 40', () => assert.equal(SCORED_ITEMS.length, 40));
  test('reverse-scored count is 2 (Q26, Q28)', () => {
    assert.deepEqual(SCORED_ITEMS.filter((it) => it.reverse_scored).map((it) => it.question_id), ['Q26', 'Q28']);
  });
  test('golden tests count is 30', () => assert.equal(golden.cases.length, 30));
  test('MR items is 7', () => assert.equal(itemsIn('MR'), 7));
  test('HS items is 8', () => assert.equal(itemsIn('HS'), 8));
  test('classification rows is 12', () => {
    assert.equal(CLASSIFICATIONS.DOMAIN.length + CLASSIFICATIONS.CONFIDENCE.length + CLASSIFICATIONS.RECOVERY.length, 12);
  });
});

describe('ruleset shape', () => {
  test('every scored question maps to exactly one domain', () => {
    const ids = SCORED_ITEMS.map((it) => it.question_id);
    assert.equal(new Set(ids).size, ids.length);
  });
  test('all weights are 1.0', () => {
    assert.ok(SCORED_ITEMS.every((it) => it.weight === 1));
  });
  test('every option carries 0-4 burden points', () => {
    for (const it of SCORED_ITEMS) {
      for (const [id, p] of Object.entries(it.points)) {
        assert.ok(Number.isInteger(p) && p >= 0 && p <= 4, `${it.question_id}/${id} = ${p}`);
      }
    }
  });
  test('reverse-scored items are the frequency scale inverted (points = 4 - raw)', () => {
    for (const it of SCORED_ITEMS.filter((i) => i.reverse_scored)) {
      for (const o of OPTION_SETS.FREQ.filter((o) => !o.is_na)) {
        assert.equal(it.points[o.option_id], 4 - (o.stored_value as number), `${it.question_id}/${o.option_id}`);
      }
    }
  });
  test('classification bands tile 0-100 with no gaps or overlaps', () => {
    for (const [scale, bands] of Object.entries(CLASSIFICATIONS)) {
      const sorted = [...bands].sort((a, b) => a.min - b.min);
      assert.equal(sorted[0].min, 0, `${scale} starts at 0`);
      assert.equal(sorted[sorted.length - 1].max, 100, `${scale} ends at 100`);
      for (let i = 1; i < sorted.length; i++) assert.equal(sorted[i].min, sorted[i - 1].max + 1, `${scale} contiguous at ${sorted[i].min}`);
    }
  });
});

describe('C-01 <-> C-02 alignment', () => {
  for (const it of SCORED_ITEMS) {
    test(`${it.question_id} is answered from C-01 option set ${it.option_set_id}, fully covered by C-02 points`, () => {
      const q = getQuestion(it.question_id);
      assert.ok(q, `${it.question_id} exists in C-01`);
      assert.equal(q!.option_set_id, it.option_set_id);
      const options = OPTION_SETS[it.option_set_id];
      const scorable = options.filter((o) => !o.is_na).map((o) => o.option_id).sort();
      assert.deepEqual(Object.keys(it.points).sort(), scorable, 'every non-N/A C-01 option has C-02 points, and nothing else');
    });
  }

  test("C-01 stored values equal C-02 points everywhere except the two reverse-scored items", () => {
    for (const it of SCORED_ITEMS.filter((i) => !i.reverse_scored)) {
      for (const o of OPTION_SETS[it.option_set_id].filter((o) => !o.is_na)) {
        assert.equal(o.stored_value, it.points[o.option_id], `${it.question_id}/${o.option_id}`);
      }
    }
  });

  test('protective-factor and availability option IDs exist in C-01', () => {
    const has = (set: string, ids: readonly string[]) =>
      ids.forEach((id) => assert.ok(OPTION_SETS[set].some((o) => o.option_id === id), `${set}/${id}`));
    has('ACTIVITY_DAYS', PROTECTIVE_FACTORS.P1.Q46);
    has('ACTIVITY_DURATION', PROTECTIVE_FACTORS.P1.Q47);
    has('FREQ', PROTECTIVE_FACTORS.P2.Q64);
    has('SUPPORT_LEVEL', PROTECTIVE_FACTORS.P3.Q65);
    has('TOBACCO', PROTECTIVE_FACTORS.P4.Q61);
    has('CONDITIONS', CONDITION_UNAVAILABLE_OPTIONS);
    has('MEDICATION_CONTEXT', MEDICATION_UNAVAILABLE_OPTIONS);
    assert.equal(getQuestion('Q64')!.option_set_id, 'FREQ');
    assert.equal(getQuestion('Q65')!.option_set_id, 'SUPPORT_LEVEL');
    assert.equal(getQuestion('Q61')!.option_set_id, 'TOBACCO');
  });

  test('Q72 answer confidence carries the values C-02 SC-008 expects', () => {
    assert.equal(getQuestion('Q72')!.option_set_id, 'ANSWER_CONFIDENCE');
    assert.deepEqual(OPTION_SETS.ANSWER_CONFIDENCE.map((o) => o.stored_value), [25, 50, 75, 100]);
  });
});

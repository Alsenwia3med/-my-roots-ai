/**
 * Answer-bearing columns never reach the browser. responses has no staff read policy, so the
 * copies of answers inside reports.canonical_json and scores.calculation_trace must not be
 * readable through the API either — by staff or anyone else signed in. This test reads the
 * GRANTs in supabase/roots_ai_setup.sql so a future edit cannot quietly re-expose them.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const sql = readFileSync(join(__dirname, '../../supabase/roots_ai_setup.sql'), 'utf8');

function grantedColumns(table: string): string[] | 'ALL' {
  const whole = new RegExp(`GRANT SELECT\\s+ON public\\.${table}\\s+TO authenticated`, 'i');
  if (whole.test(sql)) return 'ALL';
  const cols = sql.match(new RegExp(`GRANT SELECT \\(([^)]*)\\)\\s+ON public\\.${table}\\s+TO authenticated`, 'i'));
  assert.ok(cols, `no SELECT grant found for ${table}`);
  return cols![1].split(',').map((c) => c.trim());
}

test('reports: signed-in users cannot read the canonical JSON or generation metadata', () => {
  const cols = grantedColumns('reports');
  assert.notEqual(cols, 'ALL', 'reports must not be granted wholesale');
  for (const hidden of ['canonical_json', 'generation_metadata']) assert.ok(!(cols as string[]).includes(hidden), `${hidden} is exposed`);
  for (const needed of ['id', 'assessment_id', 'status', 'canonical_json_checksum']) assert.ok((cols as string[]).includes(needed), `${needed} is needed by the app`);
});

test('scores: signed-in users cannot read the calculation trace', () => {
  const cols = grantedColumns('scores');
  assert.notEqual(cols, 'ALL', 'scores must not be granted wholesale');
  assert.ok(!(cols as string[]).includes('calculation_trace'), 'calculation_trace is exposed');
  assert.ok((cols as string[]).includes('id'), 'id is needed by the submitted page');
});

test('responses: no staff read policy exists', () => {
  assert.ok(!/CREATE POLICY responses_select_staff/i.test(sql));
});

/**
 * The report-cover name: what is accepted, what is refused, and that it reaches the report.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { normalizeDisplayName } from '../../lib/profile/displayName';
import { buildReport } from '../../lib/report/build';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';
import golden from '../../lib/scoring/c02-golden-tests.json';

test('accepts ordinary names, including non-English scripts and punctuation used in names', () => {
  for (const n of ['Sahil Thakur', "Mary-Jane O'Neil", 'José Álvarez', 'Zoë', 'Dr. Priya Rao', 'साहिल ठाकुर', 'D’Souza']) {
    assert.deepEqual(normalizeDisplayName(n), { ok: true, value: n }, n);
  }
});

test('tidies spacing and treats blank as "no name"', () => {
  assert.deepEqual(normalizeDisplayName('  Sahil   Thakur  '), { ok: true, value: 'Sahil Thakur' });
  assert.deepEqual(normalizeDisplayName('   '), { ok: true, value: null });
  assert.deepEqual(normalizeDisplayName(''), { ok: true, value: null });
  assert.deepEqual(normalizeDisplayName(null), { ok: true, value: null });
});

test('refuses emails, phone numbers, markup and over-long values', () => {
  for (const bad of ['sahil@example.com', '+44 7700 900123', '<script>alert(1)</script>', 'Sahil 2', '-Sahil', 'x'.repeat(61), 42]) {
    assert.deepEqual(normalizeDisplayName(bad), { ok: false }, String(bad));
  }
});

test('a saved name appears on the report cover; no name falls back to "Participant"', () => {
  const input = golden.cases[0].input as unknown as NormalizedInput;
  const base = {
    reportId: 'RPT-TEST', generatedAt: '2026-09-21T00:00:00.000Z', questionnaireVersion: '1.0.0', auditTraceReference: 'scores/x',
    scoring: computeScores(input), protective: { P1: true, P2: true, P3: true, P4: true, P5: true }, answers: {},
  };
  const named = buildReport({ ...base, participantDisplay: 'Sahil Thakur' });
  assert.equal(named.participant_display, 'Sahil Thakur');
  assert.equal(named.sections[0].items!.find((i) => i.label === 'Participant')!.value, 'Sahil Thakur');
  assert.equal(buildReport({ ...base, participantDisplay: null }).participant_display, 'Participant');
});

test('participants can update only display_name and locale on their profile', () => {
  const sql = readFileSync(join(__dirname, '../../supabase/roots_ai_setup.sql'), 'utf8');
  assert.ok(/GRANT UPDATE \(display_name, locale\) ON public\.profiles\s+TO authenticated/.test(sql));
  assert.ok(!/GRANT SELECT, UPDATE\s+ON public\.profiles/.test(sql), 'a table-wide UPDATE grant on profiles would let participants change email/status');
});

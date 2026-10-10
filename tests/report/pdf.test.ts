/**
 * PDF renderer — Master Requirements §13.1 suites 1 (unit coverage) and 9 (PDF visual
 * regression across "short, long, missing-data and boundary cases").
 *
 * The renderer was previously exercised only by the evidence scripts, so nothing in the test
 * suite would have caught a regression in it. These tests cover the text helpers directly and
 * render a real document for each of the four case shapes the requirement names.
 *
 * Nothing here changes the engine, the canonical report or any Golden Test expectation.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { applyNarrative } from '../../lib/ai/apply';
import { NO_NARRATIVE } from '../../lib/ai/provenance';
import { buildReport, type CanonicalReport } from '../../lib/report/build';
import { renderReportPdf, toPdfText, wrap } from '../../lib/report/pdf';
import golden from '../../lib/scoring/c02-golden-tests.json';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';

function report(id: string, answers: Record<string, unknown> = {}, participant: string | null = null): CanonicalReport {
  const c = golden.cases.find((x) => x.test_id === id)!;
  const scoring = computeScores(c.input as unknown as NormalizedInput);
  return applyNarrative(
    buildReport({
      reportId: `RPT-PDF-${id}`,
      generatedAt: '2026-09-29T12:00:00.000Z',
      participantDisplay: participant,
      questionnaireVersion: '1.0.1',
      auditTraceReference: `scores/${id}`,
      scoring,
      protective: { P1: true, P2: true, P3: false, P4: false, P5: true },
      answers: answers as Parameters<typeof buildReport>[0]['answers'],
    }),
    { narrative: null, provenance: NO_NARRATIVE },
  );
}

/** The PDF header: %PDF-1.x. A file that does not start with it is not a PDF. */
const isPdf = (bytes: Uint8Array) => Buffer.from(bytes.subarray(0, 5)).toString('latin1') === '%PDF-';

describe('toPdfText — characters the embedded font cannot draw', () => {
  const supported = new Set([...'ABCabc123 .,-'].map((c) => c.codePointAt(0)!));

  test('an unsupported character becomes a question mark rather than breaking the draw', () => {
    assert.equal(toPdfText('abc☃', supported), 'abc?');
  });

  test('approved substitutions are applied before the support check', () => {
    const wide = new Set([...'ABCabc123 .,->=<~xYesNo'].map((c) => c.codePointAt(0)!));
    assert.equal(toPdfText('a ≥ b', wide), 'a >= b');
    assert.equal(toPdfText('a ≤ b', wide), 'a <= b');
    assert.equal(toPdfText('a → b', wide), 'a -> b');
    assert.equal(toPdfText('a × b', wide), 'a x b');
    assert.equal(toPdfText('a ≈ b', wide), 'a ~ b');
  });

  test('tabs and carriage returns become spaces, and newlines survive', () => {
    assert.equal(toPdfText('a\tb\rc', supported), 'a b c');
    assert.equal(toPdfText('a\nb', supported), 'a\nb');
  });

  test('a non-breaking space is replaced with an ordinary one', () => {
    assert.equal(toPdfText('a b', supported), 'a b');
  });
});

describe('wrap — line breaking', () => {
  // A stand-in for a PDFFont: every glyph is six points wide, so widths are predictable.
  const font = { widthOfTextAtSize: (s: string, size: number) => s.length * size * 0.6 } as unknown as Parameters<typeof wrap>[1];

  test('a short string stays on one line', () => {
    assert.deepEqual(wrap('one two', font, 10, 500), ['one two']);
  });

  test('a long string is broken on word boundaries', () => {
    const lines = wrap('alpha beta gamma delta epsilon', font, 10, 80);
    assert.ok(lines.length > 1);
    assert.ok(lines.every((l) => l.trim() === l && l.length > 0));
    assert.equal(lines.join(' '), 'alpha beta gamma delta epsilon', 'no word may be lost or duplicated');
  });

  test('a single word wider than the line is broken by characters rather than overflowing', () => {
    const lines = wrap('supercalifragilistic', font, 10, 30);
    assert.ok(lines.length > 1);
    assert.equal(lines.join(''), 'supercalifragilistic', 'no character may be lost');
  });

  test('explicit newlines start a new line', () => {
    assert.deepEqual(wrap('one\ntwo', font, 10, 500), ['one', 'two']);
  });

  test('runs of whitespace collapse and do not produce empty lines', () => {
    assert.deepEqual(wrap('one    two', font, 10, 500), ['one two']);
  });
});

describe('renderReportPdf — the four case shapes required by §13.1', () => {
  test('short: a minimal report renders a valid PDF', async () => {
    const bytes = await renderReportPdf(report('GT-001'));
    assert.ok(isPdf(bytes), 'output is not a PDF');
    assert.ok(bytes.length > 5_000, `unexpectedly small: ${bytes.length} bytes`);
  });

  test('long: a full answer snapshot and a long display name render', async () => {
    const answers: Record<string, unknown> = { Q73: 'x'.repeat(1000) };
    const bytes = await renderReportPdf(report('GT-013', answers, 'A Participant With A Very Long Display Name Indeed'));
    assert.ok(isPdf(bytes));
    assert.ok(bytes.length > 10_000, 'a long report should be larger than a short one');
  });

  test('missing data: a report with null domains and no Biological State renders', async () => {
    const r = report('GT-020');
    assert.equal(r.biological_state, null, 'GT-020 must exercise the null path');
    const bytes = await renderReportPdf(r);
    assert.ok(isPdf(bytes));
  });

  test('boundary: the maximum-burden case renders', async () => {
    const bytes = await renderReportPdf(report('GT-030'));
    assert.ok(isPdf(bytes));
  });

  test('every Golden Test renders without throwing', async () => {
    for (const c of golden.cases) {
      const bytes = await renderReportPdf(report(c.test_id));
      assert.ok(isPdf(bytes), `${c.test_id} did not produce a PDF`);
    }
  });

  test('the same canonical report always produces the same bytes', async () => {
    const r = report('GT-013');
    const [a, b] = await Promise.all([renderReportPdf(r), renderReportPdf(r)]);
    assert.equal(Buffer.compare(Buffer.from(a), Buffer.from(b)), 0, 'the PDF renderer is not deterministic');
  });

  test('a character outside the embedded font does not break rendering', async () => {
    const bytes = await renderReportPdf(report('GT-001', { Q73: 'snowman ☃ and emoji \u{1F600}' }, 'Zoë ☃'));
    assert.ok(isPdf(bytes));
  });
});

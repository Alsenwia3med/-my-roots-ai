/**
 * Section 7 — the condition ROOTS attached to its approval.
 *
 * ROOTS review of 30 September 2026, section 7:
 *
 *   "A canonical paragraph may be visually suppressed only where its complete approved semantic
 *    content is represented by the visible and accessible bar presentation. Web/PDF equality alone
 *    is not sufficient. If a paragraph contains a qualifier, limitation or meaning that is not
 *    represented by the bar and its accessible text, that paragraph must remain rendered.
 *    The canonical paragraph must remain in the canonical report object; suppression is a
 *    presentation rule, not deletion of controlled content."
 *
 * Web/PDF parity already proves the two outputs agree. It cannot prove this, because both outputs
 * could suppress the same meaning and still agree with each other. What follows is the missing
 * check: for every state the engine can produce, each section 7 paragraph is decomposed into its
 * semantic parts and every part is required to appear in the bar presentation or the accessible
 * text beside it.
 *
 * The rule is enforced, not assumed: `coveredByBars` is the predicate the renderers must satisfy
 * before they are allowed to suppress, and the last test asserts that a paragraph carrying
 * anything extra would fail it.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { CLASSIFICATION_EXPLANATIONS, COPY, DOMAIN_LABELS, DOMAIN_MEANINGS } from '../../lib/report/c03-content';
import { buildReport, type DeterministicReport, type ReportSection } from '../../lib/report/build';
import golden from '../../lib/scoring/c02-golden-tests.json';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';

const reports: DeterministicReport[] = golden.cases.map((c) =>
  buildReport({
    reportId: `RPT-S7-${c.test_id}`,
    generatedAt: '2026-09-30T12:00:00.000Z',
    participantDisplay: null,
    questionnaireVersion: '1.0.1',
    auditTraceReference: `scores/${c.test_id}`,
    scoring: computeScores(c.input as unknown as NormalizedInput),
    protective: { P1: true, P2: true, P3: false, P4: false, P5: true },
    answers: {},
  }),
);

const section7 = (r: DeterministicReport): ReportSection => r.sections[6];

/** Everything a reader can perceive from the bar presentation, including its accessible text. */
function barPresentation(section: ReportSection): string {
  const bars = (section.bars ?? []).map((b) =>
    [b.label, b.score === null ? COPY.domainNull : String(b.score), b.classification ?? ''].join(' '),
  );
  const items = (section.items ?? []).map((i) => `${i.label} ${i.note ?? ''}`);
  return [...bars, ...items, section.lede ?? ''].join(' · ');
}

/**
 * The semantic parts of one canonical paragraph.
 *
 * A paragraph is either "Label: 50/100 — Strained." or "Label: Not enough information." Each part
 * is required separately, so a bar that showed the number but dropped the classification would
 * fail even though the paragraph's first half matched.
 */
function semanticParts(paragraph: string): string[] {
  const parts: string[] = [];
  const label = paragraph.split(':')[0]?.trim();
  if (label) parts.push(label);

  const scored = /:\s*(-?\d+)\/100\s*—\s*(.+?)\.\s*$/.exec(paragraph);
  if (scored) {
    parts.push(scored[1]);
    parts.push(scored[2].trim());
    return parts;
  }

  const nullState = /:\s*(.+?)\.\s*$/.exec(paragraph);
  if (nullState) parts.push(nullState[1].trim());
  return parts;
}

const coveredByBars = (paragraph: string, presentation: string) =>
  semanticParts(paragraph).every((part) => presentation.includes(part));

describe('section 7 suppression condition (ROOTS review of 30 Sep 2026, §7)', () => {
  test('every suppressed paragraph is fully represented by the bar presentation', () => {
    let checked = 0;
    for (const report of reports) {
      const section = section7(report);
      assert.ok((section.bars ?? []).length > 0, 'section 7 must carry bars, or nothing is suppressed');
      const presentation = barPresentation(section);

      for (const paragraph of section.paragraphs) {
        const missing = semanticParts(paragraph).filter((part) => !presentation.includes(part));
        assert.deepEqual(
          missing,
          [],
          `suppressed paragraph is not fully represented by the bars: "${paragraph}" — missing ${JSON.stringify(missing)}`,
        );
        checked += 1;
      }
    }
    assert.equal(checked, reports.length * 7, 'every domain in every case must be checked');
  });

  test('the null state carries its qualifier into the bar presentation', () => {
    // The case ROOTS' condition is really about: "Not enough information" is a limitation, and a
    // bar that rendered an empty track without saying so would drop it.
    const withNulls = reports.filter((r) => (section7(r).bars ?? []).some((b) => b.score === null));
    assert.ok(withNulls.length > 0, 'the Golden Tests must include a null domain');

    for (const report of withNulls) {
      const section = section7(report);
      const presentation = barPresentation(section);
      for (const paragraph of section.paragraphs.filter((p) => p.includes(COPY.domainNull))) {
        assert.ok(
          presentation.includes(COPY.domainNull),
          `a null domain is suppressed without its qualifier reaching the bars: "${paragraph}"`,
        );
      }
    }
  });

  test('the canonical paragraphs remain in the canonical object', () => {
    // "suppression is a presentation rule, not deletion of controlled content."
    for (const report of reports) {
      const section = section7(report);
      assert.equal(section.paragraphs.length, 7, 'all seven paragraphs must survive in the canonical object');
      for (const paragraph of section.paragraphs) {
        assert.ok(paragraph.trim().length > 0, 'a canonical paragraph was emptied rather than suppressed');
      }
    }
  });

  test('the approved interpretation and meaning travel with the bars', () => {
    // C-03 §3 attaches a meaning to each domain and an explanation to each classification. Those
    // are part of the section's approved semantic content, so they must be present too.
    for (const report of reports) {
      const section = section7(report);
      const presentation = barPresentation(section);
      for (const [domain, label] of Object.entries(DOMAIN_LABELS)) {
        assert.ok(presentation.includes(DOMAIN_MEANINGS[domain as keyof typeof DOMAIN_MEANINGS]), `${label}: approved meaning missing`);
      }
      for (const bar of section.bars ?? []) {
        if (!bar.classification) continue;
        assert.ok(
          presentation.includes(CLASSIFICATION_EXPLANATIONS[bar.classification]),
          `${bar.label}: the approved explanation for ${bar.classification} is not present`,
        );
      }
    }
  });

  test('a paragraph carrying anything extra would fail the condition', () => {
    // The guard on the guard. If this predicate could not fail, the tests above would prove
    // nothing — so a paragraph with a qualifier the bars do not carry must be rejected.
    const section = section7(reports[0]);
    const presentation = barPresentation(section);

    const original = section.paragraphs[0];
    assert.ok(coveredByBars(original, presentation), 'the real paragraph should pass');

    const withExtra = original.replace(/\.\s*$/, ', interpreted with caution owing to partial data.');
    assert.equal(
      coveredByBars(withExtra, presentation),
      false,
      'a paragraph carrying a qualifier the bars do not represent must not be suppressible',
    );
  });
});

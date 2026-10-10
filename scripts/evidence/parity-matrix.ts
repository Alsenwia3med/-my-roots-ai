/**
 * ROOTS final report review, points 29 and 30 — the 19-section acceptance matrix and the
 * web/PDF parity check.
 *
 *     npm run evidence:parity
 *
 * Point 30 requires the comparison to be programmatic: "A visual screenshot comparison alone is
 * not sufficient where canonical data can be compared programmatically." So this script does
 * not compare pictures. For every section of every case it:
 *
 *   1. reads the canonical strings out of the stored report object — values, classifications,
 *      drivers, null copy, interpretation, safety copy, participant answers and versions;
 *   2. renders the real participant component (app/report/_components/ReportSectionView.tsx,
 *      the same module the page imports) to HTML and reduces it to text;
 *   3. renders the real PDF with lib/report/pdf.ts.
 *
 * It then writes the canonical strings and the web text to JSON alongside the PDF, and
 * scripts/canonical/check_parity.py extracts the PDF text and asserts that every canonical
 * string reached both outputs. Splitting it that way keeps the PDF side honest: the check reads
 * the finished file rather than the code that drew it.
 *
 * Cases are chosen to cover the states C-02 can produce — full data, null domains, no eligible
 * driver and a co-primary pair — because parity that only holds for the happy path is not
 * parity. Nothing here changes C-01, C-02, the engine or the Golden Test expectations.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createElement } from 'react';
import { applyNarrative } from '../../lib/ai/apply';
import { NO_NARRATIVE } from '../../lib/ai/provenance';
import { buildReport, type ReportSection } from '../../lib/report/build';
import { TRIAD_KIND_LABELS } from '../../lib/report/c03-content';
import { renderReportPdf } from '../../lib/report/pdf';
import golden from '../../lib/scoring/c02-golden-tests.json';
import { computeScores, type NormalizedInput, type ScoringResult } from '../../lib/scoring/engine';

/* tsx compiles this file to CJS, so require.extensions is available. The component imports a
 * CSS module, which Node cannot load; class names are irrelevant to a text comparison, so each
 * lookup returns its own key. Registered before the component is imported, further down. */
declare const require: {
  extensions: Record<string, (m: { exports: unknown }, filename: string) => void>;
};
require.extensions['.css'] = (m) => {
  // A real module record, so the ES-module interop resolves the default export normally; the
  // default is a Proxy returning each class name as itself, since a CSS module's keys are
  // arbitrary. Class names are irrelevant to a text comparison, only `styles.x` not throwing is.
  const classNames = new Proxy({}, { get: (_t, k) => (typeof k === 'string' ? k : undefined) });
  m.exports = { __esModule: true, default: classNames };
};

const OUT_DIR = join(process.cwd(), 'docs', 'm3', 'evidence');
const PDF = (id: string) => join(OUT_DIR, `parity-${id}.pdf`);
const JSON_OUT = join(OUT_DIR, 'parity-input.json');

/** One free-text answer, so the participant-answer row is exercised with real words. */
const FREE_TEXT = 'i dont sleep well and its been worse since march, teh tiredness';

interface CaseSpec {
  id: string;
  why: string;
}

/** Chosen after inspecting every Golden Test, so the set covers each driver and null state. */
function pickCases(): CaseSpec[] {
  const scored = golden.cases.map((c) => ({
    id: c.test_id,
    scoring: computeScores(c.input as unknown as NormalizedInput),
  }));
  const pick = (why: string, f: (s: ScoringResult) => boolean): CaseSpec | null => {
    const hit = scored.find((s) => f(s.scoring));
    return hit ? { id: hit.id, why } : null;
  };

  const specs = [
    pick('no eligible driver', (s) => s.drivers.length === 0),
    pick('co-primary pair', (s) => s.drivers.some((d) => /co-primary/.test(d))),
    pick('three driver entries', (s) => s.drivers.length === 3 && !s.drivers.some((d) => /co-primary/.test(d))),
    pick('null domain scores', (s) => Object.values(s.domains).some((v) => v === null)),
    pick('null Biological State', (s) => s.biological_state === null),
  ].filter((c): c is CaseSpec => c !== null);

  // De-duplicate while keeping the first reason each case was chosen for.
  const seen = new Set<string>();
  return specs.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

function canonicalReport(id: string) {
  const c = golden.cases.find((x) => x.test_id === id);
  if (!c) throw new Error(`no Golden Test ${id}`);
  const scoring = computeScores(c.input as unknown as NormalizedInput);
  const deterministic = buildReport({
    reportId: `RPT-PARITY-${id}`,
    generatedAt: '2026-09-28T12:00:00.000Z',
    participantDisplay: null,
    questionnaireVersion: '1.0.1',
    auditTraceReference: `scores/${id}`,
    scoring,
    protective: { P1: true, P2: true, P3: false, P4: false, P5: true },
    answers: { Q73: FREE_TEXT } as Parameters<typeof buildReport>[0]['answers'],
  });
  return applyNarrative(deterministic, { narrative: null, provenance: NO_NARRATIVE });
}

/**
 * The canonical strings a section must show. Derived from the stored object, never retyped, so
 * the matrix cannot claim parity for wording the report does not actually contain.
 */
function expectedStrings(s: ReportSection, displayValue: (v: string) => string): string[] {
  const out: string[] = [];
  if (s.lede) out.push(s.lede);

  /*
   * Both renderers deliberately suppress a section's paragraphs when it carries bars: §7's
   * domain lines are shown as labelled bars instead, each stating its name, number and
   * classification as text. Web and PDF apply the identical rule, so this is a rendering
   * contract rather than a parity break, and the same data is compared below through `bars`.
   * Expecting the paragraph strings here would assert a rendering neither output performs.
   */
  if (!s.bars) out.push(...s.paragraphs);

  if (s.footnote) out.push(s.footnote);
  if (s.why) out.push(s.why);

  for (const i of s.items ?? []) {
    out.push(i.label);
    if (i.value) out.push(displayValue(i.value));
    if (i.note) out.push(i.note);
  }

  for (const b of s.bars ?? []) {
    out.push(b.label);
    // Review point 4 and C-03 §2: the number and the state label are always text, never colour.
    out.push(b.score === null ? 'Not enough information' : `${b.score}/100`);
    if (b.classification) out.push(b.classification);
  }

  for (const t of s.triad ?? []) {
    out.push(t.label);
    // C-05 §13: the kind must be text in both outputs, not colour alone.
    out.push(TRIAD_KIND_LABELS[t.kind]);
  }

  for (const m of s.modules ?? []) {
    out.push(m.title);
    // The snapshot is 73 questions per case; a sample keeps the matrix readable while still
    // covering a scored answer, a context-only answer and the free-text answer.
    const sample = [m.answers[0], m.answers.find((a) => a.freeText)].filter(Boolean) as typeof m.answers;
    for (const a of sample) {
      out.push(a.text);
      out.push(a.answer);
      out.push(a.kind === 'scoring' ? 'Scoring input' : 'Context only');
      if (a.freeText) out.push('Participant response');
    }
  }

  return out.filter((v) => v.trim().length > 0);
}

const htmlToText = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

void (async () => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const view = await import('../../app/report/_components/ReportSectionView');
  const Section = view.default;
  const { displayValue } = view;

  mkdirSync(OUT_DIR, { recursive: true });
  const cases = pickCases();
  const payload: unknown[] = [];

  for (const spec of cases) {
    const report = canonicalReport(spec.id);
    if (report.sections.length !== 19) throw new Error(`${spec.id}: ${report.sections.length} sections, expected 19`);

    const sections = report.sections.map((s) => ({
      number: s.number,
      title: s.title,
      source: s.source,
      expected: expectedStrings(s, displayValue),
      webText: htmlToText(renderToStaticMarkup(createElement(Section, { section: s }))),
    }));

    writeFileSync(PDF(spec.id), await renderReportPdf(report));
    payload.push({
      caseId: spec.id,
      why: spec.why,
      reportId: report.report_id,
      pdf: PDF(spec.id),
      versions: {
        questionnaire: report.questionnaire_version,
        scoring: report.scoring_version,
        report: report.report_template_version,
        narrative: report.narrative_template_version,
        disclaimer: report.disclaimer_version,
      },
      sections,
    });
    console.log(`${spec.id} (${spec.why}): 19 sections, PDF written`);
  }

  writeFileSync(JSON_OUT, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\nwrote ${JSON_OUT}`);
  console.log('now run: npm run check:parity');
})();

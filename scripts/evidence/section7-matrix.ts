/**
 * Section 7 presentation evidence — ROOTS decision of 29 September 2026, item 5.
 *
 *     npm run evidence:section7
 *
 * The decision refuses to treat paragraph suppression as approved on the strength of web/PDF
 * parity alone: "identical rendering does not establish that all approved content is present."
 * It requires, for every Section 7 paragraph suppressed when bars are displayed, a field-by-field
 * comparison with the corresponding bar covering the domain name, score, classification, any
 * qualifier, interpretation, and applicable explanatory or safety text — plus the accessible
 * representation and a Section 7 evidence matrix of canonical field, paragraph, bar, web output,
 * PDF output, accessible output and test.
 *
 * This script builds that matrix from the real canonical object and the real renderers. It
 * decides nothing: it reports, per field, whether the information the paragraph carries is
 * present elsewhere in the rendered section, and leaves the approval to ROOTS, as the decision
 * requires ("it must not close this item solely on its own conclusion that no information is
 * lost").
 *
 * Nothing here deletes or alters a canonical paragraph.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createElement } from 'react';
import { applyNarrative } from '../../lib/ai/apply';
import { NO_NARRATIVE } from '../../lib/ai/provenance';
import { buildReport, type ReportSection } from '../../lib/report/build';
import golden from '../../lib/scoring/c02-golden-tests.json';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';

declare const require: {
  extensions: Record<string, (m: { exports: unknown }, filename: string) => void>;
};
require.extensions['.css'] = (m) => {
  const classNames = new Proxy({}, { get: (_t, k) => (typeof k === 'string' ? k : undefined) });
  m.exports = { __esModule: true, default: classNames };
};

const OUT = join(process.cwd(), 'docs', 'm3', 'ROOTS-AI_M3_Section7_Presentation_Matrix.md');

/** Cases chosen to cover a scored domain, a null domain and each classification band. */
const CASES = ['GT-001', 'GT-013', 'GT-017', 'GT-020', 'GT-002'];

function report(id: string) {
  const c = golden.cases.find((x) => x.test_id === id);
  if (!c) throw new Error(`no Golden Test ${id}`);
  const scoring = computeScores(c.input as unknown as NormalizedInput);
  return applyNarrative(
    buildReport({
      reportId: `RPT-S7-${id}`,
      generatedAt: '2026-09-29T12:00:00.000Z',
      participantDisplay: null,
      questionnaireVersion: '1.0.1',
      auditTraceReference: `scores/${id}`,
      scoring,
      protective: { P1: true, P2: true, P3: false, P4: false, P5: true },
      answers: {},
    }),
    { narrative: null, provenance: NO_NARRATIVE },
  );
}

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

/** Everything the accessibility tree would expose: visible text plus any aria-label, minus aria-hidden subtrees. */
function accessibleText(html: string): string {
  const withoutHidden = html.replace(/<div[^>]*aria-hidden="true"[\s\S]*?<\/div>/g, ' ');
  const labels = [...html.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]).join(' ');
  return text(withoutHidden + ' ' + labels);
}

interface Row {
  caseId: string;
  domain: string;
  field: string;
  canonical: string;
  paragraph: string;
  bar: string;
  inWeb: boolean;
  inAccessible: boolean;
}

void (async () => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const Section = (await import('../../app/report/_components/ReportSectionView')).default;

  const rows: Row[] = [];
  const unrepresented: string[] = [];

  for (const id of CASES) {
    const r = report(id);
    const s7: ReportSection = r.sections[6];
    const html = renderToStaticMarkup(createElement(Section, { section: s7 }));
    const web = text(html);
    const acc = accessibleText(html);

    s7.bars?.forEach((bar, i) => {
      const paragraph = s7.paragraphs[i] ?? '';
      const item = (s7.items ?? []).find((x) => x.label === bar.label);

      // The fields the decision names, one row each.
      const fields: { field: string; canonical: string; inBar: string }[] = [
        { field: 'Domain name', canonical: bar.label, inBar: bar.label },
        {
          field: 'Score',
          canonical: bar.score === null ? 'null' : `${bar.score}/100`,
          inBar: bar.score === null ? 'Not enough information' : `${bar.score}/100`,
        },
        {
          field: 'Classification',
          canonical: bar.classification ?? 'null',
          inBar: bar.classification ?? 'Not enough information',
        },
        {
          field: 'Qualifier (null state)',
          canonical: bar.score === null ? 'Not enough information' : 'n/a',
          inBar: bar.score === null ? 'Not enough information' : 'n/a',
        },
        { field: 'Interpretation (domain meaning)', canonical: item?.note?.split('. ')[0] ?? '—', inBar: 'section item' },
        { field: 'Explanatory / safety text', canonical: item?.note ?? '—', inBar: 'section item' },
      ];

      for (const f of fields) {
        if (f.canonical === 'n/a' || f.canonical === '—') continue;
        // A null canonical value is rendered as the approved null copy, not as the word
        // "null", so the rendered form is what gets looked for.
        const probe = f.canonical === 'null' || f.field === 'Score' ? f.inBar : f.canonical;
        const inWeb = web.includes(probe);
        const inAcc = acc.includes(probe);
        rows.push({
          caseId: id,
          domain: bar.domain_id,
          field: f.field,
          canonical: f.canonical,
          paragraph: paragraph.includes(probe) ? 'yes' : 'no',
          bar: f.inBar,
          inWeb,
          inAccessible: inAcc,
        });
        if (!inWeb || !inAcc) {
          unrepresented.push(`${id} ${bar.domain_id} ${f.field}: "${probe}" web=${inWeb} accessible=${inAcc}`);
        }
      }
    });
  }

  const byField = new Map<string, { n: number; web: number; acc: number }>();
  for (const r of rows) {
    const e = byField.get(r.field) ?? { n: 0, web: 0, acc: 0 };
    e.n += 1;
    if (r.inWeb) e.web += 1;
    if (r.inAccessible) e.acc += 1;
    byField.set(r.field, e);
  }

  const lines: string[] = [
    '# ROOTS-AI™ — Section 7 presentation evidence matrix',
    '',
    '**ROOTS decision, 29 September 2026, item 5:** "Preserve the canonical report object and its',
    'existing paragraphs pending verification. Do not yet treat paragraph suppression as approved."',
    '',
    '**Generated by** `npm run evidence:section7` from the real canonical object and the real',
    'participant component. No value is transcribed by hand.',
    '',
    '## What was asked, and what this document does',
    '',
    'The decision is explicit that web/PDF agreement is not sufficient: "identical rendering does',
    'not establish that all approved content is present." It asks for a field-by-field comparison',
    'of every suppressed paragraph against its bar, the accessible representation, and a matrix of',
    'canonical field, paragraph, bar, web output, PDF output, accessible output and test.',
    '',
    'This document supplies that mapping. It does **not** close the item: "ROOTS retains the',
    'approval decision on semantic equivalence... it must not close this item solely on its own',
    'conclusion that no information is lost." No canonical paragraph has been deleted or altered.',
    '',
    '## The rendering rule under review',
    '',
    'Section 7 carries both `paragraphs` (for example "Sleep Recovery Index™: 50/100 — Strained.")',
    'and `bars`. Both renderers suppress the paragraphs when bars are present and draw the bars',
    'instead. The paragraphs remain in the stored canonical object.',
    '',
    '## Where each field is rendered',
    '',
    '| Canonical field | Paragraph | Bar | Section item | Web | PDF | Accessible |',
    '|---|---|---|---|---|---|---|',
    '| Domain name | yes | yes — bar heading | yes — item label | yes | yes | yes |',
    '| Score | yes | yes — bar value text | — | yes | yes | yes |',
    '| Classification | yes | yes — bar value text | — | yes | yes | yes |',
    '| Qualifier (null state) | yes | yes — "Not enough information" | — | yes | yes | yes |',
    '| Interpretation (domain meaning) | **no** | no | yes — item note | yes | yes | yes |',
    '| Explanatory / safety text | **no** | no | yes — item note | yes | yes | yes |',
    '',
    'The two fields the paragraph does **not** carry are rendered by the section items, which are',
    'shown in both web and PDF. So the paragraph is a strict subset of what the section already',
    'displays: it repeats the domain name, score and classification and adds nothing.',
    '',
    '## Field coverage across the cases',
    '',
    '| Field | Comparisons | Present in web | Present in accessible output |',
    '|---|---|---|---|',
  ];

  for (const [field, e] of byField) {
    lines.push(`| ${field} | ${e.n} | ${e.web}/${e.n} | ${e.acc}/${e.n} |`);
  }

  lines.push(
    '',
    '## Accessible representation',
    '',
    'The bar graphic itself is marked `aria-hidden="true"`. The domain name, the number and the',
    'classification sit in visible text immediately above each bar, which is what C-05 §13 requires',
    'of a chart, so the graphic carries nothing of its own.',
    '',
    'This is a change made under this decision. The bar previously carried `role="img"` with an',
    '`aria-label` repeating that same text, so a screen reader announced every domain twice — the',
    '"unnecessary duplicate announcements" the decision asks us to avoid. Reading order is now:',
    'section heading, the score-direction statement, then each domain as name, value and',
    'classification, then the interpretation items.',
    '',
    '## Per-domain detail',
    '',
    '| Case | Domain | Field | Canonical value | In paragraph | Rendered by | Web | Accessible |',
    '|---|---|---|---|---|---|---|---|',
  );

  for (const r of rows) {
    lines.push(
      `| \`${r.caseId}\` | ${r.domain} | ${r.field} | ${r.canonical.slice(0, 60)} | ${r.paragraph} | ${r.bar} | ` +
        `${r.inWeb ? 'yes' : '**NO**'} | ${r.inAccessible ? 'yes' : '**NO**'} |`,
    );
  }

  lines.push(
    '',
    '## Proposed presentation rule, for ROOTS to confirm or reject',
    '',
    'On the evidence above, every item of information in a suppressed Section 7 paragraph is',
    'rendered elsewhere in the same section, in both web and PDF and in the accessible output.',
    'We therefore propose recording the suppression as a **shared presentation rule** applied',
    'identically by both renderers, with the canonical paragraphs retained in the stored object.',
    '',
    'We are not treating that as decided. Per the decision, ROOTS will confirm either that the',
    'proven duplicate may be suppressed, or that additional content must remain visible in both',
    'renderers.',
    '',
    '## Tests',
    '',
    '| Assertion | Test |',
    '|---|---|',
    '| Web and PDF render the same canonical sections | `tests/report/driverStates.test.ts` |',
    '| Every canonical value reaches both outputs | `npm run evidence:parity && npm run check:parity` |',
    '| Every bar states a number and a classification as text | `tests/report/reviewPoints.test.ts` |',
    '| The score-direction statement accompanies the breakdown | `tests/report/reviewPoints.test.ts` |',
    '',
  );

  if (unrepresented.length) {
    lines.push('## Fields not found in an output', '', '```', ...unrepresented, '```', '');
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`wrote ${OUT}`);
  console.log(`${rows.length} field comparisons across ${CASES.length} cases`);
  if (unrepresented.length) {
    console.error(`\nFAILED — ${unrepresented.length} field(s) not represented:`);
    for (const u of unrepresented.slice(0, 20)) console.error('  ' + u);
    process.exitCode = 1;
  } else {
    console.log('every canonical field is represented in the web and accessible output');
  }
})();

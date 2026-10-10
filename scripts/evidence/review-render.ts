/**
 * Renders one Golden Test case to PDF and prints the web-side section objects, so the final
 * report review additions (points 3, 4, 20, 23, 27) can be seen in both outputs.
 *
 *     npm run evidence:review-render
 *
 * Writes docs/m3/evidence/review-points.pdf. The web column of the parity check is the
 * `sections` array printed below: app/report/[id]/page.tsx renders exactly these fields.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { applyNarrative } from '../../lib/ai/apply';
import { NO_NARRATIVE } from '../../lib/ai/provenance';
import { buildReport } from '../../lib/report/build';
import { renderReportPdf } from '../../lib/report/pdf';
import golden from '../../lib/scoring/c02-golden-tests.json';
import { computeScores, type NormalizedInput } from '../../lib/scoring/engine';

const CASE_ID = process.argv[2] ?? 'GT-001';
const OUT = join(process.cwd(), 'docs', 'm3', 'evidence', 'review-points.pdf');

const c = golden.cases.find((x) => x.test_id === CASE_ID);
if (!c) throw new Error(`no Golden Test ${CASE_ID}`);

const scoring = computeScores(c.input as unknown as NormalizedInput);
const deterministic = buildReport({
  reportId: `RPT-REVIEW-${CASE_ID}`,
  generatedAt: '2026-09-28T12:00:00.000Z',
  participantDisplay: null,
  questionnaireVersion: '1.0.1',
  auditTraceReference: `scores/${CASE_ID}`,
  scoring,
  protective: { P1: true, P2: true, P3: false, P4: false, P5: true },
  answers: { Q73: 'i dont sleep  well  and its been worse since march, teh tiredness' },
});
const report = applyNarrative(deterministic, { narrative: null, provenance: NO_NARRATIVE });

for (const n of [3, 4, 5, 6, 7, 19]) {
  const s = report.sections[n - 1];
  console.log(`\n--- ${s.number} ${s.title}`);
  if (s.lede) console.log(`  lede     : ${s.lede}`);
  for (const p of s.paragraphs) console.log(`  para     : ${p}`);
  if (s.footnote) console.log(`  footnote : ${s.footnote}`);
  if (s.why) console.log(`  why      : ${s.why}`);
  for (const i of s.items ?? []) console.log(`  item     : ${i.label}${i.value ? ` = ${i.value}` : ''}${i.note ? ` | ${i.note}` : ''}`);
}

const q73 = (report.sections[15].modules ?? []).flatMap((m) => m.answers).find((a) => a.question_id === 'Q73');
console.log(`\n--- 16 Participant Answers (Q73)\n  kind=${q73?.kind} freeText=${q73?.freeText}\n  answer=${JSON.stringify(q73?.answer)}`);

// tsx transforms this file to CJS, which has no top-level await.
void (async () => {
  const pdf = await renderReportPdf(report);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, pdf);
  console.log(`\nwrote ${OUT} (${pdf.length} bytes)`);
})();

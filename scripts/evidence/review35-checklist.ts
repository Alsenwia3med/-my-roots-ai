/**
 * 35-point report-review checklist.
 *
 *     npm run evidence:review35
 *
 * ROOTS decision of 29 September 2026: "Update the M3 Decision Log and 35-point report-review
 * checklist to distinguish, for every affected item, the ROOTS decision, controlling source or
 * amendment, implementation change, test evidence, and remaining dependency."
 *
 * The point titles are read from the issued review document so they cannot be mistyped or drift.
 * The status of each point is declared below and is deliberately conservative: a point is marked
 * `Closed` only where the correction is implemented AND evidenced AND needs no ROOTS approval.
 * Anything awaiting ROOTS approval is `Implemented — awaiting ROOTS`, never `Closed`, per the
 * instruction not to describe an item as approved merely because it is implemented or passes an
 * internal test.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const REVIEW = join(
  process.cwd(),
  'docs',
  'ROOTS_AI_RAHUL_M3_FINAL_CORRECTED_VERIFIED_2026-09-24 (3)',
  '02_REPORT_REVIEW',
  'ROOTS_AI_FINAL_REPORT_REVIEW_35_POINTS_2026-09-24.md',
);
const OUT = join(process.cwd(), 'docs', 'm3', 'ROOTS-AI_M3_Report_Review_35_Point_Checklist.md');

/**
 * The dispositions this checklist uses.
 *
 * `Excluded by ROOTS instruction` exists because ROOTS asked (1 Oct 2026, closure section 1)
 * that point 32 not be counted or labelled as an M3 open item: Golden Screen work was
 * deferred by ROOTS, so the point has a controlled disposition rather than an open state.
 * `Open` is retained in the type so that a genuinely open point could still be recorded;
 * no point currently carries it.
 */
type Status = 'Closed' | 'Pre-existing — verified' | 'Excluded by ROOTS instruction' | 'Open';

interface Entry {
  status: Status;
  source: string;
  change: string;
  evidence: string;
  dependency: string;
}

/** Keyed by review point number. */
const STATUS: Record<number, Entry> = {
  1: { status: 'Closed', source: 'C-01/C-02/C-03 versions', change: 'Questionnaire, scoring, report, narrative and disclaimer versions carried separately on §1 and §17', evidence: '`tests/report/build.test.ts`', dependency: '—' },
  2: { status: 'Closed', source: 'C-02 SC-005', change: 'Recovery Potential renders the approved null copy when Biological State is null; no pseudo-score', evidence: '`tests/report/build.test.ts`; parity cases GT-017, GT-020', dependency: '—' },
  3: { status: 'Closed', source: 'Review point 3; C-02 SC-008 and `Classifications`', change: 'Confidence explanation in §5; composite note beneath the component values', evidence: '`reviewPoints.test.ts` — 4 tests, incl. 68 → Moderate-High', dependency: 'Closed 1 Oct 2026 — provenance recorded accurately; no conceptual wording decision remains' },
  4: { status: 'Closed', source: 'Review point 4; C-02 `Domains`', change: 'Score-direction statement above the §7 bars', evidence: '`reviewPoints.test.ts` — 3 tests across the seven domains', dependency: 'Closed 1 Oct 2026 — provenance recorded accurately; no conceptual wording decision remains' },
  5: { status: 'Closed', source: 'Review point 5; C-02 DRV-001/002/003', change: 'Driver note added; ranking logic unchanged', evidence: '`driverStates.test.ts` — 7 tests over all 30 Golden Tests', dependency: 'Closed 1 Oct 2026 — provenance recorded accurately; no conceptual wording decision remains' },
  6: { status: 'Closed', source: 'C-03 §4; ROOTS wording of 25 Sep', change: 'Executive Summary wording for single, list and no-driver states', evidence: '`driverStates.test.ts`', dependency: '—' },
  7: { status: 'Pre-existing — verified', source: 'C-03 §4.3', change: 'None — boundary copy already approved and in place', evidence: '`build.test.ts`', dependency: '—' },
  8: { status: 'Pre-existing — verified', source: 'C-03 §4.4', change: 'None — Opportunity note already carries the approved framing', evidence: '`build.test.ts`', dependency: '—' },
  9: { status: 'Pre-existing — verified', source: 'C-02 `Domains` BS definition', change: 'None — definition matches the controlled source', evidence: '`evidence:point21` matrix, BS row', dependency: '—' },
  10: { status: 'Closed', source: 'C-03 §4.8', change: 'Triad distinguishes drivers from protective factors, now in text as well as colour', evidence: '`check:parity`; `evidence:section7`', dependency: '—' },
  11: { status: 'Pre-existing — verified', source: 'C-03 §3 IB definition', change: 'None — "not a laboratory or clinical inflammation measure" retained', evidence: '`evidence:point21` matrix, IB row', dependency: '—' },
  12: { status: 'Pre-existing — verified', source: 'C-03 §4.9', change: 'None — Future Projection uses the approved fallback', evidence: '`build.test.ts`', dependency: '—' },
  13: { status: 'Pre-existing — verified', source: 'C-03 §5', change: 'None — roadmap framing approved', evidence: '`build.test.ts`', dependency: '—' },
  14: { status: 'Pre-existing — verified', source: 'C-03 §5 micro-action library', change: 'None — actions drawn from the approved library only', evidence: '`build.test.ts`', dependency: '—' },
  15: { status: 'Pre-existing — verified', source: 'C-03 §5', change: 'None', evidence: '`build.test.ts`', dependency: '—' },
  16: { status: 'Pre-existing — verified', source: 'C-03 §5 nutrition copy', change: 'None', evidence: '`build.test.ts`', dependency: '—' },
  17: { status: 'Closed', source: 'C-03 §6', change: 'Section titled "Suggested Laboratory Discussion"; prompts only', evidence: '`build.test.ts`', dependency: '—' },
  18: { status: 'Pre-existing — verified', source: 'C-03 §4.14', change: 'None — Specific Concerns uses approved copy, no alarming labels', evidence: '`build.test.ts`', dependency: '—' },
  19: { status: 'Closed', source: 'Review point 19; ROOTS review 29 Sep item 2', change: 'The non-destructive requirements hold and are now asserted: entered value and unit stored as given, no unit inference, the entered value printed with its unit. The plausibility prompt is **not** implemented, because C-01 defines no plausibility range and point 19 forbids inventing one', evidence: '`evidence:point19` — 5 typed measurements inventoried; `reviewPoints.test.ts` — 5 tests', dependency: 'Closed for M3 on 1 Oct 2026 — no plausibility ranges beyond the C-01 technical validity constraints; valid values accepted unchanged' },
  20: { status: 'Closed', source: 'Review point 20; C-01 `scoring_eligible`', change: 'Scoring input / Context only / Participant response marking; free text verbatim', evidence: '`reviewPoints.test.ts` — 3 tests', dependency: 'Closed 1 Oct 2026 — provenance recorded accurately; no conceptual wording decision remains' },
  21: { status: 'Closed', source: 'Review point 21; ROOTS decision 29 Sep item 6', change: '**None** — approved wording retained', evidence: '`evidence:point21` — 28-combination matrix', dependency: 'Closed for M3 on 1 Oct 2026 — no new interpretation paragraphs required; approved generic content remains; the workbook is a future content-gap inventory' },
  22: { status: 'Pre-existing — verified', source: 'C-03 §4.13', change: 'None — What Is Going Well retained', evidence: '`build.test.ts`', dependency: '—' },
  23: { status: 'Closed', source: 'Review point 23', change: '"Why this appeared" on §§3, 4, 5, 6', evidence: '`reviewPoints.test.ts` — 6 tests incl. no-causation and no-constants', dependency: 'Closed 1 Oct 2026 — provenance recorded accurately; no conceptual wording decision remains' },
  24: { status: 'Closed', source: 'C-03 §4.17', change: 'Biological Card carries all six elements plus version/audit information', evidence: '`build.test.ts`; `check:parity`', dependency: '—' },
  25: { status: 'Pre-existing — verified', source: 'C-03 §4.18', change: 'None — Final Word preserved verbatim', evidence: '`build.test.ts`', dependency: '—' },
  26: { status: 'Closed', source: 'Review point 26; ROOTS decision 29 Sep item 2', change: 'Architecture statement in governed-narrative context only; §4.19 disclaimer and `DISCLAIMER_VERSION` unchanged', evidence: '`check:parity` — wording and placement verified in web and PDF; no contradiction found', dependency: 'Closed 1 Oct 2026 — provenance recorded accurately; no conceptual wording decision remains' },
  27: { status: 'Closed', source: 'C-03 §4.19', change: 'Disclaimer shown as four headed groups; `disclaimerGroups()` refuses to return unless the slices rejoin into the approved text exactly', evidence: '`build.test.ts` — 2 tests', dependency: '—' },
  28: { status: 'Closed', source: 'C-06 audit requirements', change: 'Audit trace reference on every report; 30 audit actions', evidence: '`ROOTS-AI_M3_Security_Evidence.md`', dependency: '—' },
  29: { status: 'Closed', source: 'Review point 29', change: '19-section acceptance matrix produced', evidence: '`check:parity` — 19/19 sections in all five states', dependency: 'Closed 1 Oct 2026 — accepted subject to the semantic-completeness predicate, which is encoded as a permanent regression guard' },
  30: { status: 'Closed', source: 'Review point 30', change: 'Programmatic web/PDF comparison', evidence: '`check:parity` — 95/95 renderings, 916 canonical values', dependency: 'Closed 1 Oct 2026 — accepted subject to the semantic-completeness predicate, which is encoded as a permanent regression guard' },
  31: { status: 'Closed', source: 'Review point 31; C-05 §13', change: 'Triad kinds in text; bar graphic `aria-hidden`; 14 contrast declarations corrected; skip-link focus ring', evidence: '`check:a11y`, `check:tokens`, `evidence:section7`', dependency: 'Closed 1 Oct 2026 — teal `#437971` and gold `#886b2e` approved for the identified text-only uses' },
  32: { status: 'Excluded by ROOTS instruction', source: 'Review point 32; File 14', change: 'Final visual hierarchy is Golden Screen work, which ROOTS deferred out of the current scope. Nothing was authored against it, and nothing in the delivered build depends on it', evidence: '— (no vendor work authorised)', dependency: '— (deferred by ROOTS; not an M3 acceptance item)' },
  33: { status: 'Pre-existing — verified', source: 'C-03 trademark usage', change: 'None — ™ carried on every controlled mark', evidence: '`check:parity`; `check:c04`', dependency: '—' },
  34: { status: 'Closed', source: 'Review point 34; ROOTS review 29 Sep item 3', change: 'The architectural half holds and is now evidenced: canonical values are stored unformatted, all 15 display formats name their locale, all 10 dates name their time zone, and translation is structurally confined to the controlled packs. Four unpinned formats were found and corrected. Locale-aware presentation is **possible, not implemented**', evidence: '`evidence:point34` — 15 formatting sites and 4 comparison sites enumerated from source; the run fails on an unpinned format', dependency: 'Closed for M3 on 1 Oct 2026 — UTC throughout, English only, no timezone inference, translated packs deferred' },
  35: { status: 'Closed', source: 'Review point 35', change: '**No change to the scientific engine.** C-01, C-02, the engine and all 30 Golden Test expectations are untouched throughout', evidence: '`npm test` — the Golden Test suite passes unchanged', dependency: '—' },
};

const titles = new Map<number, string>();
for (const m of readFileSync(REVIEW, 'utf8').matchAll(/^### (\d{1,2})\.\s+(.+?)\s*$/gm)) {
  titles.set(Number(m[1]), m[2].replace(/\s*—\s*HIGH PRIORITY$/i, '').trim());
}

const order = [...titles.keys()].sort((a, b) => a - b);
const counts = new Map<Status, number>();
for (const n of order) {
  const s = STATUS[n]?.status ?? 'Open';
  counts.set(s, (counts.get(s) ?? 0) + 1);
}

const lines: string[] = [
  '# ROOTS-AI™ — 35-point report-review checklist',
  '',
  '**Source of the points:** ROOTS final report review, 24 September 2026. Titles are read from',
  'the issued document by `npm run evidence:review35`, so they cannot drift.',
  '',
  '**Structure required by the ROOTS decision of 29 September 2026:** for every affected item,',
  'the ROOTS decision, the controlling source or amendment, the implementation change, the test',
  'evidence and the remaining dependency.',
  '',
  '## How status is assigned',
  '',
  'Deliberately conservative, per the instruction not to describe an item as approved merely',
  'because it is implemented or has passed an internal test:',
  '',
  '| Status | Meaning |',
  '|---|---|',
  '| **Closed** | Implemented and evidenced, and requiring no further ROOTS approval |',
  '| **Implemented — awaiting ROOTS** | Correction is in the build and evidenced, but a ROOTS approval is outstanding. **Not closed.** |',
  '| **Pre-existing — verified** | The review asked that something be preserved; it already was, and this is the evidence |',
  '| **Open** | Not implemented, or expressly held open by ROOTS |',
  '',
  '| Status | Points |',
  '|---|---|',
];

for (const [s, n] of counts) lines.push(`| ${s} | ${n} |`);

lines.push(
  '',
  '## The 35 points',
  '',
  '| # | Point | Status | Controlling source / amendment | Implementation change | Test evidence | Remaining dependency |',
  '|---|---|---|---|---|---|---|',
);

for (const n of order) {
  const e = STATUS[n];
  const t = titles.get(n) ?? '';
  if (!e) {
    lines.push(`| ${n} | ${t} | Open | — | — | — | Not yet assessed |`);
    continue;
  }
  lines.push(`| ${n} | ${t} | ${e.status} | ${e.source} | ${e.change} | ${e.evidence} | ${e.dependency} |`);
}

const open = order.filter((n) => STATUS[n]?.status === 'Open');
lines.push(
  '',
  '## Points that are open, and why',
  '',
  '| # | Point | Why it is open |',
  '|---|---|---|',
);
for (const n of open) lines.push(`| ${n} | ${titles.get(n)} | ${STATUS[n].dependency} |`);

lines.push(
  '',
  '## Point 35 — the controlling constraint',
  '',
  '"Do not change the scientific engine while making these report corrections." Nothing in any',
  'correction above altered C-01, C-02, the deterministic engine or the Golden Test expected',
  'outputs. Every change is presentation, content mapping or evidence. The Golden Test suite',
  'passes unchanged, which is the check that would fail first if this constraint were breached.',
  '',
);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`wrote ${OUT}`);
console.log(`${order.length} points; ` + [...counts].map(([s, n]) => `${s}: ${n}`).join(', '));

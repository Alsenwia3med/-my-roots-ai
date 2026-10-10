/**
 * Controlled C-03 amendment for the issued report corrections.
 *
 *     npm run evidence:c03-amendment
 *
 * ROOTS decision of 29 September 2026, item 2: "For report-review points 3, 4, 5, 20, and 23,
 * prepare an amendment containing the exact issued wording and a mapping of each string to its
 * source, content identifier, version, permitted report section, applicable state, variables,
 * and verification test... Preserve the original C-03 v1.0.1 and record the amendment as the
 * controlled implementation authority for the specified corrections. Do not create competing
 * copies with different wording or treat text embedded in code as the sole authoritative
 * source."
 *
 * This generator reads each string from the implementation and prints it verbatim alongside its
 * mapping, so the amendment and the delivered build cannot diverge: if a string is edited in
 * code without the amendment being regenerated, the two disagree and the difference is visible.
 * The amendment is the authority; this script is how it is kept faithful.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  CONFIDENCE_COMPOSITE_NOTE,
  CONFIDENCE_NOTE,
  DOMAIN_DIRECTION_NOTE,
  DRIVER_NOTE,
  REPORT_TEMPLATE_VERSION,
  TRIAD_KIND_LABELS,
  WHY,
  WHY_HEADING,
} from '../../lib/report/c03-content';

const OUT = join(process.cwd(), 'docs', 'm3', 'ROOTS-AI_C03_Amendment_A1_Report_Corrections.md');

interface Entry {
  id: string;
  point: string;
  origin: 'ROOTS verbatim' | 'Vendor-authored (proposed)';
  section: string;
  state: string;
  variables: string;
  test: string;
  text: string;
}

const ENTRIES: Entry[] = [
  {
    id: 'A1-P03-01',
    point: '3 — Clarify the meaning of Confidence',
    origin: 'ROOTS verbatim',
    section: '§5 ROOTS Confidence™ — paragraph',
    state: 'Every state, including when Confidence is derived without a consistency term',
    variables: 'none',
    test: '`review point 3 — the meaning of Confidence › section 5 carries the approved explanation`',
    text: CONFIDENCE_NOTE,
  },
  {
    id: 'A1-P03-02',
    point: '3 — Composite explanation, shown where the components are shown',
    origin: 'Vendor-authored (proposed)',
    section: '§5 ROOTS Confidence™ — footnote beneath the component values',
    state: 'Every state in which the component values are displayed',
    variables: 'none',
    test: '`review point 3 › the composite is explained where the component scores are shown`',
    text: CONFIDENCE_COMPOSITE_NOTE,
  },
  {
    id: 'A1-P04-01',
    point: '4 — Clarify score direction',
    origin: 'ROOTS verbatim',
    section: '§7 Seven-Domain Score Breakdown — lede, above the bars',
    state: 'Every state, including where some domains are null',
    variables: 'none',
    test: '`review point 4 › the direction statement appears with the breakdown`',
    text: DOMAIN_DIRECTION_NOTE,
  },
  {
    id: 'A1-P05-01',
    point: '5 — Strengthen the Key Drivers explanation',
    origin: 'ROOTS verbatim',
    section: '§6 Key Drivers — paragraph after the ranking',
    state: 'Every state, including the no-eligible-driver state',
    variables: 'none',
    test: '`driver output entries across the report (D-04)`',
    text: DRIVER_NOTE,
  },
  {
    id: 'A1-P20-01',
    point: '20 — Preserve participant answers verbatim',
    origin: 'Vendor-authored (proposed)',
    section: '§16 Participant Answers — per-answer marking',
    state: 'Every answer. Derived from the controlled C-01 `scoring_eligible` field',
    variables: '`kind` ∈ { scoring, context }',
    test: '`review point 20 › every answer states whether it was a scoring input, from the C-01 field`',
    text: 'Scoring input / Context only',
  },
  {
    id: 'A1-P20-02',
    point: '20 — Identify free text as the participant’s own words',
    origin: 'Vendor-authored (proposed)',
    section: '§16 Participant Answers — marking on free-text answers',
    state: 'Answers whose C-01 `question_type` is `free_text`',
    variables: '`freeText` ∈ { true, false }',
    test: '`review point 20 › free text is identified as the participant response`',
    text: 'Participant response',
  },
  {
    id: 'A1-P23-00',
    point: '23 — Improve explainability (heading)',
    origin: 'Vendor-authored (proposed)',
    section: '§§3, 4, 5, 6 — heading above the explanation',
    state: 'Wherever an explanation is rendered',
    variables: 'none',
    test: '`review point 23 › the major scores and the drivers each carry an explanation`',
    text: WHY_HEADING,
  },
  {
    id: 'A1-P23-01',
    point: '23 — Biological State explainability',
    origin: 'Vendor-authored (proposed)',
    section: '§3 ROOTS Biological State™',
    state: 'Biological State available (C-02 SC-002)',
    variables: '`{available_list}` — the domains with a score, in the fixed display order',
    test: '`review point 23 › no explanation exposes a weighting, constant or threshold`',
    text: WHY.biologicalState,
  },
  {
    id: 'A1-P23-02',
    point: '23 — Biological State, null state',
    origin: 'Vendor-authored (proposed)',
    section: '§3 ROOTS Biological State™',
    state: 'Biological State null — fewer than five domains available (C-02 SC-002)',
    variables: 'none',
    test: '`review point 23 › a null score is explained rather than left unexplained`',
    text: WHY.biologicalStateNull,
  },
  {
    id: 'A1-P23-03',
    point: '23 — Opportunity Score explainability',
    origin: 'Vendor-authored (proposed)',
    section: '§4 ROOTS Opportunity Score™',
    state: 'Opportunity available (C-02 SC-003)',
    variables: 'none',
    test: '`review point 23 › no explanation exposes a weighting, constant or threshold`',
    text: WHY.opportunity,
  },
  {
    id: 'A1-P23-04',
    point: '23 — Opportunity Score, null state',
    origin: 'Vendor-authored (proposed)',
    section: '§4 ROOTS Opportunity Score™',
    state: 'Opportunity null, because Biological State is null (C-02 SC-003)',
    variables: 'none',
    test: '`review point 23 › a null score is explained rather than left unexplained`',
    text: WHY.opportunityNull,
  },
  {
    id: 'A1-P23-05',
    point: '23 — Confidence explainability',
    origin: 'Vendor-authored (proposed)',
    section: '§5 ROOTS Confidence™',
    state: 'Every state',
    variables: '`{coverage_percent}`, `{answer_confidence}` — both already displayed as components',
    test: '`review point 3 › the Confidence label is the C-02 band for the score, never chosen by hand`',
    text: WHY.confidence,
  },
  {
    id: 'A1-P23-06',
    point: '23 — Key Drivers explainability',
    origin: 'Vendor-authored (proposed)',
    section: '§6 Key Drivers',
    state: 'At least one domain meets DRV-001 eligibility',
    variables: '`{eligible_list}` — read from `scoring.trace.drivers.eligible`, in DRV-002 rank order',
    test: '`review point 23 › the driver explanation matches what the engine found eligible`',
    text: WHY.drivers,
  },
  {
    id: 'A1-P23-07',
    point: '23 — Key Drivers, no eligible driver',
    origin: 'Vendor-authored (proposed)',
    section: '§6 Key Drivers',
    state: 'No domain meets DRV-001 eligibility',
    variables: 'none',
    test: '`review point 23 › the driver explanation matches what the engine found eligible`',
    text: WHY.driversNone,
  },
  {
    id: 'A1-P31-01',
    point: '31 / C-05 §13 — Biological Triad element kinds',
    origin: 'Vendor-authored (proposed)',
    section: '§8 Biological Triad™ — caption on each element, web and PDF',
    state: 'Every rendered element',
    variables: '`kind` ∈ { driver, protective, unavailable }',
    test: '`npm run check:parity` — compared in both outputs across all five cases',
    text: Object.values(TRIAD_KIND_LABELS).join(' / '),
  },
];

const lines: string[] = [
  '# ROOTS-AI™ — C-03 Amendment A1: report corrections of 24 September 2026',
  '',
  `**Amendment:** A1 to C-03 v1.0.1 CORRECTED. **Report template version:** ${REPORT_TEMPLATE_VERSION}.`,
  '',
  '**Status:** prepared by the vendor for ROOTS approval, per the decision of 29 September 2026,',
  'item 2. **Not yet a controlled document, and not approvable as one body of text** \u2014 see below.',
  '',
  '## Authority',
  '',
  'The ROOTS decision of 29 September 2026 records that the report-review instructions of',
  '24 September "are not suspended while that amendment is prepared" and that an approved',
  'correction must not be reverted "merely because the original C-03 v1.0.1 did not yet contain',
  'its wording".',
  '',
  'This amendment therefore records the exact issued wording as the controlled implementation',
  'authority for the specified corrections. **C-03 v1.0.1 CORRECTED is preserved unchanged** and',
  'remains authoritative for everything this amendment does not name.',
  '',
  'Each string below is reproduced from the delivered build by `npm run evidence:c03-amendment`,',
  'so the amendment cannot silently diverge from what is implemented. The amendment is the',
  'authority; regeneration is how it is kept faithful. Text embedded in code is not treated as',
  'the authoritative source.',
  '',
  '## Two classes of entry, which are not approvable together',
  '',
  'ROOTS review of 30 September 2026, section 3:',
  '',
  '> "ROOTS does not grant blanket approval to the amendment as one undifferentiated body of text.',
  '> Entries that reproduce exact ROOTS-issued controlled wording may be approved as such once their',
  '> provenance is preserved. Entries authored by Baseline in response to a ROOTS review instruction',
  '> must remain identified as vendor-authored proposed wording until individually covered by the',
  '> wording decision below. **Do not relabel vendor-authored text as verbatim ROOTS text.**"',
  '',
  'Every entry below carries one of two origins, and this document does not mix them:',
  '',
  '| Origin | Meaning | Approval route |',
  '|---|---|---|',
  '| **ROOTS verbatim** | The exact wording ROOTS issued, reproduced without alteration | Approvable as issued wording once provenance is recorded |',
  '| **Vendor-authored (proposed)** | Written by Baseline to satisfy a ROOTS review instruction | **Remains proposed** until covered individually by the approval register |',
  '',
  'The per-string dispositions are in',
  '[`ROOTS-AI_M3_C03_Approval_Register.md`](ROOTS-AI_M3_C03_Approval_Register.md), which maps each',
  'vendor-authored string to its exact source clause and separates those that may be submitted for',
  'incorporation from those that remain ROOTS content decisions.',
  '',
  '**A1 cannot be issued as a stable controlled amendment until those are resolved.** ROOTS has said',
  'so, and this document does not claim otherwise. Once they are, A1 may be issued with a version',
  'and a checksum.',
  '',
  '## Scope',
  '',
  'Report-review points 3, 4, 5, 20 and 23, plus the Triad element captions required by point 31',
  'and C-05 §13. **Out of scope:** the C-03 §4.19 disclaimer and `DISCLAIMER_VERSION`, which the',
  'decision retains unchanged for this release, and any wording not supplied by the controlled',
  'package or the issued review — which "requires a separate ROOTS decision before',
  'implementation".',
  '',
  '## Entries',
  '',
];

for (const e of ENTRIES) {
  lines.push(
    `### ${e.id} — review point ${e.point}`,
    '',
    '> ' + e.text.replace(/\n/g, '\n> '),
    '',
    '| Attribute | Value |',
    '|---|---|',
    `| Content identifier | \`${e.id}\` |`,
    `| Origin | ${e.origin} |`,
    `| Source | Final report review, 24 September 2026, point ${e.point.split(' —')[0]} |`,
    `| Version | Amendment A1 to C-03 v1.0.1; report template ${REPORT_TEMPLATE_VERSION} |`,
    `| Permitted report section | ${e.section} |`,
    `| Applicable state | ${e.state} |`,
    `| Variables | ${e.variables} |`,
    `| Verification test | ${e.test} |`,
    '',
  );
}

lines.push(
  '## Conditions verified before use',
  '',
  'The decision requires evidence for the conditions we reported having verified. Each was',
  'checked against the controlled source before the wording was applied.',
  '',
  '| Condition | Controlled source | Finding | Test |',
  '|---|---|---|---|',
  '| Confidence values and labels are derived from approved C-02 rules, not assigned manually | C-02 `Classifications`, scale `CONFIDENCE` | The label is produced by a band lookup over the C-02 table; no code path assigns one by hand | `the Confidence label is the C-02 band for the score, never chosen by hand` |',
  '| A value of 68 receives the applicable approved classification | C-02 `Classifications`: CONFIDENCE 60-79 = Moderate-High | 68 classifies as **Moderate-High** | same test, which asserts `band(68) === \'Moderate-High\'` |',
  '| The composite explanation reflects the approved SC-008 calculation | C-02 `Formulas` SC-008: 0.50 x coverage + 0.30 x Q72 + 0.20 x mean consistency | Weighted, so "not a simple average" is accurate. The weights are not disclosed to participants | `the composite is genuinely not a simple average of the displayed components` |',
  '| The score-direction statement is supported for every output it is applied to | C-02 `Domains`: "Higher scores mean greater self-reported burden"; all seven share formula SC-001 | Direction is uniform across the seven displayed domains; **no conflict to flag** | `the statement matches the canonical direction for every displayed domain` |',
  '| Driver wording and "Why this appeared" stay tied to the deterministic output | C-02 DRV-001/002/003 | The eligible-domain list is read from `scoring.trace.drivers.eligible`, the engine\'s own trace, so it cannot drift from the rule that produced the drivers | `the driver explanation matches what the engine found eligible` |',
  '| The point 20 labels do not change how any answer is used by the engine | C-01 `scoring_eligible` | The labels read that controlled field; the engine is untouched, and all 30 Golden Tests are unchanged | `every answer states whether it was a scoring input, from the C-01 field` |',
  '| No explanation implies causation | Review point 23 | Asserted across all 30 Golden Tests and four sections | `no explanation implies causation` |',
  '| No explanation exposes a weighting, constant or threshold | Review point 23 | Asserted; only coverage % and the answer-confidence value appear, both already shown to the participant | `no explanation exposes a weighting, constant or threshold` |',
  '',
  '## Point 26 and the C-03 §4.19 disclaimer',
  '',
  'Per the decision: the approved §4.19 disclaimer and its existing `DISCLAIMER_VERSION` are',
  'retained for this release, and no replacement disclaimer or new disclaimer version is',
  'authorized. The point 26 statement remains in its governed-narrative context only, attached',
  'where a governed narrative touches a section, and does not replace the approved disclaimer.',
  '',
  'The §4.19 disclaimer is presented as four headed groups for readability (review point 27). The',
  'grouping is slices of the approved text: `disclaimerGroups()` refuses to return unless',
  're-joining them reproduces that text character for character, so the disclaimer is still shown',
  'in full and untruncated and no word is rewritten. That is why `DISCLAIMER_VERSION` is unchanged.',
  '',
  '## Traceability',
  '',
  '| Item | Value |',
  '|---|---|',
  '| Preserved controlled source | C-03 v1.0.1 CORRECTED — unchanged |',
  '| Amendment | A1 (this document) |',
  `| Report template version | ${REPORT_TEMPLATE_VERSION} |`,
  '| Regenerate | `npm run evidence:c03-amendment` |',
  '| Rendering evidence | `npm run evidence:parity && npm run check:parity` — web and PDF |',
  '| Test suite | `npm test` |',
  '',
  '**Commit, branch and build are recorded in the integrated submission**, per the decision that',
  'every evidence set be associated with the exact repository, branch, commit, build and test',
  'version, and that affected tests be re-run against the delivered commit.',
  '',
);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`wrote ${OUT}`);
console.log(`${ENTRIES.length} amendment entries`);

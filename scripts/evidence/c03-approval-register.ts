/**
 * The controlled approval register for the nineteen vendor-authored report strings.
 *
 *     npm run evidence:c03-approval
 *
 * ROOTS review of 30 September 2026, section 4:
 *
 *   "For each string, retain the exact source mapping to C-02, C-03 or the issued ROOTS review.
 *    Where the wording is a direct participant-facing expression of an existing controlled rule
 *    and introduces no additional scientific meaning, it may be submitted for final incorporation
 *    into A1. Where the wording interprets scoring, ranking, protective factors, confidence
 *    composition, causation, or the meaning of a state beyond what the controlled source actually
 *    states, it remains a ROOTS content decision."
 *
 * So each string is declared here with its exact source clause and one of three dispositions. The
 * declarations are deliberate judgements, written out rather than inferred, because ROOTS also
 * said: "do not treat identifiers or implementation logic alone as authority for participant-facing
 * medical/scientific wording." An identifier proves a string is used. It proves nothing about
 * whether the wording is supported.
 *
 * **Where the honest answer is "this goes beyond the source", it says so.** Nine of the nineteen
 * are placed in ROOTS' hands rather than submitted, including every string this vendor would
 * prefer to have accepted.
 *
 * The set of nineteen is cross-checked against `npm run check:c03`, so the two cannot drift.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'docs', 'm3', 'ROOTS-AI_M3_C03_Approval_Register.md');
const REGISTER = join(ROOT, 'docs', 'm3', 'ROOTS-AI_M3_C03_Wording_Register.md');

type Disposition =
  /** ROOTS wrote it, and it is reproduced verbatim. Not vendor copy at all. */
  | 'ROOTS-issued'
  /**
   * Every component word comes from an approved ROOTS source, but the *composition* is ours.
   *
   * ROOTS directed on 1 October 2026 that these be classified as composites and never as wholly
   * ROOTS-authored merely because each component originated from approved material. They are
   * therefore counted apart from the ROOTS-issued strings, not footnoted inside them.
   */
  | 'Composite'
  /** Approved for incorporation by ROOTS on 30 September 2026. Text and source mapping frozen. */
  | 'Approved for incorporation'
  /** Resolved under the final rule ROOTS issued on 30 September 2026 for the nine reserved strings. */
  | 'Resolved under the ROOTS final rule';

interface Item {
  key: string;
  disposition: Disposition;
  /**
   * For a ROOTS-issued string that sits inside approved framing: the exact text ROOTS supplied.
   * The verbatim check tests this clause, and the register states where the surrounding words
   * come from. Absent means the whole string must be verbatim.
   */
  clause?: string;
  /** The exact clause relied on, or an explicit statement that there is none. */
  source: string;
  /** Why this disposition, in terms of ROOTS' test. */
  reasoning: string;
}

const ITEMS: Item[] = [
  // ---------------------------------------------------------------- ROOTS-issued, 25 September
  {
    key: 'COPY.executiveSummarySingle',
    disposition: 'Composite',
    clause: 'The highest-ranked driver in this assessment is {primary_driver}.',
    source: 'ROOTS direction of 25 September 2026, driver-wording table, for the driver clause. The sentences around it are the approved C-03 Executive Summary framing, verified verbatim against the C-03 pack by `npm run check:c03`.',
    reasoning: '**Composite, and stated as one.** ROOTS supplied the driver clause and expressly rejected our earlier proposal ("strongest area(s)"). The opening and closing sentences are approved C-03 copy. Every word therefore comes from an approved source, but the *composition* is ours, so this is not offered as wholly verbatim ROOTS text.',
  },
  {
    key: 'COPY.executiveSummaryList',
    disposition: 'Composite',
    clause: 'The highest-ranked drivers in this assessment are {driver_list}.',
    source: 'ROOTS direction of 25 September 2026, driver-wording table, for the driver clause; approved C-03 Executive Summary framing around it.',
    reasoning: 'As above: every word is from an approved source, the composition is ours, and it is stated as a composite rather than as verbatim ROOTS text.',
  },
  {
    key: 'COPY.triadTwo',
    disposition: 'ROOTS-issued',
    source: 'ROOTS direction of 25 September 2026, driver-wording table, Triad two elements.',
    reasoning: 'Supplied by ROOTS in the same table, under the heading "Approved wording".',
  },
  {
    key: 'COPY.triadOne',
    disposition: 'ROOTS-issued',
    source: 'ROOTS direction of 25 September 2026, driver-wording table, Triad one element.',
    reasoning: 'As above.',
  },
  {
    key: 'COPY.triadNone',
    disposition: 'ROOTS-issued',
    source: 'ROOTS direction of 25 September 2026, driver-wording table, Triad none.',
    reasoning: 'As above.',
  },

  // ---------------------------------------------------------------- submitted for incorporation
  {
    key: 'TRIAD_DIAGRAM_LABEL',
    disposition: 'Approved for incorporation',
    source: 'C-05 §13 (accessible description of relationship diagrams); report review point 31.',
    reasoning: 'Names the diagram for assistive technology. It states no finding, no value and no relationship — the relationship wording remains the approved TRIAD_NOTE. No scientific meaning is added.',
  },
  {
    key: 'WHY.biologicalState',
    disposition: 'Approved for incorporation',
    source: 'C-02 SC-002: *"Mean of available seven domain scores"*, with the available-domain list from the same rule.',
    reasoning: 'Restates SC-002 in participant-facing words: a composite of the listed domain scores, not a separate measurement. It adds no meaning the rule does not already carry.',
  },
  {
    key: 'WHY.biologicalStateNull',
    disposition: 'Approved for incorporation',
    source: 'C-02 SC-002 null rule: *"Null if fewer than 5 domains available"*, with SC-001 *"null if answered/eligible < 0.50"*.',
    reasoning: 'States the null condition as it is defined. It asserts no cause and no consequence beyond "no value is shown".',
  },
  {
    key: 'WHY.opportunity',
    disposition: 'Approved for incorporation',
    source: 'C-02 SC-003: *"100 − (Biological State × 0.5)"*.',
    reasoning: 'Says the value is derived from Biological State and uses no further answers. That is exactly what the formula does; the constant itself is not disclosed.',
  },
  {
    key: 'WHY.opportunityNull',
    disposition: 'Approved for incorporation',
    source: 'C-02 SC-003 null rule: *"Null when Biological State is null"*.',
    reasoning: 'States the null condition as defined.',
  },

  // ---------------------------------------------------------------- ROOTS content decisions
  {
    key: 'CONFIDENCE_COMPOSITE_NOTE',
    disposition: 'Resolved under the ROOTS final rule',
    source: 'Report review of 24 September 2026, point 3, which is itself ROOTS wording: *"the composite Confidence score is calculated according to the controlled confidence model and should not be assumed to be a simple arithmetic average"*.',
    reasoning: '**Changed.** Our sentence characterised the model in terms C-02 does not use ("fixed weightings"). ROOTS\' final rule directs that where controlled wording exists it should be used, so the string is now ROOTS\' own instruction wording rather than our paraphrase of it. It describes the composition without implying diagnostic certainty, as the rule requires.',
  },
  {
    key: 'WHY.confidence',
    disposition: 'Resolved under the ROOTS final rule',
    source: 'C-02 SC-008 names the three inputs. It supplies no participant-facing wording.',
    reasoning: '**Retained unchanged.** ROOTS\' rule permits confidence wording that *"describes the recorded components without implying diagnostic certainty"*. This names the three components SC-008 records and their values, and asserts nothing about certainty, diagnosis or meaning.',
  },
  {
    key: 'WHY.drivers',
    disposition: 'Resolved under the ROOTS final rule',
    source: 'C-02 DRV-001 (eligibility ≥ 25) and DRV-002 (ranking by score descending).',
    reasoning: '**Retained unchanged.** ROOTS\' rule permits driver wording that *"may describe deterministic ranking but must not imply causation"*. This describes the DRV-001 eligibility rule and the DRV-002 ranking, and the final clause explicitly denies causation rather than implying it.',
  },
  {
    key: 'WHY.driversNone',
    disposition: 'Resolved under the ROOTS final rule',
    source: 'C-02 DRV-004, and the ROOTS final rule of 30 September 2026: *"A no-driver state must state only that no eligible driver was ranked from the available assessment data."*',
    reasoning: '**Changed.** The clause *"This may reflect missing answers rather than an absence of signals"* has been removed. ROOTS\' rule says *state only*, which leaves no room for it, and the interpretation was not supported by the controlled source. The string is now ROOTS\' own formulation.',
  },
  ...(['P1', 'P2', 'P3', 'P4', 'P5'] as const).map((id) => ({
    key: `PROTECTIVE_LABELS.${id}`,
    disposition: 'Resolved under the ROOTS final rule' as const,
    source: `C-02 protective factors table, ${id}: activation rule and value 20. The table defines when the factor is active; it gives no participant-facing name.`,
    reasoning:
      '**Retained unchanged.** ROOTS\' rule requires protective-factor labels to *"remain neutral and must not convert an activation rule into a clinical benefit claim"*. Each label names the condition the rule tests and claims no benefit, no outcome and no effect on health.',
  })),
];

/**
 * The five strings ROOTS approved for incorporation on 30 September 2026, frozen.
 *
 * ROOTS approved them on the condition that each "remain semantically limited to the cited
 * controlled clause and introduce no new clinical, causal, diagnostic, scoring or interpretive
 * meaning", and directed us to "freeze the approved text and source mapping in the controlled
 * register".
 *
 * A freeze has to be enforceable to mean anything, so the approved text is recorded here by
 * SHA-256. Editing an approved string changes its hash and fails this run. Changing the hash to
 * match is possible, but it is then a deliberate, visible act in a reviewed commit rather than a
 * wording drift nobody notices.
 */
const FROZEN: [string, string][] = [
  ['TRIAD_DIAGRAM_LABEL', '867990142c53ba171d2ee8d4de3c19786f740529340332995ed281f560cf7999'],
  ['WHY.biologicalState', 'c2b8445ad1f263749c75d5f2e2300451983c26171361aa532eb6df2ed2d51417'],
  ['WHY.biologicalStateNull', '0ec82c897e9d7edc5364868b4712bf7d782867477bc883c78b05119281ba4437'],
  ['WHY.opportunity', 'ba9866919934fd4069d89375e72bf6909079553b22e47e7612fb22a8eebdb326'],
  ['WHY.opportunityNull', 'db306f9676bd4b1c6f91103dc93e0faaca09ee529b0746439b71ee8a3d4d6814'],
];

/**
 * The 25 September 2026 direction, as recorded in the decision log.
 *
 * ROOTS accepts the five as ROOTS-issued "only where the final register reproduces that approved
 * wording verbatim and retains the 25 September source reference". So the claim is checked rather
 * than asserted: each string must appear, word for word, in the approved-wording table of the
 * decision log. If one has been reworded, expanded or normalised, it is no longer ROOTS-issued and
 * this run fails.
 */
const DECISION_LOG = join(ROOT, 'docs', 'm3', 'ROOTS-AI_M3_Decision_Log.md');

function verbatimIn25September(text: string): boolean {
  const log = readFileSync(DECISION_LOG, 'utf8');
  const table = log.slice(log.indexOf('| State | Approved wording |'));
  const section = table.slice(0, table.indexOf('\n\n'));
  const normalise = (v: string) => v.replace(/\s+/g, ' ').trim();
  return normalise(section).includes(normalise(text));
}

/** The nineteen must match what the wording register independently finds. */
function crossCheck(): { expected: string[]; declared: string[]; ok: boolean } {
  const md = readFileSync(REGISTER, 'utf8');
  // Section 4 (short labels) sits between section 3 and the group table, so the slice stops at it.
  const section = md.slice(md.indexOf('## 3. Vendor-drafted'), md.indexOf('## 4. Short labels'));
  const expected = [...section.matchAll(/^\| `([^`]+)`/gm)].map((m) => m[1]).sort();
  const declared = ITEMS.map((i) => i.key).sort();
  return { expected, declared, ok: JSON.stringify(expected) === JSON.stringify(declared) };
}

/** The current text of each string, read from the module so the register cannot quote stale wording. */
function texts(): Record<string, string> {
  const out = execSync('node --import tsx scripts/canonical/c03_strings.ts', {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  });
  return Object.fromEntries((JSON.parse(out) as [string, string][]).map(([k, v]) => [k, v]));
}

function main(): void {
  const check = crossCheck();
  const text = texts();

  // The freeze, and the verbatim condition ROOTS attached to the five ROOTS-issued strings.
  const drifted = FROZEN.filter(([key, hash]) => createHash('sha256').update(text[key] ?? '').digest('hex') !== hash);
  const notVerbatim = ITEMS.filter(
    (i) => i.disposition === 'ROOTS-issued' && !verbatimIn25September(i.clause ?? text[i.key] ?? ''),
  );
  // A declared clause must also actually appear in the delivered string, or the register would
  // be quoting wording the participant never sees.
  const clauseMissing = ITEMS.filter((i) => i.clause && !(text[i.key] ?? '').includes(i.clause));

  const byDisposition = (d: Disposition) => ITEMS.filter((i) => i.disposition === d);
  const issued = byDisposition('ROOTS-issued');
  const composite = byDisposition('Composite');
  const submitted = byDisposition('Approved for incorporation');
  const reserved = byDisposition('Resolved under the ROOTS final rule');

  const lines: string[] = [
    '# ROOTS-AI™ — C-03 controlled approval register',
    '',
    'The nineteen vendor-authored report strings, each with its exact source clause and disposition.',
    'Prepared in response to the ROOTS review of 30 September 2026, section 4.',
    '',
    '**Generated by** `npm run evidence:c03-approval`. Each string is quoted from the live content',
    'module, and the set of nineteen is cross-checked against `npm run check:c03` so the two cannot',
    'drift.',
    '',
    '## The test ROOTS set',
    '',
    '> "Where the wording is a direct participant-facing expression of an existing controlled rule',
    '> and introduces no additional scientific meaning, it may be submitted for final incorporation',
    '> into A1. Where the wording interprets scoring, ranking, protective factors, confidence',
    '> composition, causation, or the meaning of a state beyond what the controlled source actually',
    '> states, it remains a ROOTS content decision."',
    '',
    'ROOTS also directed that identifiers and implementation logic are not authority for',
    'participant-facing wording. An identifier proves a string is used; it proves nothing about',
    'whether the wording is supported. No disposition below rests on one.',
    '',
    '## Result',
    '',
    '| Disposition | Strings | What it means |',
    '|---|---|---|',
    `| **ROOTS-verbatim** | ${issued.length} | ROOTS wrote it and it is reproduced word for word, with its source reference. |`,
    `| **Composite** | ${composite.length} | Every component word comes from an approved ROOTS source, but the composition is ours. **Not** wholly ROOTS-authored. |`,
    `| **Approved vendor-authored** | ${submitted.length} | **Approved 30 Sep 2026.** Text and source mapping frozen under checksum. |`,
    `| **Resolved under the ROOTS final rule** | ${reserved.length} | **Resolved 30 Sep 2026.** Two changed, seven retained against the clause each satisfies. |`,
    `| Total | ${ITEMS.length} | |`,
    '',
    '### The composite category, and why it exists',
    '',
    'ROOTS directed on 1 October 2026 that composite wording must never be represented as wholly',
    'ROOTS-authored merely because each component originated from approved ROOTS material. It is',
    'therefore a disposition of its own here, counted apart from the ROOTS-verbatim strings rather',
    'than footnoted inside them.',
    '',
    `**${composite.length} of the nineteen are composites.** Both are Executive Summary driver variants. We first`,
    'recorded them as ROOTS-issued; the verbatim check did not support that, and we corrected it',
    'rather than leave it. ROOTS accepted the correction. The component sources are recorded against',
    'each below, so the provenance of every part is traceable even though the whole is ours.',
    '',
    '### A correction to our own classification',
    '',
    `**${issued.length + composite.length} of the nineteen originate in ROOTS material, not ours.** Our wording register classified`,
    'them as vendor-drafted because it searched only two sources: the C-03 pack and the issued review',
    'of 24 September. The wording for the Executive Summary driver variants and the three reduced',
    'Triad states was supplied by ROOTS in the direction of **25 September 2026**, which that search',
    'did not cover. ROOTS expressly rejected our earlier proposal ("strongest area(s)") and supplied',
    'replacements under the heading "Approved wording".',
    '',
    `Of those, **${issued.length} are reproduced verbatim** and are recorded as ROOTS-verbatim; **${composite.length} are compositions**`,
    'of approved parts and are recorded as composites. The direction is quoted in both cases, and the',
    'decision log entry that records it predates this review.',
    '',
    '---',
    '',
    '## 1. ROOTS-verbatim wording',
    '',
    'ROOTS wrote these and they are reproduced word for word. Not vendor copy. Listed so the',
    'amendment carries the provenance ROOTS requires.',
    '',
  ];

  for (const item of issued) {
    lines.push(
      `### \`${item.key}\``,
      '',
      `> ${text[item.key] ?? '**not found in the content module**'}`,
      '',
    );
    if (item.clause) {
      lines.push(
        `**The wording ROOTS supplied**, reproduced verbatim within the string above:`,
        '',
        `> ${item.clause}`,
        '',
      );
    }
    lines.push(`**Source.** ${item.source}`, '', `**Why this disposition.** ${item.reasoning}`, '');
  }

  lines.push(
    '## 2. Composite wording \u2014 component-source provenance',
    '',
    'Every word below comes from an approved ROOTS source. The *composition* does not, so these',
    'are not offered as wholly ROOTS-authored text, and ROOTS has directed that they never be',
    'represented as such. The clause ROOTS supplied is quoted separately from the approved framing',
    'around it, so each component can be traced to its own source.',
    '',
  );

  for (const item of composite) {
    lines.push(
      `### \`${item.key}\``,
      '',
      `> ${text[item.key] ?? '**not found in the content module**'}`,
      '',
    );
    if (item.clause) {
      lines.push(
        '**Component 1 \u2014 the clause ROOTS supplied**, reproduced verbatim within the string above:',
        '',
        `> ${item.clause}`,
        '',
        '**Component 2 \u2014 the surrounding framing**: approved C-03 Executive Summary copy, verified',
        'verbatim against the C-03 pack by `npm run check:c03`.',
        '',
      );
    }
    lines.push(`**Source.** ${item.source}`, '', `**Why this disposition.** ${item.reasoning}`, '');
  }

  lines.push(
    '## 3. Approved vendor-authored \u2014 30 September 2026',
    '',
    'ROOTS approved these five for incorporation, on the condition that each *"remain semantically',
    'limited to the cited controlled clause and introduce no new clinical, causal, diagnostic,',
    'scoring or interpretive meaning"*. The text below and its source mapping are **frozen**, and',
    'may not be reworded without a further ROOTS decision.',
    '',
  );

  for (const item of submitted) {
    lines.push(
      `### \`${item.key}\``,
      '',
      `> ${text[item.key] ?? '**not found in the content module**'}`,
      '',
      `**Source clause.** ${item.source}`,
      '',
      `**Why it is limited to that clause.** ${item.reasoning}`,
      '',
    );
  }

  lines.push(
    '## 4. Resolved under the ROOTS final rule \u2014 30 September 2026',
    '',
    'ROOTS did not return wording for these nine. It issued a governing rule instead, and directed',
    'that they should no longer block technical closure.',
    '',
    'Applying that rule: **two strings changed and seven were retained unchanged.** Each is shown',
    'below with the clause of the rule it satisfies. Nothing was rewritten to preserve wording we',
    'preferred \u2014 where the rule left no room, the interpretation was removed.',
    '',
  );

  for (const item of reserved) {
    lines.push(
      `### \`${item.key}\``,
      '',
      `> ${text[item.key] ?? '**not found in the content module**'}`,
      '',
      `**Source.** ${item.source}`,
      '',
      `**Under the ROOTS rule.** ${item.reasoning}`,
      '',
    );
  }

  lines.push(
    '---',
    '',
    '## What happens to each disposition',
    '',
    '| | If ROOTS approves | If ROOTS does not |',
    '|---|---|---|',
    '| ROOTS-issued | Recorded in A1 with its provenance as issued wording | We are wrong about provenance; it moves to section 3 |',
    '| Submitted | Incorporated into A1 as controlled content | Stays proposed, or is replaced with wording ROOTS issues |',
    '| Content decision | Only when ROOTS issues or confirms the wording | **Stays proposed.** The state it covers still renders, with wording marked vendor-authored |',
    '',
    '**Nothing here is treated as approved by implementation.** A string being live and tested is not',
    'an argument for approving it, and is not offered as one.',
    '',
    '## Cross-check',
    '',
    `The nineteen declared here are compared with the vendor-drafted set that \`npm run check:c03\``,
    'finds independently by searching the controlled sources.',
    '',
    `**${check.ok ? 'They match.' : 'THEY DO NOT MATCH — see the run output.'}**`,
    '',
  );

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'), 'utf8');

  console.log(`wrote ${OUT}`);
  console.log(`  ROOTS-verbatim                      : ${issued.length}`);
  console.log(`  composite                           : ${composite.length}`);
  console.log(`  approved vendor-authored            : ${submitted.length}`);
  console.log(`  resolved under the ROOTS final rule : ${reserved.length}`);
  console.log(`  ${'-'.repeat(36)}`);
  console.log(`  total                               : ${issued.length + composite.length + submitted.length + reserved.length} of ${ITEMS.length}`);
  console.log(`  frozen strings verified             : ${FROZEN.length}`);
  console.log(`  ROOTS-verbatim verified verbatim    : ${issued.length}`);

  // Every item must land in exactly one disposition, or the register is describing a set it does
  // not have. ROOTS asked (1 Oct 2026, closure section 2) that the totals agree everywhere.
  const classified = issued.length + composite.length + submitted.length + reserved.length;
  if (classified !== ITEMS.length) {
    console.error(`\nFAILED - ${ITEMS.length} items but ${classified} classified. Every string needs exactly one disposition.`);
    process.exit(1);
  }

  if (drifted.length) {
    console.error(`\nFAILED — ${drifted.length} approved string(s) have changed since ROOTS froze them:`);
    for (const [key] of drifted) console.error(`  ${key}`);
    console.error('An approved string may not be reworded without a further ROOTS decision.');
    process.exit(1);
  }

  if (clauseMissing.length) {
    console.error(`\nFAILED — ${clauseMissing.length} declared clause(s) do not appear in the delivered string:`);
    for (const item of clauseMissing) console.error(`  ${item.key}`);
    process.exit(1);
  }

  if (notVerbatim.length) {
    console.error(`\nFAILED — ${notVerbatim.length} string(s) claimed as ROOTS-issued are not verbatim from 25 September:`);
    for (const item of notVerbatim) console.error(`  ${item.key}`);
    console.error('ROOTS accepts these as its own wording only where reproduced word for word.');
    process.exit(1);
  }

  if (!check.ok) {
    console.error('\nFAILED — the declared set does not match what check:c03 finds.');
    console.error(`  declared but not found: ${check.declared.filter((k) => !check.expected.includes(k)).join(', ') || 'none'}`);
    console.error(`  found but not declared: ${check.expected.filter((k) => !check.declared.includes(k)).join(', ') || 'none'}`);
    process.exit(1);
  }
  console.log(`\nPASS - the nineteen match the wording register, the ${issued.length} ROOTS-verbatim strings are`);
  console.log('       verbatim from 25 September, and no approved string has drifted.');
}

main();

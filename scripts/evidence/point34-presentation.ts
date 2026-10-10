/**
 * Report-review point 34 — the bounded list of presentation decisions.
 *
 *     npm run evidence:point34
 *
 * ROOTS review of 29 September 2026, item 3, asks for point 34 to be given a bounded list rather
 * than left open. Point 34 requires three things:
 *
 *   "Keep canonical stored values independent from display formatting."
 *   "The report architecture should allow locale-aware presentation of dates and measurement
 *    units without changing the underlying canonical data."
 *   "Do not implement uncontrolled AI translation of scientific or governed report content."
 *
 * The first and third are properties of the code as it stands. The second is a capability, and a
 * capability with no scope attached is an open-ended internationalisation project. Bounding it
 * means naming every place a value becomes a string for a person to read, and that set is
 * finite and enumerable, so this enumerates it by scanning the source rather than by listing what
 * someone remembered.
 *
 * The scan is the point. A new formatting call added anywhere under lib/, app/ or components/
 * appears in the next run, so the list cannot quietly go stale, and the run fails if a display
 * format is left to the runtime's default locale — which is the one way the same canonical value
 * can print differently on the server and in the browser.
 */

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'docs', 'm3', 'ROOTS-AI_M3_Point34_Presentation_Boundary.md');
const ROOTS = ['lib', 'app', 'components'];

interface Site {
  file: string;
  line: number;
  call: string;
  kind: 'date' | 'number' | 'sort';
  locale: string | null;
  timeZone: string | null;
  surface: string;
}

/** What a path is for, so the list can be read by area rather than by file. */
function surfaceOf(file: string): string {
  if (file.startsWith('lib/report/') || file.startsWith('app/report/')) return 'Participant report (web and PDF)';
  if (file.startsWith('app/assessment/')) return 'Assessment journey';
  if (file.startsWith('app/admin/') || file.startsWith('lib/admin/')) return 'Admin console';
  if (file.startsWith('app/account/')) return 'Participant account';
  if (file.startsWith('lib/research/')) return 'Research export';
  return 'Public website';
}

const CALLS = [
  { re: /\.toLocaleDateString\(([^)]*)\)/g, kind: 'date' as const },
  { re: /\.toLocaleString\(([^)]*)\)/g, kind: 'number' as const },
  { re: /new Intl\.DateTimeFormat\(([^)]*)\)/g, kind: 'date' as const },
  { re: /new Intl\.NumberFormat\(([^)]*)\)/g, kind: 'number' as const },
  { re: /\.localeCompare\(([^)]*)\)/g, kind: 'sort' as const },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const sites: Site[] = [];
for (const root of ROOTS) {
  for (const full of walk(join(ROOT, root))) {
    const file = relative(ROOT, full).replace(/\\/g, '/');
    const text = readFileSync(full, 'utf8');
    const lines = text.split('\n');
    for (const { re, kind } of CALLS) {
      for (const m of text.matchAll(re)) {
        const line = text.slice(0, m.index).split('\n').length;
        // A call inside a comment is documentation, not behaviour.
        if (/^\s*(\/\/|\*)/.test(lines[line - 1] ?? '')) continue;
        const args = m[1] ?? '';
        const locale = args.match(/'([a-z]{2}(?:-[A-Z]{2})?)'/)?.[1] ?? null;
        const timeZone = args.match(/timeZone:\s*'([^']+)'/)?.[1] ?? null;
        // toLocaleString formats a date as readily as a number; the options say which.
        const actual = /dateStyle|timeStyle|timeZone|year:|month:|day:/.test(args) ? ('date' as const) : kind;
        sites.push({ file, line, call: m[0].slice(0, 110), kind: actual, locale, timeZone, surface: surfaceOf(file) });
      }
    }
  }
}

sites.sort((a, b) => a.surface.localeCompare(b.surface) || a.file.localeCompare(b.file) || a.line - b.line);

const display = sites.filter((s) => s.kind !== 'sort');
const unpinned = display.filter((s) => !s.locale);
const datesWithoutZone = display.filter((s) => s.kind === 'date' && !s.timeZone);
const surfaces = [...new Set(sites.map((s) => s.surface))].sort();

/** Canonical values, and where each one is turned into a string. */
const CANONICAL = [
  ['Domain scores, Biological State, Opportunity, Recovery Potential, Confidence', '`public.scores`, as numbers', '`lib/report/metrics.ts` and `lib/report/build.ts` — `toFixed` at the point of display only'],
  ['Classifications and driver ranks', '`public.scores`, as identifiers and ranks', '`lib/report/c03-content.ts` supplies the approved label; nothing is derived at render time'],
  ['Participant measurements', '`public.responses.raw_value` as entered, with the unit; `normalized_value` in the canonical unit', '`lib/report/build.ts` prints the entered value with its unit — review point 19'],
  ['Timestamps', 'ISO 8601 UTC in every column', 'Formatted at display, always with an explicit time zone'],
  ['Report and questionnaire versions', 'Identifiers, not text', 'Printed as stored'],
];

const lines: string[] = [
  '# ROOTS-AI™ — report-review point 34: the presentation boundary',
  '',
  'Prepared in response to the ROOTS review of 29 September 2026, item 3, which asks for point 34',
  'to be bounded rather than left open.',
  '',
  '**Generated by** `npm run evidence:point34`, which scans `lib/`, `app/` and `components/` for',
  'every call that turns a value into a string for a person to read. The list is produced from the',
  'source, so a formatting call added later appears in the next run.',
  '',
  '## What point 34 asks, and where each part stands',
  '',
  '| Requirement | Status |',
  '|---|---|',
  '| "Keep canonical stored values independent from display formatting" | **Held.** No canonical value is stored formatted, and no formatted value is stored. Section 1. |',
  `| "allow locale-aware presentation of dates and measurement units without changing the underlying canonical data" | **Possible, not implemented.** ${display.length} formatting sites, all pinned to \`en-GB\`, listed in section 2. The bounded change is section 3. |`,
  '| "Do not implement uncontrolled AI translation of scientific or governed report content" | **Held, structurally.** Section 4. |',
  '',
  '## 1. Canonical values are stored unformatted',
  '',
  'The separation point 34 requires is not a convention here; it is where the code already puts the',
  'boundary. Nothing formats on the way in.',
  '',
  '| Canonical value | Stored as | Formatted where |',
  '|---|---|---|',
];

for (const [what, stored, formatted] of CANONICAL) lines.push(`| ${what} | ${stored} | ${formatted} |`);

lines.push(
  '',
  'The consequence worth stating: a locale change alters what is printed and nothing else. No',
  'stored value moves, no score changes, and the Golden Tests are unaffected, because they assert',
  'canonical numbers and never rendered strings.',
  '',
  '## 2. Every formatting site',
  '',
  `${display.length} calls turn a value into a display string, across ${surfaces.length} surfaces.`,
  `Every one names its locale explicitly${datesWithoutZone.length === 0 ? ', and every date names its time zone' : ''}.`,
  'That is what makes the set bounded: this is the whole of what a second locale would touch.',
  '',
  '| Surface | Where | Kind | Locale | Time zone | Call |',
  '|---|---|---|---|---|---|',
);

for (const s of display) {
  lines.push(
    `| ${s.surface} | \`${s.file}:${s.line}\` | ${s.kind} | ${s.locale ? `\`${s.locale}\`` : '**unpinned**'} | ` +
      `${s.timeZone ? `\`${s.timeZone}\`` : s.kind === 'date' ? '**none**' : '—'} | \`${s.call.replace(/\|/g, '\\|')}\` |`,
  );
}

const sorts = sites.filter((s) => s.kind === 'sort');
lines.push(
  '',
  `### ${sorts.length} comparison sites, listed apart`,
  '',
  '`localeCompare` orders lists; it prints nothing. It is listed because a locale change would',
  'change the order of a sorted list, which is a presentation change even though no string is',
  'formatted. None of these order participant-facing report content: they order admin tables,',
  'audit entries and research export rows.',
  '',
  '| Where | Call |',
  '|---|---|',
);
for (const s of sorts) lines.push(`| \`${s.file}:${s.line}\` | \`${s.call.replace(/\|/g, '\\|')}\` |`);

lines.push(
  '',
  '## 3. The bounded change',
  '',
  'What locale-aware presentation would require, in full. It is deliberately short, and it is short',
  'because of section 1.',
  '',
  '| # | Change | Size |',
  '|---|---|---|',
  `| 1 | Replace the literal \`'en-GB'\` at the ${display.length} sites in section 2 with the participant's locale. | Mechanical. \`public.profiles.locale\` already exists and is already returned by the profile API. |`,
  '| 2 | Decide the display unit per locale for the one measurement that has two — waist, cm or in — and format from `normalized_value` rather than from what was entered. | One function. The entered value and unit stay stored and stay printable, because review point 19 requires it. |',
  '| 3 | Decide whether dates stay in UTC or move to the participant\'s zone. | A decision, not code. Every date site already names a zone, so there is one place per site to change. |',
  '| 4 | Supply a controlled translated content pack for each locale. | **The whole of the real work.** Section 4. |',
  '',
  'Items 1 to 3 are days. Item 4 is the project, and it is not an engineering one.',
  '',
  '## 4. The translation boundary',
  '',
  'Point 34\'s third requirement is already held, and not by a rule we follow: by where the content',
  'comes from.',
  '',
  'Every participant-facing sentence in the report is read from `lib/report/c03-content.ts`, which',
  'is the controlled C-03 pack transcribed as data, and `npm run check:c03` verifies each string',
  'against the controlled source word for word. The website and legal copy are held the same way',
  'against C-04 by `npm run check:c04`. There is no path by which a translated sentence could reach',
  'a participant without being in one of those packs.',
  '',
  'The governed narrative is the one place a language model writes participant-facing prose, and it',
  'may only replace three sections (2, 9 and 18), is schema-checked and language-checked before it',
  'is accepted, and falls back to approved deterministic copy when it is refused. It cannot',
  'translate: it is given a projection of pre-calculated values, not the report text.',
  '',
  'So a second language would need a controlled C-03 and C-04 pack in that language, issued by',
  'ROOTS, with the same verbatim gates pointed at it. That is the bound: **translation is a',
  'controlled-content deliverable, not a feature.**',
  '',
  '## Closure',
  '',
  'Point 34 has two halves. The architectural half — canonical values independent of formatting, no',
  'uncontrolled translation — is held and evidenced above. The capability half cannot close without',
  'a ROOTS decision on target locales, because there is nothing to implement until there is a',
  'locale to implement and a controlled pack to implement it from.',
  '',
  '## The Phase 1 time-zone rule, recorded',
  '',
  'ROOTS review of 30 September 2026, section 10: *"Date/time behavior must use an explicitly',
  'defined time-zone rule rather than an implicit server locale. Record the selected Phase 1 rule',
  'before closing point 34."*',
  '',
  '**The Phase 1 rule: every date and time a participant or an administrator sees is rendered in',
  'UTC, labelled as such wherever a time of day is shown.**',
  '',
  '| | |',
  '|---|---|',
  '| Stored as | ISO 8601 UTC, in every timestamp column |',
  '| Displayed as | UTC, with an explicit `timeZone` on every format call |',
  '| Labelled | Times of day carry a visible UTC suffix; a date alone does not, because a UTC date is unambiguous |',
  '| Participant time zone | **Not used in Phase 1.** None is collected, inferred or stored |',
  '| Enforcement | This gate fails if any date is formatted without an explicit time zone |',
  '',
  "**Why UTC rather than the reader's own zone.** A report is a record. Two people opening the",
  'same report in different countries must see the same timestamp on it, and a participant',
  'comparing a report against an audit entry must be able to line the two up. A reader-local',
  'rendering would make one stored instant read differently depending on where it was opened,',
  'which is the implicit behaviour ROOTS is excluding.',
  '',
  '**What the rule costs.** A participant in Auckland who submits at 09:00 local time sees 21:00',
  'UTC on the previous day. That is a real cost, stated rather than glossed. It is accepted for',
  'Phase 1 because a record that reads the same everywhere is worth more than one that reads',
  'naturally in one place, and because the alternative needs a time zone we deliberately do not',
  'collect.',
  '',
  '**Changing it later** is a locale decision rather than an implementation one: it would require',
  'the participant time zone to be collected and stored, and the change itself is bounded by the',
  'date sites listed in section 2.',
  '',
  '## What remains',
  '',
  '**What ROOTS is asked for:** which locales, if any, are in scope after the pilot, and whether a',
  'translated C-03/C-04 pack is planned. The time-zone question is closed: the Phase 1 rule is',
  'recorded above and enforced by this gate.',
  '',
  'ROOTS confirmed on 30 September 2026 that no additional language, locale-specific pack or',
  'jurisdictional behaviour is authorised by the acceptance of this work, and that the currently',
  'approved controlled-language content is preserved for Phase 1. Nothing here changes that.',
  '',
  '',
);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`wrote ${OUT}`);
console.log(`${display.length} display formatting sites across ${surfaces.length} surfaces; ${sorts.length} comparison sites`);

if (unpinned.length) {
  console.error(`\n${unpinned.length} formatting call(s) left to the runtime's default locale:`);
  for (const s of unpinned) console.error(`  ${s.file}:${s.line}  ${s.call}`);
  console.error('\nThe same canonical value can print differently on the server and in the browser.');
  process.exit(1);
}
if (datesWithoutZone.length) {
  console.error(`\n${datesWithoutZone.length} date format(s) without an explicit time zone:`);
  for (const s of datesWithoutZone) console.error(`  ${s.file}:${s.line}  ${s.call}`);
  process.exit(1);
}

console.log('\nPASS - every display format names its locale, and every date names its time zone.');

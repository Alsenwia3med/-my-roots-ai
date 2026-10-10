/**
 * Integrated M3 submission index.
 *
 *     npm run evidence:submission
 *
 * ROOTS decision of 29 September 2026: "Please include the evidence cited in your messages as
 * part of the integrated M3 submission rather than leaving it available only upon request...
 * Associate every evidence set with the exact ROOTS-owned repository, branch, commit, build, and
 * test version. Where a correction was made after a test run, rerun the affected tests against
 * the delivered commit. Earlier passing results are not evidence that a later build still
 * passes."
 *
 * The repository, branch and commit are read from git at generation time. If the working tree is
 * dirty, or the project is not tracked, or the remote is not a ROOTS-owned repository, the index
 * says so plainly instead of printing a reference that would not survive checking. An
 * unverifiable commit line is worse than an honest gap.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const OUT = join(process.cwd(), 'docs', 'm3', 'ROOTS-AI_M3_Submission_Index.md');

const git = (cmd: string): string | null => {
  try {
    return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
};

const tracked = (() => {
  try {
    execSync('git ls-files --error-unmatch package.json', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

const commit = tracked ? git('rev-parse HEAD') : null;
const branch = tracked ? git('rev-parse --abbrev-ref HEAD') : null;
const remote = git('remote get-url origin');
/*
 * The release-bound documents are written during the release itself, so their appearance in
 * `git status` is not evidence that the delivered state is uncommitted. Judging cleanliness by the
 * raw status is what made the previous package stamp itself "not release-ready" while describing a
 * clean commit (ROOTS review of 30 September 2026, section 1).
 *
 * Cleanliness is therefore judged on everything except the three documents a release writes and
 * the archive it takes.
 */
const RELEASE_BOUND = [
  'docs/m3/ROOTS-AI_M3_Release_Manifest.md',
  'docs/m3/ROOTS-AI_M3_Submission_Index.md',
  'docs/m3/ROOTS-AI_M3_Closure_Register.md',
];

const pendingChanges = (git('status --porcelain') ?? '')
  .split(String.fromCharCode(10))
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => l.replace(/^\S+\s+/, ''))
  .filter((path) => !RELEASE_BOUND.includes(path) && !path.startsWith('docs/m3/archive/'));

const dirty = tracked ? pendingChanges.length > 0 : true;

/**
 * The three items still inside the M3 boundary.
 *
 * Declared once so the submission index, and anything generated from it, cannot drift apart from
 * each other the way the previous revision did. ROOTS asked (M3-RC9 review, section 3) that the
 * screen-reader status in particular be identical across every document.
 */
const RESTORE_STATUS =
  '**Restore test closed** — one successful pre-launch test executed and verified, 13 of 13 checks (`ROOTS-AI_M3_Restore_Drill_Execution.md`). **Configuration partially evidenced**: daily backups, the latest succeeding and seven days without a gap are captured; 30-day retention, PITR, region and restore permissions are not (`ROOTS-AI_M3_Backup_Configuration_Evidence.md`)';
const CLIENT_MATRIX_STATUS =
  '**Closed.** All eight clients exercised and recorded — Chrome, Firefox, Edge and Opera on Windows, Safari on macOS, Safari on iPhone, Chrome on Android, and a mobile viewport. No defect found, no remediation required';
const SCREEN_READER_STATUS =
  '**Partial.** VoiceOver run on a real iPhone with the journey operable element by element; the announcements themselves are not transcribed, so the smoke test is not yet complete';

/** The release name, when this index is generated as part of a named release. */
const release = (() => {
  const i = process.argv.indexOf('--release');
  return i === -1 ? null : (process.argv[i + 1] ?? null);
})();

interface Doc {
  title: string;
  path: string;
  regenerate: string;
  covers: string;
}

const DOCS: Doc[] = [
  { title: 'C-03 controlled approval register', path: 'docs/m3/ROOTS-AI_M3_C03_Approval_Register.md', regenerate: 'npm run evidence:c03-approval', covers: 'ROOTS review of 30 Sep 2026, section 4 — the 19 strings with exact source clauses and dispositions' },
  { title: 'Clean database install evidence', path: 'docs/m3/ROOTS-AI_M3_Clean_Install_Evidence.md', regenerate: 'npm run db:verify', covers: 'ROOTS review of 30 Sep 2026, section 14 — command, environment, migration baseline, 12 checks, result' },
  { title: 'M3 closure register', path: 'docs/m3/ROOTS-AI_M3_Closure_Register.md', regenerate: 'npm run evidence:closure', covers: 'ROOTS review of 29 Sep 2026, section F — every item raised, its state, its evidence and what is still needed' },
  { title: 'Release manifest', path: 'docs/m3/ROOTS-AI_M3_Release_Manifest.md', regenerate: 'npm run release:manifest', covers: 'ROOTS review of 29 Sep 2026, section A — commit, SHA-256 of every evidence file, gates, and what is not evidenced' },
  { title: 'Package integrity verification', path: 'docs/m3/ROOTS-AI_M3_Package_Integrity_Verification.md', regenerate: 'npm run check:package', covers: 'READ_FIRST §7 — SHA-256 receipt and checksum confirmation' },
  { title: 'Final report verification package', path: 'docs/m3/ROOTS-AI_M3_Final_Report_Verification.md', regenerate: 'npm run evidence:final-verification', covers: 'The ten checks required at the end of the 35-point review' },
  { title: 'Governed narrative settings', path: 'docs/m3/ROOTS-AI_M3_AI_Settings.md', regenerate: 'npm run evidence:ai-settings', covers: 'ROOTS review of 29 Sep 2026, item B3 — all 15 settings, local column read from the running configuration' },
  { title: 'AI integration evidence (live provider)', path: 'docs/m3/ROOTS-AI_M3_AI_Integration_Evidence.md', regenerate: 'npm run evidence:ai', covers: 'READ_FIRST §5 integration test; Annex D-07 versioning and fallback proof' },
  { title: 'Unit coverage evidence', path: 'docs/m3/ROOTS-AI_M3_Coverage_Evidence.md', regenerate: 'npm run evidence:coverage', covers: 'Master Requirements §13.1 suite 1' },
  { title: 'End-to-end journey evidence', path: 'docs/m3/ROOTS-AI_M3_E2E_Evidence.md', regenerate: 'npm run build && npm run evidence:e2e', covers: 'Master Requirements §13.1 suite 4' },
  { title: 'OWASP Top 10 probe evidence', path: 'docs/m3/ROOTS-AI_M3_OWASP_Evidence.md', regenerate: 'npm run build && npm run evidence:owasp', covers: 'Master Requirements §13.1 suite 5 — OWASP strand' },
  { title: 'Six-item decision matrix', path: 'docs/m3/ROOTS-AI_M3_Decision_Matrix.md', regenerate: '— (authored response)', covers: 'ROOTS decision of 29 Sep 2026, items 1-6' },
  { title: 'Decision log', path: 'docs/m3/ROOTS-AI_M3_Decision_Log.md', regenerate: '— (authored record)', covers: 'D-01…D-05, Q-01…Q-05, Annex D-06' },
  { title: '35-point report-review checklist', path: 'docs/m3/ROOTS-AI_M3_Report_Review_35_Point_Checklist.md', regenerate: 'npm run evidence:review35', covers: 'All 35 review points with status, source, change, evidence, dependency' },
  { title: 'C-03 Amendment A1', path: 'docs/m3/ROOTS-AI_C03_Amendment_A1_Report_Corrections.md', regenerate: 'npm run evidence:c03-amendment', covers: 'Review points 3, 4, 5, 20, 23, 31; point 26 position' },
  { title: 'Point 21 content matrix', path: 'docs/m3/ROOTS-AI_M3_Point21_Content_Matrix.md', regenerate: 'npm run evidence:point21', covers: '7 x 4 domain/classification matrix, existing approved content only' },
  { title: 'Point 21 content matrix — editable workbook for ROOTS', path: 'docs/m3/evidence/Point21_Content_Matrix_FOR_ROOTS.xlsx', regenerate: 'npm run evidence:point21 && npm run evidence:point21-xlsx', covers: 'ROOTS review of 29 Sep 2026, item 1 — 28 combinations with four empty decision columns' },
  { title: 'Web/PDF parity matrix', path: 'docs/m3/ROOTS-AI_M3_Web_PDF_Parity_Matrix.md', regenerate: 'npm run evidence:parity && npm run check:parity', covers: 'Review points 29 and 30 — 19 sections, 5 states' },
  { title: 'Section 7 presentation matrix', path: 'docs/m3/ROOTS-AI_M3_Section7_Presentation_Matrix.md', regenerate: 'npm run evidence:section7', covers: 'Decision item 5 — field-by-field, incl. accessible output' },
  { title: 'Driver state matrix', path: 'docs/m3/ROOTS-AI_M3_Driver_State_Matrix.md', regenerate: 'npm run evidence:drivers', covers: 'D-04 co-primary correction across every driver state' },
  { title: 'Accessibility evidence', path: 'docs/m3/ROOTS-AI_M3_Accessibility_Evidence.md', regenerate: 'npm run check:a11y', covers: 'C-05 §13, all clauses; review point 31' },
  { title: 'Token contrast evidence', path: 'docs/m3/ROOTS-AI_M3_Token_Contrast_Evidence.md', regenerate: 'npm run check:tokens', covers: 'Decision item 3 — before/after per declaration' },
  { title: 'Responsive evidence', path: 'docs/m3/ROOTS-AI_M3_Responsive_Evidence.md', regenerate: 'npm run evidence:responsive', covers: 'C-05 §5 — 55 route/width combinations; touch targets' },
  { title: 'Security evidence', path: 'docs/m3/ROOTS-AI_M3_Security_Evidence.md', regenerate: 'npm run check:security', covers: 'Annex D-06 — RLS matrix, authorization, secrets, logging' },
  { title: 'Performance evidence', path: 'docs/m3/ROOTS-AI_M3_Performance_Evidence.md', regenerate: 'npm run build && npm run evidence:performance', covers: 'Master Requirements §12 — report generation, page load, API under concurrent load, next-question interaction, report display' },
  { title: 'Backup configuration evidence', path: 'docs/m3/ROOTS-AI_M3_Backup_Configuration_Evidence.md', regenerate: '— (captured from the provider console and recorded)', covers: 'Master Requirements §7, §13.1 suite 11 and AC-12 — the provider backup configuration; the other half of suite 11 beside the restore test' },
  { title: 'Restore drill execution', path: 'docs/m3/ROOTS-AI_M3_Restore_Drill_Execution.md', regenerate: 'npm run db:restore-drill', covers: 'Controlled Baseline §13.1 suite 11 — one successful pre-launch backup and restore test, executed and verified' },
  { title: 'Production measured evidence', path: 'docs/m3/ROOTS-AI_M3_Production_Measured_Evidence.md', regenerate: '— (measured against the deployed RC and recorded)', covers: 'Master Requirements §12 page load and report display, measured on production including network and edge; accessibility tree of authenticated screens' },
  { title: 'Save-response performance', path: 'docs/m3/ROOTS-AI_M3_Performance_Save_Evidence.md', regenerate: 'npm run evidence:performance-save', covers: 'Master Requirements §12 — save response p95 ≤500 ms' },
  { title: 'Performance at 100,000 records', path: 'docs/m3/ROOTS-AI_M3_Performance_Scale_Evidence.md', regenerate: 'npm run evidence:performance-scale', covers: 'Master Requirements §12 — admin queries ≤3 s at 100,000 records; ROOTS closure requirements of 1 Oct 2026, section 3' },
  { title: 'Supported-client evidence report (PDF)', path: 'docs/m3/ROOTS-AI_M3_Supported_Client_Evidence.pdf', regenerate: 'npm run evidence:supported-client-pdf', covers: 'Master Requirements §12.1 — the matrix, six client recordings including the VoiceOver screen-reader smoke test, and twenty captured screens' },
  { title: 'Supported-client verification', path: 'docs/m3/ROOTS-AI_M3_Supported_Client_Verification.md', regenerate: '— (executed against the deployed RC and recorded)', covers: 'Controlled Baseline supported-client requirement; ROOTS closure requirements of 1 Oct 2026, section 4 — keyboard, ARIA and responsive verification for UAT readiness' },
  { title: 'Backup and restore drill plan', path: 'docs/m3/ROOTS-AI_M3_Backup_and_Restore_Drill_Plan.md', regenerate: '— (authored plan)', covers: 'Master Requirements §13.1 suite 11 and AC-12; ROOTS review of 29 Sep 2026, item 13' },
  { title: 'Performance test plan', path: 'docs/m3/ROOTS-AI_M3_Performance_Test_Plan.md', regenerate: '— (authored plan)', covers: 'ROOTS review of 29 Sep 2026, item 11 — method and proposed conditions for the seven §12 metrics that cannot yet be measured' },
  { title: 'Synthetic test data', path: 'docs/m3/ROOTS-AI_M3_Synthetic_Test_Data.md', regenerate: 'npm run db:test-data', covers: 'ROOTS review of 29 Sep 2026, item 12 — reproducible 100,000-record dataset, scored by the delivered engine' },
  { title: 'C-07 traceability summary', path: 'docs/m3/ROOTS-AI_M3_C07_Traceability_Summary.md', regenerate: 'npm run evidence:c07', covers: '594 atomic requirements, vendor columns' },
  { title: 'C-07 completed workbook', path: 'docs/m3/evidence/C07_v1.0.1_M3_VENDOR_COMPLETED.xlsx', regenerate: 'npm run evidence:c07', covers: '594 rows' },
  { title: 'C-07 line-by-line trace, critical rows', path: 'docs/m3/ROOTS-AI_M3_C07_Critical_Row_Trace.md', regenerate: 'npm run evidence:c07-critical', covers: 'ROOTS review of 29 Sep 2026, item D2 — the 38 scoring rows, 204 field comparisons against controlled C-01 and the delivered build' },
  { title: 'LEG screen acceptance', path: 'docs/m3/ROOTS-AI_M3_LEG_Screen_Acceptance.md', regenerate: '— (authored record)', covers: 'Legal screens against C-04/C-05' },
  { title: 'Point 19 input inventory', path: 'docs/m3/ROOTS-AI_M3_Point19_Input_Inventory.md', regenerate: 'npm run evidence:point19', covers: 'ROOTS review of 29 Sep 2026, item 2 — every participant-entered measurement, and the plausibility ranges C-01 does not define' },
  { title: 'Point 34 presentation boundary', path: 'docs/m3/ROOTS-AI_M3_Point34_Presentation_Boundary.md', regenerate: 'npm run evidence:point34', covers: 'ROOTS review of 29 Sep 2026, item 3 — every formatting site, the bounded locale change, the translation boundary' },
  { title: 'Vendor copy register (outside the report)', path: 'docs/m3/ROOTS-AI_M3_Vendor_Copy_Register.md', regenerate: 'npm run check:vendor-copy', covers: 'ROOTS review of 29 Sep 2026, item D7 — all 70 functional strings no controlled pack supplies' },
  { title: 'C-03 wording register (ROOTS-issued vs vendor-drafted)', path: 'docs/m3/ROOTS-AI_M3_C03_Wording_Register.md', regenerate: 'npm run check:c03', covers: 'ROOTS review of 29 Sep 2026, item 7 — every report string classified against the controlled sources' },
  { title: 'Controlled defect record B1 — secure-link provisioning', path: 'docs/m3/ROOTS-AI_M3_Defect_Record_B1_Secure_Link_Provisioning.md', regenerate: 'npm run test:auth', covers: 'ROOTS review of 29 Sep 2026, item B1 — root cause, affected versions, changed files, regression and concurrency tests' },
  { title: 'Database probe execution log', path: 'docs/m3/ROOTS-AI_M3_DB_Probe_Execution_Log.md', regenerate: 'npm run db:probes', covers: 'Both SQL suites executed — 98 probes, RLS and AI-03 grants' },
  { title: 'AI boundary database tests', path: 'docs/m3/ROOTS-AI_M3_AI_Boundary_DB_Tests.sql', regenerate: '— (run in the Supabase SQL editor)', covers: 'AI-03 grants; 20 probes' },
  { title: 'M2 security/RLS tests', path: 'docs/m2/ROOTS-AI_M2_Security_Tests.sql', regenerate: '— (run in the Supabase SQL editor)', covers: 'RLS negative cases; 57 probes' },
];

const GATES = [
  ['npm run evidence:closure', 'Closure register; fails if a cited document does not exist'],
  ['npm run release:snapshot', 'Archive the superseded evidence, then write the release manifest'],
  ['npm test', 'Full automated suite'],
  ['npm run check:c04', 'C-04 governed strings verbatim against the controlled PDF'],
  ['npm run check:c03', 'C-03 report strings classified against the controlled pack and the issued review'],
  ['npm run check:vendor-copy', 'Non-report copy checked against C-04; fails if vendor copy is actually governed'],
  ['npm run evidence:c03-approval', 'The 19 report strings, per-string source clause and disposition'],
  ['npm run evidence:point34', 'Every display format names its locale; every date names its time zone'],
  ['npm run evidence:c07-critical', 'Critical C-07 rows compared field by field with controlled C-01 and the build'],
  ['npm run evidence:parity && npm run check:parity', 'Web/PDF parity across all 19 sections'],
  ['npm run check:a11y', 'C-05 §13 accessibility clauses'],
  ['npm run check:tokens', 'Design-token contrast corrections'],
  ['npm run check:security', 'Annex D-06 security strands'],
  ['npm run evidence:responsive', 'C-05 §5 breakpoints and touch targets'],
  ['npm run evidence:section7', 'Section 7 field-by-field presentation'],
  ['npm run evidence:performance', 'Master Requirements §12 budgets'],
];

const lines: string[] = [
  '# ROOTS-AI™ — M3 integrated submission index',
  '',
  'Every evidence set produced for M3, with the command that regenerates it and the build it was',
  'taken against. Prepared per the ROOTS decision of 29 September 2026, which requires the',
  'evidence to form part of the submission rather than be available on request.',
  '',
  '## Build reference',
  '',
  '| | |',
  '|---|---|',
  `| Release | ${release ? `**${release}**` : '*unnamed*'} |`,
  `| Repository (origin) | ${remote ?? '**not set**'} |`,
  `| Project tracked in that repository | ${tracked ? 'yes' : '**no**'} |`,
  `| Branch | ${branch ?? '**unavailable**'} |`,
  `| Commit | ${commit ?? '**unavailable**'} |`,
  `| Working tree clean | ${dirty ? `**no — ${pendingChanges.length} uncommitted change(s)**` : 'yes — apart from the release documents being written now'} |`,
  `| Generated | ${new Date().toISOString()} |`,
  '',
];

if (!tracked || !commit || dirty) {
  lines.push(
    '> **This submission is not yet release-ready.**',
    '>',
    '> The decision requires every evidence set to be associated with an exact ROOTS-owned',
    '> repository, branch, commit and build. The reference above therefore does not describe a',
    '> reproducible state: the listed commit does not contain the uncommitted changes, so',
    '> regenerating from that commit would not produce this evidence set.',
    '>',
    '> **Action required before submission:** commit the delivered state to the ROOTS-owned',
    '> repository, re-run every gate in the table below against that commit, and regenerate this',
    '> index so the reference is captured. Earlier passing results are not offered as evidence that',
    '> the delivered commit passes — the decision is explicit on that point.',
    '',
  );
}

lines.push(
  '## Verification gates',
  '',
  'Each must be re-run against the delivered commit; results from an earlier build are not',
  'evidence for a later one.',
  '',
  '| Command | Covers |',
  '|---|---|',
);
for (const [cmd, what] of GATES) lines.push(`| \`${cmd}\` | ${what} |`);

lines.push('', '## Evidence documents', '', '| Document | Covers | Present | Regenerate |', '|---|---|---|---|');
let missing = 0;
for (const d of DOCS) {
  const ok = existsSync(join(process.cwd(), d.path));
  if (!ok) missing += 1;
  const size = ok ? `${Math.round(statSync(join(process.cwd(), d.path)).size / 1024)} KB` : '**MISSING**';
  lines.push(`| [\`${d.path}\`](../../${d.path}) — ${d.title} | ${d.covers} | ${size} | \`${d.regenerate}\` |`);
}

lines.push(
  '',
  '## Supporting artefacts',
  '',
  '| Artefact | Contents |',
  '|---|---|',
  '| `docs/m3/evidence/responsive/` | 55 full-page screenshots, one per route/width |',
  '| `docs/m3/evidence/parity-*.pdf` | Rendered PDFs for each parity case |',
  '| `docs/m3/evidence/review-points.pdf` | Rendered report showing the review-point additions |',
  '| `docs/m2/evidence/golden-tests.html` | All 30 Golden Tests, input → expected → actual |',
  '',
  '## Current disposition of every item ROOTS has raised',
  '',
  '**This table is the current status at this release.** Where an item was previously recorded as',
  'open or outstanding, the decision that changed it is named, so an earlier status found elsewhere',
  'in the history can be recognised as superseded rather than read as current.',
  '',
  '| Item | Current disposition | Superseded by |',
  '|---|---|---|',
  '| Report-review point 21 | **Closed for M3.** No new domain x state interpretation paragraphs required; approved generic content remains; the workbook is a future content-gap inventory | ROOTS decision, 1 Oct 2026 |',
  '| Section 7 presentation rule | **Closed.** Accepted subject to the semantic-completeness predicate, which is encoded as a permanent regression guard and proved over 210 paragraph checks | ROOTS ruling 30 Sep 2026, confirmed 1 Oct 2026 |',
  '| Review point 19 | **Closed for M3.** No plausibility ranges beyond the C-01 technical validity constraints; technically valid values accepted unchanged | ROOTS decision, 1 Oct 2026 |',
  '| Review point 34 | **Closed for M3.** UTC throughout, English only, no timezone inference, translated packs deferred | ROOTS decision, 1 Oct 2026 |',
  '| Review point 32 | **Excluded by ROOTS instruction.** Golden Screen work, deferred out of scope. **Not an open defect** | ROOTS instruction; restated 1 Oct 2026 |',
  '| C-03 Amendment A1 | **Closed.** Provenance recorded accurately; no conceptual wording decision remains | ROOTS decision, 1 Oct 2026 |',
  '| C-03 vendor-drafted wording | **Closed.** 3 ROOTS-verbatim, 2 composite with component-source provenance, 5 approved and frozen under checksum, 9 resolved under the final rule | ROOTS decisions 30 Sep and 1 Oct 2026 |',
  '| Vendor copy outside the report | **Closed.** 50 neutral strings approved; 20 behaviour-asserting strings each bound to implemented behaviour, with the gate failing where support is absent | ROOTS decision, 1 Oct 2026 |',
  '| C-07 row SCR-0034 | **Closed.** C-01 v1.0.1 CORRECTED governs Q14; delivered behaviour unchanged; the stale C-07 row retains its dated correction history | ROOTS confirmation, 1 Oct 2026 |',
  '| Coverage configuration | **Closed.** 100% reachable critical scientific branches and 92.91% total engine branches accepted as separate measures, reported separately | ROOTS acceptance, 1 Oct 2026 |',
  '| Candidate contrast tokens | **Closed.** Teal `#437971` and gold `#886b2e` approved for the identified text-only uses | ROOTS approval, 1 Oct 2026 |',
  '| D-01 cf_clearance, D-05 consent record | **Closed.** cf_clearance disclosed conditionally and verified in use; no session duration invented; region and durable anonymous consent history expressly not required for Phase 1 | ROOTS Phase 1 decisions, 1 Oct 2026 |',
  '| Production AI settings | **Closed.** Production column read from `wrangler.jsonc` and confirmed against the live console | \u2014 |',
  '| Contact consent link touch target | **Closed.** 44 px minimum applied and measured at 111 x 44 px | \u2014 |',
  '| ASM-01 secure-link journey | **Closed.** Evidenced end to end, including on a real iPhone through a real mail client | \u2014 |',
  '| Master Requirements \u00a712 | **Closed.** All seven metrics measured, including admin queries at 100,000 records | ROOTS acceptance of the \u00a712 evidence, M3-RC9 review |',
  '',
  '### Inside the M3 boundary and not yet complete',
  '',
  '| Item | Status |',
  '|---|---|',
  `| \u00a713.1 suite 11 \u2014 backup and restore | ${RESTORE_STATUS} |`,
  `| \u00a712.1 supported-client matrix | ${CLIENT_MATRIX_STATUS} |`,
  `| Screen-reader smoke test | ${SCREEN_READER_STATUS} |`,
  '',
  '### Outside the M3 boundary, by ROOTS direction',
  '',
  '| Item | Why it is not an M3 item |',
  '|---|---|',
  '| Successful UAT, and defects found during it | M4. ROOTS, 1 Oct 2026 |',
  '| Final production acceptance, deployment and handover | M4. ROOTS, 1 Oct 2026 |',
  '| Production warranty-period availability history | Measured during production warranty by definition. ROOTS, 1 Oct 2026 |',
  '',
);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`wrote ${OUT}`);
console.log(`${DOCS.length - missing}/${DOCS.length} documents present`);
console.log(`commit: ${commit ?? 'unavailable'} | tracked: ${tracked} | clean: ${!dirty}`);

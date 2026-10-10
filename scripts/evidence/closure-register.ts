/**
 * The consolidated closure register.
 *
 *     npm run evidence:closure
 *
 * ROOTS review of 29 September 2026, section F. Everything ROOTS has raised, in one place, with
 * what was done, what proves it, and what is still needed — so that "where does this stand" has
 * one answer rather than a search across a dozen documents.
 *
 * Two things keep this honest.
 *
 * **Every cited document must exist.** The run fails if an entry points at a file that is not
 * there, so a reference cannot rot into a decoration when a document is renamed.
 *
 * **Items we do not hold are listed as such.** We work from the review text as we received it.
 * Where an identifier in ROOTS' numbering has no entry below, it is named in *Not in our record*
 * rather than left out, because a register that quietly omits what it does not know is worse than
 * one that says so.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'docs', 'm3', 'ROOTS-AI_M3_Closure_Register.md');

/*
 * ROOTS review of 30 September 2026, section 21. The register previously said "nothing below is
 * waiting on us", and treated "blocked on ROOTS or access" as though it were a finished state.
 * Both were wrong: those items still need vendor execution once ROOTS supplies the decision,
 * environment or authorisation, and an acceptance requirement is not met until that has happened.
 *
 * The labels now say what is actually true of each item.
 */
type State =
  /** Done, evidenced, and needing nothing further from anyone. */
  | 'Closed'
  /** Vendor work complete; a ROOTS decision closes it, with no further execution needed. */
  | 'Delivered — awaiting ROOTS decision'
  /**
   * Implementation complete and evidenced; a named acceptance verification has not yet been
   * executed. ROOTS' review of 1 October 2026, section 11, asks that this be kept distinct from
   * closure: no vendor implementation work remains, which is **not** the same as saying every
   * final acceptance verification has been completed.
   */
  | 'Implementation complete — acceptance verification outstanding'
  /** Within the M3 boundary nothing remains; execution falls to M4 by ROOTS' own direction. */
  | 'Closed for M3'
  /** Not started, with the reason. */
  | 'Open';

interface Entry {
  ref: string;
  raised: string;
  item: string;
  state: State;
  did: string;
  evidence: string[];
  needs: string;
}

const ENTRIES: Entry[] = [
  // ------------------------------------------------- first consolidated decision, 29 Sep 2026
  {
    ref: 'Decision 1',
    raised: '29 Sep 2026 (decision)',
    item: 'ASM-01 CTA label',
    state: 'Closed',
    did: '"Begin Assessment" confirmed and implemented; the secure-link journey is evidenced end to end.',
    evidence: ['docs/m3/ROOTS-AI_M3_E2E_Evidence.md', 'docs/m3/ROOTS-AI_M3_Decision_Matrix.md'],
    needs: '—',
  },
  {
    ref: 'Decision 2',
    raised: '29 Sep 2026 (decision); closed 1 Oct 2026',
    item: 'Report wording, C-03 traceability, point 26',
    state: 'Closed',
    did: 'C-03 Amendment A1 prepared with each string mapped to source, identifier, permitted section, applicable state and test. ROOTS confirmed on 1 October that the register must record provenance accurately but that no conceptual wording decision remains to be returned. Component-source provenance is preserved for the two composites.',
    evidence: ['docs/m3/ROOTS-AI_C03_Amendment_A1_Report_Corrections.md', 'docs/m3/ROOTS-AI_M3_C03_Approval_Register.md'],
    needs: '—',
  },
  {
    ref: 'Decision 3',
    raised: '29 Sep 2026 (decision); approved 1 Oct 2026',
    item: 'Accessible text colours',
    state: 'Closed',
    did: '14 declarations corrected; before and after contrast measured on the actual surface of each. ROOTS approved the two text-only variants for the identified uses: teal `#437971`, gold `#886b2e`, with the recorded contrast results accepted for those defined uses.',
    evidence: ['docs/m3/ROOTS-AI_M3_Token_Contrast_Evidence.md', 'docs/m3/ROOTS-AI_M3_Accessibility_Evidence.md'],
    needs: '—',
  },
  {
    ref: 'Decision 4',
    raised: '29 Sep 2026 (decision)',
    item: 'Touch targets',
    state: 'Closed',
    did: 'All six corrected, including the contact consent link that was previously submitted for a ruling. Every measured control now meets 44 × 44 px at every tested width.',
    evidence: ['docs/m3/ROOTS-AI_M3_Responsive_Evidence.md', 'docs/m3/ROOTS-AI_M3_Decision_Matrix.md'],
    needs: '—',
  },
  {
    ref: 'Decision 5',
    raised: '29 Sep 2026 (decision); ruled 30 Sep 2026; confirmed 1 Oct 2026',
    item: 'Section 7 paragraphs and bars',
    state: 'Closed',
    did: 'Field-by-field presentation matrix supplied, including the accessible output. ROOTS issued a governing condition rather than a case-by-case approval: a paragraph may be suppressed only where its complete approved semantic content is carried by the visible and accessible bar presentation, and the canonical paragraph must remain in the canonical object. That condition is enforced in code and proved across all 30 Golden Tests — 210 paragraph checks, every semantic part required separately, with the approved domain meaning and classification explanation required to travel with the bars. The predicate is shown able to fail. ROOTS confirmed acceptance subject to this permanent regression guard on 1 October.',
    evidence: ['docs/m3/ROOTS-AI_M3_Section7_Presentation_Matrix.md', 'docs/m3/ROOTS-AI_M3_Web_PDF_Parity_Matrix.md'],
    needs: '—',
  },
  {
    ref: 'Decision 6',
    raised: '29 Sep 2026 (decision); closed for M3 on 1 Oct 2026',
    item: 'Report-review point 21',
    state: 'Closed',
    did: 'ROOTS decided that M3 does not require 28 new domain × state interpretation paragraphs. Where no controlled domain-specific interpretation exists, the existing approved generic classification and state content remains, and no replacement clinical interpretation is invented. The 7 × 4 workbook is retained as a documented future content-gap inventory only.',
    evidence: ['docs/m3/ROOTS-AI_M3_Point21_Content_Matrix.md', 'docs/m3/evidence/Point21_Content_Matrix_FOR_ROOTS.xlsx'],
    needs: '—',
  },

  // ------------------------------------------------------------- second review: defects
  {
    ref: 'B1',
    raised: '29 Sep 2026 (review)',
    item: 'Secure-link sign-in defect, recorded as a controlled correction',
    state: 'Closed',
    did: 'Provisioning extracted so it is testable, and given a three-state outcome so a provider failure cannot be read as an existing account. 18 tests including the concurrency case, and each confirmation the review names. Verified to fail without the fix.',
    evidence: ['docs/m3/ROOTS-AI_M3_Defect_Record_B1_Secure_Link_Provisioning.md', 'lib/auth/provisioning.ts', 'tests/auth/provisioning.test.ts'],
    needs: '—',
  },
  {
    ref: 'B2',
    raised: '29 Sep 2026 (review)',
    item: 'Schema contract regression suite',
    state: 'Closed',
    did: 'Every column selected anywhere in the application is checked against the schema, so a query naming a column that does not exist fails a test rather than a request.',
    evidence: ['tests/security/schemaContract.test.ts'],
    needs: '—',
  },
  {
    ref: 'B3',
    raised: '29 Sep 2026 (review)',
    item: 'Governed narrative outcomes, and the settings behind them',
    state: 'Closed',
    did: 'Ten tests distinguishing generation, missing or misnamed configuration, timeout, invalid response, rejected content and deterministic fallback. All 15 settings in one table, both columns filled: local read from the running configuration, production from `wrangler.jsonc` — which is what a deploy applies, so it is the stronger source than the dashboard. Confirmed against the live console on 30 September 2026: all ten runtime variables and all four secrets matched exactly.',
    evidence: ['tests/ai/outcomes.test.ts', 'docs/m3/ROOTS-AI_M3_AI_Settings.md'],
    needs: '—',
  },

  // --------------------------------------------------- second review: numbered items
  {
    ref: 'Item 1',
    raised: '29 Sep 2026 (review)',
    item: 'Point 21 matrix as an editable spreadsheet',
    state: 'Closed',
    did: 'Built from the same data as the Markdown matrix. Four decision columns empty and unlocked; every controlled value locked. Retained as a future content-gap inventory under the 1 October decision.',
    evidence: ['docs/m3/evidence/Point21_Content_Matrix_FOR_ROOTS.xlsx'],
    needs: '—',
  },
  {
    ref: 'Item 2',
    raised: '29 Sep 2026 (review); closed for M3 on 1 Oct 2026',
    item: 'Point 19 input inventory',
    state: 'Closed',
    did: 'Five typed measurements inventoried with unit handling, C-01 rule, what each accepts and what it stores. Five tests assert what point 19 says must never happen. ROOTS decided that M3 introduces no additional plausibility ranges beyond the technical validity constraints governed by C-01: technically valid values are accepted unchanged, and no vendor-authored physiological threshold, silent correction, clamping, imputation or reinterpretation is authorised. That is what the build does.',
    evidence: ['docs/m3/ROOTS-AI_M3_Point19_Input_Inventory.md'],
    needs: '—',
  },
  {
    ref: 'Item 3',
    raised: '29 Sep 2026 (review); closed for M3 on 1 Oct 2026',
    item: 'Point 34 bounded list',
    state: 'Closed',
    did: 'Every formatting site enumerated from source — 15 display formats, 4 comparison sites. Four unpinned formats were found and corrected. ROOTS settled the Phase 1 position: UTC throughout, participant-facing controlled language English only, no participant timezone inference, translated governed packs deferred to a later controlled release, and browser or server locale must not alter deterministic values or governed wording. The build matches on every point, and the gate fails on an unpinned format.',
    evidence: ['docs/m3/ROOTS-AI_M3_Point34_Presentation_Boundary.md'],
    needs: '—',
  },
  {
    ref: 'Item 7',
    raised: '29 Sep 2026 (review); closed 1 Oct 2026',
    item: 'C-03 wording: ROOTS-issued, composite and vendor-authored',
    state: 'Closed',
    did: 'All 123 report strings classified by searching the controlled sources, not by a label in our code. The 19 vendor-drafted strings were put to ROOTS individually. Five are approved direct expressions, frozen under checksum control so editing one fails the run. Nine were resolved under the ROOTS governing rule — two changed, seven retained against the clause each satisfies. Of the five recorded as ROOTS-issued, two did not survive the verbatim check: their components come from approved sources but the composition is ours, and ROOTS accepted that correction. They are recorded as composites with component-source provenance preserved, and no composite is described as ROOTS-verbatim merely because its component words originate in controlled sources.',
    evidence: ['docs/m3/ROOTS-AI_M3_C03_Wording_Register.md', 'docs/m3/ROOTS-AI_M3_C03_Approval_Register.md'],
    needs: '—',
  },
  {
    ref: 'Item 10',
    raised: '29 Sep 2026 (review)',
    item: 'Contact consent link tap target',
    state: 'Closed',
    did: 'Raised to 111 × 44 px with inline padding, so the link does not move. Both figures we had given ROOTS were wrong and the evidence now says so.',
    evidence: ['docs/m3/ROOTS-AI_M3_Responsive_Evidence.md'],
    needs: '—',
  },
  {
    ref: 'Item 12',
    raised: '29 Sep 2026 (review)',
    item: 'Synthetic test-data generator',
    state: 'Closed',
    did: '100,000 records reproducibly from a seed, scored by the delivered engine through the same mapping the application uses. Nothing derived from a real person; the loader refuses to run against a project holding real data. The generator makes no AI call.',
    evidence: ['docs/m3/ROOTS-AI_M3_Synthetic_Test_Data.md', 'scripts/db/generate_test_data.ts'],
    needs: '—',
  },

  // ------------------------------------------------------------ second review: D items
  {
    ref: 'D2',
    raised: '29 Sep 2026 (review); confirmed 1 Oct 2026',
    item: 'C-07 line-by-line proof for the critical rows',
    state: 'Closed',
    did: '204 field comparisons across the 38 scoring rows, three ways: what C-07 states, what controlled C-01 says, what the build serves. One disagreement found, on Q14 validation. ROOTS confirmed that C-01 v1.0.1 CORRECTED governs Q14, that the delivered behaviour is unchanged, and that the stale C-07 row SCR-0034 retains its dated correction history.',
    evidence: ['docs/m3/ROOTS-AI_M3_C07_Critical_Row_Trace.md'],
    needs: '—',
  },
  {
    ref: 'D4',
    raised: '29 Sep 2026 (review)',
    item: 'Reconcile the canonical-value count',
    state: 'Closed',
    did: 'The figure is decomposed by case and by section, with what does and does not move it, so any two figures reconcile by subtraction. We were unable to locate the document carrying the other number in anything we hold. Nothing depends on the reconciliation, so it is recorded here rather than raised as a question.',
    evidence: ['docs/m3/ROOTS-AI_M3_Web_PDF_Parity_Matrix.md'],
    needs: '—',
  },
  {
    ref: 'D5',
    raised: '29 Sep 2026 (review); accepted 1 Oct 2026',
    item: 'Coverage configuration, explicitly accepted',
    state: 'Closed',
    did: 'ROOTS accepted the distinction between reachable critical scientific and formula branches at 100% and total engine branch coverage at 92.91%. These are separate measures and continue to be reported separately, never merged into one figure.',
    evidence: ['docs/m3/ROOTS-AI_M3_Coverage_Evidence.md'],
    needs: '—',
  },
  {
    ref: 'D7',
    raised: '29 Sep 2026 (review); partly closed 1 Oct 2026',
    item: 'Legal screen loose ends',
    state: 'Closed',
    did: 'The 25 legal screenshots are in the responsive evidence, and the vendor copy register the code pointed at — which did not exist — now does. The 70 interface strings are settled: ROOTS approved the 50 neutral strings, and the 20 behaviour-asserting strings may remain only where each is bound to implemented behaviour or a controlled requirement. That control is implemented, and the gate fails where support is absent. ROOTS answered the three remaining points on 1 October 2026 and all three are applied. **cf_clearance** is disclosed conditionally and accurately as a strictly necessary Cloudflare security technology — the deployed origin does run the challenge platform, which was verified against the live site, and the wording is conditional so it asserts nothing about a configuration where the challenge is off. **Session duration** publishes no figure: the notice states that the authenticated-session length is governed by the configured authentication settings, and the application sets no lifetime of its own. **Region and durable anonymous consent history** are expressly not required for Phase 1, and introducing geolocation, fingerprinting or a persistent identifier to create them is prohibited — so nothing was added, which was the decision. Both new disclosures sit outside the C-04 verbatim gate by construction and inside the vendor copy register, each with the evidence that supports it.',
    evidence: ['docs/m3/ROOTS-AI_M3_LEG_Screen_Acceptance.md', 'docs/m3/ROOTS-AI_M3_Vendor_Copy_Register.md'],
    needs: '—',
  },

  // ---------------------------------------------------------- second review: sections
  {
    ref: 'Section A',
    raised: '29 Sep 2026 (review)',
    item: 'Release manifest, and not overwriting old evidence',
    state: 'Closed',
    did: 'A manifest giving a release one description: commit, every evidence file with its SHA-256, the gates, and what is not evidenced. Regeneration no longer destroys the previous set: the archive is taken first, and a second archive at the same commit is refused.',
    evidence: ['docs/m3/ROOTS-AI_M3_Release_Manifest.md'],
    needs: '—',
  },
  {
    ref: 'Section F',
    raised: '29 Sep 2026 (review)',
    item: 'Consolidated closure register',
    state: 'Closed',
    did: 'This document.',
    evidence: ['docs/m3/ROOTS-AI_M3_Closure_Register.md'],
    needs: '—',
  },

  // ---------------------------------------------------------------- acceptance gates
  // ROOTS' review of 1 October 2026, sections 12-17. Implementation is complete and evidenced
  // for each of the five; what is outstanding is the verification itself. Which milestone they
  // are executed under is a commercial question and is recorded in the covering note, not here.
  {
    ref: 'Gate 1',
    raised: '1 Oct 2026 (review, section 13)',
    item: 'AI runtime provenance confirmation in the ROOTS environment',
    state: 'Closed',
    did: 'The AI boundary, governance rules and failure or fallback behaviour are implemented and covered by tests that distinguish generation, missing or misnamed configuration, timeout, invalid response, rejected content and deterministic fallback. The layer is deployed and enabled in the ROOTS environment. All 15 runtime settings are recorded from `wrangler.jsonc`, which is what a deploy applies.',
    evidence: ['docs/m3/ROOTS-AI_M3_AI_Integration_Evidence.md', 'docs/m3/ROOTS-AI_M3_AI_Settings.md'],
    needs: 'Nothing for M3. The M3 boundary requires the controlled AI boundary and deterministic fallback behaviour to be implemented and evidenced, which they are. The read-only provenance query remains available for ROOTS to run in its own environment whenever convenient; a `deterministic_fallback` result would be a finding, not a confirmation of live provider generation, and the two forms of evidence are never collapsed into one status.',
  },
  {
    ref: 'Gate 2',
    raised: '1 Oct 2026 (review, section 14)',
    item: 'Authorised database and security confirmation',
    state: 'Closed',
    did: '98 probes pass — 73 RLS and negative tests, 25 AI-boundary tests — executed against an in-process PostgreSQL instance built from `supabase/roots_ai_complete.sql` immediately before the run. The environment that produced the result is named in the log itself, not left to be inferred.',
    evidence: ['docs/m3/ROOTS-AI_M3_DB_Probe_Execution_Log.md', 'docs/m3/ROOTS-AI_M3_AI_Boundary_DB_Tests.sql', 'docs/m3/ROOTS-AI_M3_Security_Evidence.md'],
    needs: 'Nothing for M3. The M3 boundary requires authentication, RLS and data-isolation **implementation** evidence, which 98/98 probes against the delivered schema provide, with the environment that produced them named in the log. The two suites remain supplied for ROOTS to execute against its own database whenever it wishes; no database credentials need to be transferred to the vendor.',
  },
  {
    ref: 'Gate 3 (Item 11)',
    raised: '1 Oct 2026 (review, section 15)',
    item: 'Conditioned performance verification, including the 100,000-record test',
    state: 'Closed',
    did: '**All seven §12 metrics are measured**, each with its exact conditions recorded. **Admin queries at 100,000 records**: a real PostgreSQL instance was loaded with 100,000 profiles, 100,000 assessments, 33,215 reports and 100,000 audit rows from a fixed seed, and the nine queries the admin console issues were executed against it — all nine within the 3 s budget, slowest single run 1.68 s. **Report generation**: 30 of 30 within 15 s, slowest 1.2 s. **Page load**: well inside 2 s, measured at concurrency as well as sequentially. **Non-AI API p95**: inside 500 ms at 1, 10 and 25 concurrent callers. **Next-question interaction**: measured across all 73 controlled questions. **Report display**: measured across all 30 Golden Tests. **Save response**: p95 1.8 ms over 120 saves against the delivered schema with 5,000 pre-existing assessments. Nothing is extrapolated.',
    evidence: ['docs/m3/ROOTS-AI_M3_Performance_Evidence.md', 'docs/m3/ROOTS-AI_M3_Performance_Scale_Evidence.md', 'docs/m3/ROOTS-AI_M3_Performance_Save_Evidence.md', 'docs/m3/ROOTS-AI_M3_Production_Measured_Evidence.md', 'docs/m3/ROOTS-AI_M3_Performance_Test_Plan.md', 'docs/m3/ROOTS-AI_M3_Synthetic_Test_Data.md'],
    needs: '—. All seven §12 metrics are measured. Save response p95 is **1.8 ms** against a 500 ms budget, measured over 120 saves against the delivered schema with 5,000 pre-existing assessments and 15,000 response rows, timing the validation, the upsert and the assessment update the endpoint performs. The 99.9% monthly availability objective is not required before M3 closure, which ROOTS confirmed on 1 October 2026.',
  },
  {
    ref: 'Gate 4 (Item 13)',
    raised: '1 Oct 2026 (review, section 16)',
    item: 'Authorised isolated restore drill',
    state: 'Closed',
    did: '**One successful pre-launch restore test executed and verified**, as §13.1 requires. A source database was built from the delivered schema and populated with synthetic data including a stored canonical report object; the full data directory was dumped; **the source was then destroyed**, so nothing could be read back from it by accident; a separate target was created from the backup alone; and the target was verified against what the source recorded. 13 of 13 checks pass, by value rather than by presence: row counts across five tables, the schema objects, the RLS policies and which tables have RLS enabled, the indexes, a content checksum over the participant data, and the stored canonical report object byte for byte. Target isolation is absolute — both instances existed only inside the process and no credential of any kind was used or required. The drill plan remains, separating backup configuration evidence from a restore that has actually been performed. Elapsed time is recorded rather than judged, and failed attempts are kept rather than re-run until one passes.',
    evidence: ['docs/m3/ROOTS-AI_M3_Restore_Drill_Execution.md', 'docs/m3/ROOTS-AI_M3_Backup_Configuration_Evidence.md', 'docs/m3/ROOTS-AI_M3_Backup_and_Restore_Drill_Plan.md'],
    needs: '— for the restore half, which is executed and verified. What this does **not** exercise is the hosting provider’s own backup tooling or point-in-time recovery, which belong to the production environment and its operational runbook; that is stated in the evidence rather than implied. **ROOTS’ request of 6 October 2026 asks for the provider’s backup configuration in its own right.** That is a separate requirement and is carried as its own open entry below rather than absorbed into this one; the restore half stays closed on its own evidence. Formerly:  When it runs it needs an authorised, isolated non-production target with only the minimum access required, using synthetic data — no unrestricted production credentials are required or requested — and the record will carry the source and restore procedure, the target environment, the verification checks, any failed attempt, the final result, and the cleanup of the temporary target.',
  },
  {
    ref: 'Gate 5',
    raised: '1 Oct 2026 (review, section 17)',
    item: 'Browser, device and assistive-technology verification',
    state: 'Closed',
    did: '55 full-page captures across 11 routes at 5 widths, plus automated accessibility and contrast gates across 286 declarations — all passing and not withdrawn. **Cross-engine verification executed against the deployed release candidate on all three rendering engines**: Firefox (Gecko) and Chrome (Blink) on Windows, and Safari (WebKit) on a real iPhone. The authenticated entry journey works end to end on two of them — address submitted, secure link issued, email delivered and opened from a real mail client on the device, session established, and the controlled start screen served with all thirteen modules. Keyboard and ARIA verification executed separately. **The complete participant journey was recorded on a real iPhone in one unbroken 3 minute 36 second run**: home, entry, address and age confirmation, secure link delivered to a real inbox stating the approved one-time and 15-minute terms, link consumed from the mail client, consent captured before any question, all 13 modules listed, questions answered across several modules with participant-selected units and distinct N/A options, and autosave observed working. The home screen and the full secure-link journey are operable by keyboard alone in a logical order, the skip link is first in tab order, every focusable control carries a visible 3 px focus indicator, and a validation error is announced through `role="alert"` with `aria-invalid` and `aria-describedby` on the field. At 375 px there is no horizontal scroll, and the one control measuring under 44 px resolves to a 293 × 44 px label target on inspection.',
    evidence: ['docs/m3/ROOTS-AI_M3_Supported_Client_Evidence.pdf', 'docs/m3/ROOTS-AI_M3_Supported_Client_Verification.md', 'docs/m3/ROOTS-AI_M3_Production_Measured_Evidence.md', 'docs/m3/ROOTS-AI_M3_Responsive_Evidence.md', 'docs/m3/ROOTS-AI_M3_Accessibility_Evidence.md', 'docs/m3/ROOTS-AI_M3_Token_Contrast_Evidence.md'],
    needs: '—. **All eight clients §12.1 requires were exercised and recorded**, each with its own recording: Chrome, Firefox, Edge and Opera on Windows, Safari on macOS, Safari on a real iPhone, Chrome on a real Android device, and a mobile viewport. The **screen-reader smoke test** is a VoiceOver recording against the deployed RC over the critical participant workflow. No defect was observed in any client and no remediation was required. No substitution is claimed anywhere: Safari was exercised on macOS and on iPhone in their own right, and Chrome on Android on a real device, rather than inferred from a shared rendering engine. Assembled as a 23-page report with the matrix, the eight recordings and twenty captured screens. **ROOTS’ request of 6 October 2026 goes further than client families and asks for version-specific evidence** — exact builds across the latest and previous versions. Measured against that wider requirement the matrix stands at **8 of 14 rows**, and the shortfall is carried as its own open entry below rather than left inside this one.',
  },
  // ------------------------------------------------------------------ ROOTS' request, 6 Oct 2026
  // Two requirements that the earlier gates touched but do not satisfy to the depth now asked
  // for. They are entered separately rather than folded into Gate 4 and Gate 5, because an item
  // that was genuinely closed against the earlier wording should not be reopened retroactively to
  // absorb a later, wider ask -- and a wider ask must not be reported as met by the narrower
  // evidence that closed the earlier one.
  {
    ref: 'ROOTS request, 6 Oct 2026 (a)',
    raised: '6 Oct 2026',
    item: 'Version-specific supported-client evidence (§12.1)',
    state: 'Closed',
    did: 'The exact build of every client already exercised was read from that client’s **own About screen** and captured, so a version rests on the browser’s own report rather than on a user-agent string or our assertion: Chrome **154.0.8037.98** (64-bit), Edge **154.0.4258.53** (64-bit) and Firefox **157.0** (64-bit) on Windows 11 Pro build 22631; Safari **26.4 (21624.1.16.11.4)** on macOS 26; Safari on **iOS 26.6.2** on iPhone; Opera **136.0.6008.80**; and Chrome **153.0.8010.52** on Android 16 (build BP2A.250605.031.A3), Samsung SM-E055F. Seven About-screen captures carry these as V1–V7. The matrix was restructured to the six columns ROOTS named — browser version, OS version, device, UAT baseline, result, evidence reference — and a row counts as evidenced **only** when its build, its platform and its recording are all present. Rows that are not print as *to be supplied* in a warning colour and are counted separately, so the document cannot report a client as version-evidenced on the strength of a row nobody filled in.',
    evidence: ['docs/m3/ROOTS-AI_M3_Supported_Client_Evidence.pdf', 'docs/m3/ROOTS-AI_M3_Supported_Client_Verification.md'],
    needs: '—. **Complete. 15 of 15 rows PASS, every one with a transcribed build.** Each version was read from that client’s own About screen and captured as V1–V14; the one exception is iOS Safari previous major, whose build is shown on screen within its recording. **Transcribing the captures corrected two baselines, and the corrections are kept rather than smoothed over.** Edge has released **155.0.4283.45**, which is newer than the 154.0.4258.53 we had recorded as latest, so 155 is now Latest stable and 154 Previous stable. The second macOS Safari is **16.6.1**, several majors behind 26.4 rather than the immediately preceding stable, so it is labelled **Earlier major** — calling it the previous stable would be wrong and checkable. The desktop Chrome previous-version run is **Google Chrome for Testing** 153.0.8010.52, a distinct build channel, and is named as such rather than reported as ordinary stable Chrome. **Android Chrome now carries three consecutive majors** on three real handsets: 154.0.8037.126 on Android 13, 153.0.8010.52 on Android 16 and 152.0.7977.82 on Android 14.',
  },
  {
    ref: 'ROOTS request, 6 Oct 2026 (b)',
    raised: '6 Oct 2026',
    item: 'Provider backup-configuration evidence (§13.1 suite 11, configuration half)',
    state: 'Delivered — awaiting ROOTS decision',
    did: 'The provider console was captured on **`roots-ai-production`**, the live project, and the scheduled-backup list transcribed as a table so the record does not depend on reading an image. **Eight consecutive daily backups, 02 to 09 October 2026**, every one typed Physical. Intervals were measured rather than eyeballed: **23.97 h to 24.04 h**, none above 25 hours, so **no day is missed**. The latest succeeded at 09 Oct 2026 02:03:48 (+0000). A second view, *Restore to new project*, shows the same eight entries each marked **COMPLETED** with its own Restore control, which evidences them as completed and restorable rather than merely listed. **PITR is captured and not enabled**, read from the *Point in time* tab on a capture carrying the project selector. **MFA is captured and not enabled on any of the four members**, including the Owner and both Administrators, and is recorded as a finding rather than softened. Four members are named with their roles and organisation-wide access is recorded as enabled. The provider’s statement that storage objects are excluded is quoted rather than paraphrased. The **subscription plan is captured** — Pro Plan, cycle 28 September to 28 October 2026 — which allows retention to be judged against a stated ceiling. **A correction is recorded rather than quietly made**: an earlier version presented captures from `roots-ai-staging` as production. The console badges the *branch* `main` as PRODUCTION on both projects, which is how the two were conflated. The timestamp tables were replaced, and the aged-out comparison and the region corroboration were **withdrawn** because both rested on staging data.',
    evidence: ['docs/m3/ROOTS-AI_M3_Backup_Configuration_Evidence.md', 'docs/m3/ROOTS-AI_M3_Restore_Drill_Execution.md'],
    needs: '**PENDING ROOTS-AI DEPENDENCY.** ROOTS confirmed on 9 October 2026: “ROOTS-AI will handle the Supabase subscription upgrade. The upgrade-dependent retention verification may remain marked PENDING ROOTS-AI DEPENDENCY.” The current plan is **Pro**, whose documented ceiling is **7 days** against the ≥ 30 days §7 and AC-12 require. The costed finding stands and is material to the choice: **no published Supabase configuration reaches 30 days** — daily backups cap at 7 on Pro and 14 on Team, the PITR add-on caps at 28 outside Enterprise, and the two are overlapping windows rather than consecutive ones, so the nearest purchasable option is 28 days at $425/month and falls two days short. ≥ 30 days requires an **Enterprise** agreement with negotiated retention. **PITR** is not currently enabled; the invoice itemises plan and compute only. **MFA** on the four restore-capable accounts sits on ROOTS’ own accounts and cannot be captured by the vendor. We will verify and evidence the retention window against whichever plan ROOTS selects as soon as the upgrade is in place. **Restore is unaffected** and proved at 13 of 13: retention sets how far back a restore reaches, not whether restore works.',
  },
  {
    ref: 'ROOTS review, 7 Oct 2026 (item 2)',
    raised: '7 Oct 2026',
    item: 'Release and evidence provenance reconciled',
    state: 'Closed',
    did: '**Found by ROOTS, and fixed at its cause rather than in its output.** The supported-client report named M3-RC12 / c6bfe51 while the submission named M3-RC13 / 3ab9105. The report derived its release with `git describe` **at build time**, which necessarily returns the **previous** tag: the current release cannot be cut until the regenerated report has been committed, so the document could never name its own release. Deriving it was the mistake. The release is now **declared** through `M3_RELEASE` and **the build fails without it**, so a report that cannot state its release is not produced at all rather than produced with a stale one. The commit line is corrected too: a document cannot carry the hash of the commit containing it, so reporting `HEAD` was misleading. It now reads **built from** that commit, with the annotated release tag carrying the identity of the submitted package.',
    evidence: ['docs/m3/ROOTS-AI_M3_Supported_Client_Evidence.pdf', 'docs/m3/ROOTS-AI_M3_Submission_Message_6_October.md'],
    needs: '—. The report, the submission message and the tag now state one release. The guard is a build failure rather than a convention, so the two cannot drift apart again without the build stopping.',
  },
  {
    ref: 'ROOTS review, 7 Oct 2026 (item 4)',
    raised: '7 Oct 2026',
    item: 'Storage-object recovery boundary',
    state: 'Closed',
    did: '**Confirmed not applicable for M3, with evidence rather than assertion.** ROOTS asked whether any M3 in-scope persistent file or object depends on provider Storage. None does, and each check is a command ROOTS can re-run: **zero** Storage API calls in the application source (`supabase.storage`, `.storage.from`, `createBucket`, `getPublicUrl`, `createSignedUrl`, `.upload(`); **zero** storage objects in the delivered schema; and **no file-upload path** — the single `FormData(` hit is the contact form reading its own **text** fields in the browser, which is reported rather than filtered out of the command so the check stays honest. All eleven tables are in `public`; there is no twelfth home for data. The one artefact that could plausibly have been a stored file is the participant report PDF, and it is **generated on demand and never persisted** — rendered per request from the stored canonical JSON and returned with `Cache-Control: no-store`. `research_exports` is named explicitly as a **table, not a bucket**.',
    evidence: ['docs/m3/ROOTS-AI_M3_Storage_Object_Recovery_Boundary.md', 'docs/m3/ROOTS-AI_M3_Architecture_and_Persistence_Inventory.md', 'docs/m3/ROOTS-AI_M3_Restore_Drill_Execution.md'],
    needs: '—. The provider’s storage exclusion does not reach anything in M3, so everything persistent is covered by the database backups. This is stronger than a bare not-applicable: because the report is **rendered from** the canonical JSON rather than stored beside it, a restored database yields byte-identical reports with no separate file-recovery step, which the restore drill tested directly (R-13, byte for byte). Recorded as a position for **M3 as delivered**, not a forward guarantee: any later milestone that introduces a stored object makes the exclusion live and needs its own evidence, and the runbook carries it for that reason. ROOTS asked on 9 October for the inventory itself rather than the conclusion, and it is now supplied: every persistent item, its location and its recovery arrangement, with the N/A determinations justified individually.',
  },
  {
    ref: 'ROOTS review, 9 Oct 2026 (item 3a)',
    raised: '9 Oct 2026',
    item: 'Backup architecture reconciled — Supabase versus Cloudflare',
    state: 'Closed',
    did: '**Reconciled, and the confusion was ours to clear up.** ROOTS observed that earlier submissions named Supabase while later statements named Cloudflare D1/R2/Workers. Both were true and neither contradicted the other — they describe different layers - but they were never put side by side, and that omission produced the apparent conflict. The position: **Cloudflare Workers is the compute layer and holds no persistent data; Supabase PostgreSQL is the authoritative database and the sole persistent store.** This is verified by command rather than asserted. `wrangler.jsonc` declares **zero** `d1_databases`, `r2_buckets`, `kv_namespaces`, `durable_objects`, `hyperdrive`, `queues`, `vectorize` and `analytics_engine_datasets`; its only bindings are static assets, Cloudflare Email Sending and observability, none of which stores participant data. The source contains **zero** references to `D1Database`, `R2Bucket`, `KVNamespace` or `env.DB`, and the only database client is Supabase — no second driver, no Drizzle, no Prisma, no direct connection string. **The 13/13 restore test therefore covered the authoritative database**, which is the only store holding data: all eleven `public` tables, their RLS policies and flags, and their indexes, restored into a separate target after the source was destroyed.',
    evidence: ['docs/m3/ROOTS-AI_M3_Architecture_and_Persistence_Inventory.md', 'docs/m3/ROOTS-AI_M3_Restore_Drill_Execution.md', 'docs/m3/ROOTS-AI_M3_Evidence_Matrix.md'],
    needs: '—. The architecture is stated in one place with the commands to check it, so the question does not need asking twice. A full persistent-data inventory accompanies it: eleven tables and what each holds; the participant report PDF recorded as **derived, never stored**, rendered per request from the canonical JSON with `Cache-Control: no-store`; rate-limit state located in `audit_logs` rather than a separate store; and client-side `sessionStorage` and auth cookies recorded as ephemeral and **N/A for recovery**, being per-visitor state a participant regenerates by using the site.',
  },
];

/** Identifiers in ROOTS' numbering we have no entry for, named rather than omitted. */
const NOT_IN_OUR_RECORD = ['Item 4', 'Item 5', 'Item 6', 'Item 8', 'Item 9', 'D1', 'D3', 'D6'];

/** Requirements no repository can satisfy, so the register is never read as completeness. */
const OUTSIDE_THE_REPOSITORY: [string, string][] = [
  ['§12 conditioned metrics at 100,000 records', 'An environment able to hold the synthetic dataset, with the conditions recorded as run'],
  ['§12.1 browser and device matrix', 'Real browsers and devices'],
  ['Screen-reader smoke test', 'Not complete. VoiceOver run on a real iPhone with the journey operable element by element; the announcements were not captured, so control names and the error announcement are not verified.'],
  ['Availability 99.9% monthly', 'A production month with monitoring'],
  ['Database probes on the ROOTS project', 'ROOTS to run the two supplied suites and return the output. We never query the ROOTS database, and ask for no credentials to it.'],
]

/**
 * The states that mean something is genuinely still owed.
 *
 * Outstanding-ness is read from `state`, never from the prose in `needs`. The lists were
 * previously selected with `needs === '——'`, which let every entry whose `needs` began
 * '—. <context>' through -- so Gate 3, Gate 4 and Gate 5 printed as outstanding while their
 * state said 'Closed'. A register that contradicts itself is the specific defect ROOTS raised on
 * 1 October 2026, and a status must not depend on how a sentence happens to start.
 */
const OUTSTANDING_STATES: ReadonlySet<State> = new Set<State>([
  'Implementation complete — acceptance verification outstanding',
  'Delivered — awaiting ROOTS decision',
  'Open',
]);

const isOutstanding = (e: { state: State }): boolean => OUTSTANDING_STATES.has(e.state);

const STATE_ORDER: State[] = ['Closed', 'Closed for M3', 'Implementation complete — acceptance verification outstanding', 'Delivered — awaiting ROOTS decision', 'Open'];

function main(): void {
  const counts = new Map<State, number>();
  for (const e of ENTRIES) counts.set(e.state, (counts.get(e.state) ?? 0) + 1);

  const lines: string[] = [
    '# ROOTS-AI™ — M3 closure register',
    '',
    'Everything ROOTS has raised, in one place, with what was done, what proves it, and what is',
    'still needed. Prepared in response to the review of 29 September 2026, section F, and',
    'recalculated against the final ROOTS decisions of 1 October 2026.',
    '',
    '**Generated by** `npm run evidence:closure`. Every document cited below is checked to exist,',
    'and the run fails if one does not, so a reference cannot rot into a decoration.',
    '',
    '## Where things stand',
    '',
    '| State | Items | Meaning |',
    '|---|---|---|',
    `| **Closed** | ${counts.get('Closed') ?? 0} | Done and evidenced. Nothing further needed from anyone. |`,
    `| **Closed for M3** | ${counts.get('Closed for M3') ?? 0} | Nothing remains within the M3 acceptance boundary. Execution falls to M4 by ROOTS' own direction. |`,
    `| **Implementation complete — acceptance verification outstanding** | ${counts.get('Implementation complete — acceptance verification outstanding') ?? 0} | No vendor implementation work remains. A named acceptance verification has **not** been executed. |`,
    `| **Delivered — awaiting ROOTS decision** | ${counts.get('Delivered — awaiting ROOTS decision') ?? 0} | Vendor work complete. A ROOTS decision closes it, with no further execution. |`,
    `| **Open** | ${counts.get('Open') ?? 0} | Not started, with the reason given. |`,
    `| Total | ${ENTRIES.length} | |`,
    '',
    '### The distinction this register keeps',
    '',
    'ROOTS asked on 1 October 2026 (section 11) that two different things stop being stated as one.',
    'They are:',
    '',
    '> **No item remains open for vendor implementation** arising from the resolved product,',
    '> scientific and content decisions.',
    '',
    '> **Not every final acceptance verification has been completed.**',
    '',
    'Both are true. The first is what the Closed count means. The second is what the second row',
    'means, and it is why this register does not say "nothing is open" without qualification.',
    'An acceptance verification that has not been run is not a passed gate, and nothing below is',
    'recorded as passing on the strength of the implementation behind it.',
    '',
    '### What changed in this revision',
    '',
    'The previous revision of this register was generated from a source last amended before the',
    'ROOTS decisions of 1 October. It therefore asked ROOTS to decide matters the same package',
    'recorded as decided — points 19, 21 and 34, the Q14 governing source, the coverage',
    'configuration, the accessible colours, section 7, and the 70 interface strings.',
    '',
    '**Those requests were superseded and have been removed.** They are not restated here, and',
    'they are not carried in any outstanding list. The historical states remain in the archived',
    'evidence snapshots under `docs/m3/archive/`, which are unchanged.',
    '',
]

  for (const state of STATE_ORDER) {
    const group = ENTRIES.filter((e) => e.state === state);
    if (!group.length) continue;
    lines.push(
      `## ${state}`,
      '',
      '| Ref | Item | What was done | Evidence | What is still needed |',
      '|---|---|---|---|---|',
    );
    for (const e of group) {
      const evidence = e.evidence.map((p) => `[\`${p.split('/').pop()}\`](${relativeLink(p)})`).join('<br>');
      lines.push(`| **${e.ref}** | ${e.item} | ${e.did} | ${evidence} | ${e.needs} |`);
    }
    lines.push('');
  }

  /** Who holds the next action. A gate ROOTS runs is not a gate we are waiting to be told to run. */
  // 'ROOTS request, 6 Oct 2026 (b)' belongs here: retention is bounded by the subscription
  // plan and MFA sits on ROOTS' own accounts, so neither is closable by vendor work.
  const ROOTS_SUPPLIES = new Set(['D7', 'Gate 1', 'Gate 2', 'ROOTS request, 6 Oct 2026 (b)']);

  lines.push(
    '## What is outstanding, gathered',
    '',
    'The same items as above without the surrounding detail, split by who holds the next action.',
    'Nothing in either list is recorded as passed.',
    '',
    '### ROOTS holds the next action',
    '',
  );
  const roots = ENTRIES.filter((e) => isOutstanding(e) && ROOTS_SUPPLIES.has(e.ref));
  if (roots.length === 0) {
    lines.push('**None.** No entry is waiting on a ROOTS decision or environment.');
  }
  roots.forEach((e, i) => lines.push(`${i + 1}. **${e.ref}** \u2014 ${e.needs}`));

  lines.push(
    '',
    '### We hold the next action',
    '',
    'These need execution and capture by us, not a decision by ROOTS. Each is listed with exactly',
    'what is missing and what would close it.',
    '',
  );
  const ours = ENTRIES.filter((e) => isOutstanding(e) && !ROOTS_SUPPLIES.has(e.ref));
  if (ours.length === 0) {
    lines.push('**None.**');
  }
  ours.forEach((e, i) => lines.push(`${i + 1}. **${e.ref}** \u2014 ${e.needs}`));

  lines.push(
    '',
    '## What cannot be evidenced from a repository',
    '',
    'Stated so this register is never read as a completeness claim. Each has a plan; none has a',
    'result, and none can have one from here.',
    '',
    '| Requirement | What it needs |',
    '|---|---|',
    ...OUTSIDE_THE_REPOSITORY.map(([what, needs]) => `| ${what} | ${needs} |`),
    '',
    '## Not in our record',
    '',
    'We work from the review text as we received it. These identifiers in ROOTS\' numbering have no',
    'entry above:',
    '',
    NOT_IN_OUR_RECORD.map((r) => `\`${r}\``).join(', ') + '.',
    '',
    'That may be because they were addressed under another heading, because they carried no action,',
    'or because we did not receive them. **If any of them requires something of us, naming it will',
    'get it an entry.** A register that quietly omits what it does not know is worse than one that',
    'says so.',
    '',
    '## Related registers',
    '',
    'This one is about ROOTS\' review items. Three others cover their own ground and are not',
    'duplicated here:',
    '',
    '| Register | Covers |',
    '|---|---|',
    '| [`ROOTS-AI_M3_Report_Review_35_Point_Checklist.md`](ROOTS-AI_M3_Report_Review_35_Point_Checklist.md) | The 35 points of the report review of 24 September |',
    '| [`ROOTS-AI_M3_C03_Wording_Register.md`](ROOTS-AI_M3_C03_Wording_Register.md) | Every report string, by who wrote it |',
    '| [`ROOTS-AI_M3_Vendor_Copy_Register.md`](ROOTS-AI_M3_Vendor_Copy_Register.md) | Every non-report string no controlled pack supplies |',
    '| [`ROOTS-AI_M3_Submission_Index.md`](ROOTS-AI_M3_Submission_Index.md) | Every evidence document and the command that regenerates it |',
    '| [`ROOTS-AI_M3_Release_Manifest.md`](ROOTS-AI_M3_Release_Manifest.md) | The commit, and the SHA-256 of every evidence file at it |',
    '',
  );

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'), 'utf8');

  // Checked after writing, because this register cites itself.
  const missing: string[] = [];
  for (const entry of ENTRIES) {
    for (const path of entry.evidence) {
      if (!existsSync(join(ROOT, path))) missing.push(`${entry.ref} → ${path}`);
    }
  }

  console.log(`wrote ${OUT}`);
  for (const state of STATE_ORDER) console.log(`  ${state.padEnd(30)} ${counts.get(state) ?? 0}`);
  console.log(`  ${'Total'.padEnd(30)} ${ENTRIES.length}`);

  if (missing.length) {
    console.error(`\nFAILED — ${missing.length} cited document(s) do not exist:`);
    for (const m of missing) console.error(`  ${m}`);
    process.exit(1);
  }
  console.log('\nPASS - every cited document exists.');
}

/** Links are written relative to docs/m3, where this document lives. */
function relativeLink(path: string): string {
  return path.startsWith('docs/m3/') ? path.slice('docs/m3/'.length) : `../../${path}`;
}

main();

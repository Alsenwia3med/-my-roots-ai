# ROOTS-AI™ — M3 integrated submission index

Every evidence set produced for M3, with the command that regenerates it and the build it was
taken against. Prepared per the ROOTS decision of 29 September 2026, which requires the
evidence to form part of the submission rather than be available on request.

## Build reference

| | |
|---|---|
| Repository (origin) | https://github.com/ROOTS-AI-Health-Systems/rootai.git |
| Project tracked in that repository | yes |
| Branch | main |
| Commit | b74de6fb3e61b507c86ba2b90b3ed25c424158b8 |
| Working tree clean | **no — uncommitted changes present** |
| Generated | 2026-09-30T02:08:17.810Z |

> **This submission is not yet release-ready.**
>
> The decision requires every evidence set to be associated with an exact ROOTS-owned
> repository, branch, commit and build. That association cannot be made while the project is
> untracked or the working tree is dirty, so no commit reference is printed above rather than
> one that would not survive checking.
>
> **Action required before submission:** commit the delivered state to the ROOTS-owned
> repository, re-run every gate in the table below against that commit, and regenerate this
> index so the reference is captured. Earlier passing results are not offered as evidence that
> the delivered commit passes — the decision is explicit on that point.

## Verification gates

Each must be re-run against the delivered commit; results from an earlier build are not
evidence for a later one.

| Command | Covers |
|---|---|
| `npm run evidence:closure` | Closure register; fails if a cited document does not exist |
| `npm run release:snapshot` | Archive the superseded evidence, then write the release manifest |
| `npm test` | Full automated suite |
| `npm run check:c04` | C-04 governed strings verbatim against the controlled PDF |
| `npm run check:c03` | C-03 report strings classified against the controlled pack and the issued review |
| `npm run check:vendor-copy` | Non-report copy checked against C-04; fails if vendor copy is actually governed |
| `npm run evidence:point34` | Every display format names its locale; every date names its time zone |
| `npm run evidence:c07-critical` | Critical C-07 rows compared field by field with controlled C-01 and the build |
| `npm run evidence:parity && npm run check:parity` | Web/PDF parity across all 19 sections |
| `npm run check:a11y` | C-05 §13 accessibility clauses |
| `npm run check:tokens` | Design-token contrast corrections |
| `npm run check:security` | Annex D-06 security strands |
| `npm run evidence:responsive` | C-05 §5 breakpoints and touch targets |
| `npm run evidence:section7` | Section 7 field-by-field presentation |
| `npm run evidence:performance` | Master Requirements §12 budgets |

## Evidence documents

| Document | Covers | Present | Regenerate |
|---|---|---|---|
| [`docs/m3/ROOTS-AI_M3_Closure_Register.md`](../../docs/m3/ROOTS-AI_M3_Closure_Register.md) — M3 closure register | ROOTS review of 29 Sep 2026, section F — every item raised, its state, its evidence and what is still needed | 13 KB | `npm run evidence:closure` |
| [`docs/m3/ROOTS-AI_M3_Release_Manifest.md`](../../docs/m3/ROOTS-AI_M3_Release_Manifest.md) — Release manifest | ROOTS review of 29 Sep 2026, section A — commit, SHA-256 of every evidence file, gates, and what is not evidenced | 17 KB | `npm run release:manifest` |
| [`docs/m3/ROOTS-AI_M3_Package_Integrity_Verification.md`](../../docs/m3/ROOTS-AI_M3_Package_Integrity_Verification.md) — Package integrity verification | READ_FIRST §7 — SHA-256 receipt and checksum confirmation | 4 KB | `npm run check:package` |
| [`docs/m3/ROOTS-AI_M3_Final_Report_Verification.md`](../../docs/m3/ROOTS-AI_M3_Final_Report_Verification.md) — Final report verification package | The ten checks required at the end of the 35-point review | 7 KB | `npm run evidence:final-verification` |
| [`docs/m3/ROOTS-AI_M3_AI_Settings.md`](../../docs/m3/ROOTS-AI_M3_AI_Settings.md) — Governed narrative settings | ROOTS review of 29 Sep 2026, item B3 — all 15 settings, local column read from the running configuration | 7 KB | `npm run evidence:ai-settings` |
| [`docs/m3/ROOTS-AI_M3_AI_Integration_Evidence.md`](../../docs/m3/ROOTS-AI_M3_AI_Integration_Evidence.md) — AI integration evidence (live provider) | READ_FIRST §5 integration test; Annex D-07 versioning and fallback proof | 3 KB | `npm run evidence:ai` |
| [`docs/m3/ROOTS-AI_M3_Coverage_Evidence.md`](../../docs/m3/ROOTS-AI_M3_Coverage_Evidence.md) — Unit coverage evidence | Master Requirements §13.1 suite 1 | 10 KB | `npm run evidence:coverage` |
| [`docs/m3/ROOTS-AI_M3_E2E_Evidence.md`](../../docs/m3/ROOTS-AI_M3_E2E_Evidence.md) — End-to-end journey evidence | Master Requirements §13.1 suite 4 | 6 KB | `npm run build && npm run evidence:e2e` |
| [`docs/m3/ROOTS-AI_M3_OWASP_Evidence.md`](../../docs/m3/ROOTS-AI_M3_OWASP_Evidence.md) — OWASP Top 10 probe evidence | Master Requirements §13.1 suite 5 — OWASP strand | 8 KB | `npm run build && npm run evidence:owasp` |
| [`docs/m3/ROOTS-AI_M3_Decision_Matrix.md`](../../docs/m3/ROOTS-AI_M3_Decision_Matrix.md) — Six-item decision matrix | ROOTS decision of 29 Sep 2026, items 1-6 | 16 KB | `— (authored response)` |
| [`docs/m3/ROOTS-AI_M3_Decision_Log.md`](../../docs/m3/ROOTS-AI_M3_Decision_Log.md) — Decision log | D-01…D-05, Q-01…Q-05, Annex D-06 | 35 KB | `— (authored record)` |
| [`docs/m3/ROOTS-AI_M3_Report_Review_35_Point_Checklist.md`](../../docs/m3/ROOTS-AI_M3_Report_Review_35_Point_Checklist.md) — 35-point report-review checklist | All 35 review points with status, source, change, evidence, dependency | 10 KB | `npm run evidence:review35` |
| [`docs/m3/ROOTS-AI_C03_Amendment_A1_Report_Corrections.md`](../../docs/m3/ROOTS-AI_C03_Amendment_A1_Report_Corrections.md) — C-03 Amendment A1 | Review points 3, 4, 5, 20, 23, 31; point 26 position | 16 KB | `npm run evidence:c03-amendment` |
| [`docs/m3/ROOTS-AI_M3_Point21_Content_Matrix.md`](../../docs/m3/ROOTS-AI_M3_Point21_Content_Matrix.md) — Point 21 content matrix | 7 x 4 domain/classification matrix, existing approved content only | 19 KB | `npm run evidence:point21` |
| [`docs/m3/evidence/Point21_Content_Matrix_FOR_ROOTS.xlsx`](../../docs/m3/evidence/Point21_Content_Matrix_FOR_ROOTS.xlsx) — Point 21 content matrix — editable workbook for ROOTS | ROOTS review of 29 Sep 2026, item 1 — 28 combinations with four empty decision columns | 11 KB | `npm run evidence:point21 && npm run evidence:point21-xlsx` |
| [`docs/m3/ROOTS-AI_M3_Web_PDF_Parity_Matrix.md`](../../docs/m3/ROOTS-AI_M3_Web_PDF_Parity_Matrix.md) — Web/PDF parity matrix | Review points 29 and 30 — 19 sections, 5 states | 12 KB | `npm run evidence:parity && npm run check:parity` |
| [`docs/m3/ROOTS-AI_M3_Section7_Presentation_Matrix.md`](../../docs/m3/ROOTS-AI_M3_Section7_Presentation_Matrix.md) — Section 7 presentation matrix | Decision item 5 — field-by-field, incl. accessible output | 23 KB | `npm run evidence:section7` |
| [`docs/m3/ROOTS-AI_M3_Driver_State_Matrix.md`](../../docs/m3/ROOTS-AI_M3_Driver_State_Matrix.md) — Driver state matrix | D-04 co-primary correction across every driver state | 8 KB | `npm run evidence:drivers` |
| [`docs/m3/ROOTS-AI_M3_Accessibility_Evidence.md`](../../docs/m3/ROOTS-AI_M3_Accessibility_Evidence.md) — Accessibility evidence | C-05 §13, all clauses; review point 31 | 10 KB | `npm run check:a11y` |
| [`docs/m3/ROOTS-AI_M3_Token_Contrast_Evidence.md`](../../docs/m3/ROOTS-AI_M3_Token_Contrast_Evidence.md) — Token contrast evidence | Decision item 3 — before/after per declaration | 6 KB | `npm run check:tokens` |
| [`docs/m3/ROOTS-AI_M3_Responsive_Evidence.md`](../../docs/m3/ROOTS-AI_M3_Responsive_Evidence.md) — Responsive evidence | C-05 §5 — 55 route/width combinations; touch targets | 11 KB | `npm run evidence:responsive` |
| [`docs/m3/ROOTS-AI_M3_Security_Evidence.md`](../../docs/m3/ROOTS-AI_M3_Security_Evidence.md) — Security evidence | Annex D-06 — RLS matrix, authorization, secrets, logging | 16 KB | `npm run check:security` |
| [`docs/m3/ROOTS-AI_M3_Performance_Evidence.md`](../../docs/m3/ROOTS-AI_M3_Performance_Evidence.md) — Performance evidence | Master Requirements §12 | 5 KB | `npm run build && npm run evidence:performance` |
| [`docs/m3/ROOTS-AI_M3_Backup_and_Restore_Drill_Plan.md`](../../docs/m3/ROOTS-AI_M3_Backup_and_Restore_Drill_Plan.md) — Backup and restore drill plan | Master Requirements §13.1 suite 11 and AC-12; ROOTS review of 29 Sep 2026, item 13 | 8 KB | `— (authored plan)` |
| [`docs/m3/ROOTS-AI_M3_Performance_Test_Plan.md`](../../docs/m3/ROOTS-AI_M3_Performance_Test_Plan.md) — Performance test plan | ROOTS review of 29 Sep 2026, item 11 — method and proposed conditions for the seven §12 metrics that cannot yet be measured | 10 KB | `— (authored plan)` |
| [`docs/m3/ROOTS-AI_M3_Synthetic_Test_Data.md`](../../docs/m3/ROOTS-AI_M3_Synthetic_Test_Data.md) — Synthetic test data | ROOTS review of 29 Sep 2026, item 12 — reproducible 100,000-record dataset, scored by the delivered engine | 4 KB | `npm run db:test-data` |
| [`docs/m3/ROOTS-AI_M3_C07_Traceability_Summary.md`](../../docs/m3/ROOTS-AI_M3_C07_Traceability_Summary.md) — C-07 traceability summary | 594 atomic requirements, vendor columns | 4 KB | `npm run evidence:c07` |
| [`docs/m3/evidence/C07_v1.0.1_M3_VENDOR_COMPLETED.xlsx`](../../docs/m3/evidence/C07_v1.0.1_M3_VENDOR_COMPLETED.xlsx) — C-07 completed workbook | 594 rows | 73 KB | `npm run evidence:c07` |
| [`docs/m3/ROOTS-AI_M3_C07_Critical_Row_Trace.md`](../../docs/m3/ROOTS-AI_M3_C07_Critical_Row_Trace.md) — C-07 line-by-line trace, critical rows | ROOTS review of 29 Sep 2026, item D2 — the 38 scoring rows, 204 field comparisons against controlled C-01 and the delivered build | 30 KB | `npm run evidence:c07-critical` |
| [`docs/m3/ROOTS-AI_M3_LEG_Screen_Acceptance.md`](../../docs/m3/ROOTS-AI_M3_LEG_Screen_Acceptance.md) — LEG screen acceptance | Legal screens against C-04/C-05 | 9 KB | `— (authored record)` |
| [`docs/m3/ROOTS-AI_M3_Point19_Input_Inventory.md`](../../docs/m3/ROOTS-AI_M3_Point19_Input_Inventory.md) — Point 19 input inventory | ROOTS review of 29 Sep 2026, item 2 — every participant-entered measurement, and the plausibility ranges C-01 does not define | 9 KB | `npm run evidence:point19` |
| [`docs/m3/ROOTS-AI_M3_Point34_Presentation_Boundary.md`](../../docs/m3/ROOTS-AI_M3_Point34_Presentation_Boundary.md) — Point 34 presentation boundary | ROOTS review of 29 Sep 2026, item 3 — every formatting site, the bounded locale change, the translation boundary | 8 KB | `npm run evidence:point34` |
| [`docs/m3/ROOTS-AI_M3_Vendor_Copy_Register.md`](../../docs/m3/ROOTS-AI_M3_Vendor_Copy_Register.md) — Vendor copy register (outside the report) | ROOTS review of 29 Sep 2026, item D7 — all 70 functional strings no controlled pack supplies | 8 KB | `npm run check:vendor-copy` |
| [`docs/m3/ROOTS-AI_M3_C03_Wording_Register.md`](../../docs/m3/ROOTS-AI_M3_C03_Wording_Register.md) — C-03 wording register (ROOTS-issued vs vendor-drafted) | ROOTS review of 29 Sep 2026, item 7 — every report string classified against the controlled sources | 19 KB | `npm run check:c03` |
| [`docs/m3/ROOTS-AI_M3_Defect_Record_B1_Secure_Link_Provisioning.md`](../../docs/m3/ROOTS-AI_M3_Defect_Record_B1_Secure_Link_Provisioning.md) — Controlled defect record B1 — secure-link provisioning | ROOTS review of 29 Sep 2026, item B1 — root cause, affected versions, changed files, regression and concurrency tests | 9 KB | `npm run test:auth` |
| [`docs/m3/ROOTS-AI_M3_DB_Probe_Execution_Log.md`](../../docs/m3/ROOTS-AI_M3_DB_Probe_Execution_Log.md) — Database probe execution log | Both SQL suites executed — 98 probes, RLS and AI-03 grants | 16 KB | `npm run db:probes` |
| [`docs/m3/ROOTS-AI_M3_AI_Boundary_DB_Tests.sql`](../../docs/m3/ROOTS-AI_M3_AI_Boundary_DB_Tests.sql) — AI boundary database tests | AI-03 grants; 20 probes | 14 KB | `— (run in the Supabase SQL editor)` |
| [`docs/m2/ROOTS-AI_M2_Security_Tests.sql`](../../docs/m2/ROOTS-AI_M2_Security_Tests.sql) — M2 security/RLS tests | RLS negative cases; 57 probes | 25 KB | `— (run in the Supabase SQL editor)` |

## Supporting artefacts

| Artefact | Contents |
|---|---|
| `docs/m3/evidence/responsive/` | 55 full-page screenshots, one per route/width |
| `docs/m3/evidence/parity-*.pdf` | Rendered PDFs for each parity case |
| `docs/m3/evidence/review-points.pdf` | Rendered report showing the review-point additions |
| `docs/m2/evidence/golden-tests.html` | All 30 Golden Tests, input → expected → actual |

## Items ROOTS holds open

Listed so the submission is not mistaken for a claim of completeness.

| Item | Status |
|---|---|
| Report-review point 21 | **Open.** ROOTS to determine which domain/classification combinations require additional approved content |
| Section 7 presentation rule | **Open.** ROOTS retains the approval decision on semantic equivalence |
| C-03 Amendment A1 | **Prepared, awaiting ROOTS approval** |
| C-07 row SCR-0034 | **Finding.** The C-07 extract and controlling C-01 disagree on Q14 validation; the build follows C-01. ROOTS to confirm |
| Vendor copy outside the report | **70 strings awaiting approval** — listed individually in the vendor copy register |
| C-03 vendor-drafted wording | **19 strings awaiting approval** — listed individually in the C-03 wording register |
| Production AI settings | **Closed.** Production column read from `wrangler.jsonc`, and confirmed against the live console on 30 Sep 2026 — all ten variables and four secrets matched |
| Candidate contrast tokens | **Authorized in principle; values awaiting visual verification** |
| Contact consent link touch target | **Closed.** ROOTS ruled the 44 px minimum stands; applied and measured at 111 x 44 px — see the responsive evidence |
| ASM-01 secure-link journey | **Closed.** Evidenced end to end, including a first-time address verifying its first link — see the E2E evidence and defect record B1 |
| Review point 19 | **Inventory supplied.** ROOTS to issue plausibility ranges; the non-destructive requirements already hold and are asserted |
| Review point 34 | **Inventory supplied.** Architectural half held and evidenced; ROOTS to name target locales |
| Review point 32 | Open — final visual hierarchy, excluded from current scope |
| Master Requirements §12 conditioned metrics | **Plan and proposed conditions supplied.** Blocked only on ROOTS accepting or amending them |
| §13.1 suite 11 — backup and restore | **Outstanding.** Drill plan supplied; the drill needs production credentials and a restore target, which the vendor does not hold |
| D-01 Cloudflare Precursor, D-04 wording verification, D-05 consent gaps | Awaiting ROOTS direction |

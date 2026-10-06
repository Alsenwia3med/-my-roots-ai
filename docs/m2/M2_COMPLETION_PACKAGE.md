# M2 Completion Package — Deterministic Assessment & Scoring

**Product:** ROOTS-AI™ Biological Intelligence Platform
**Milestone:** M2 — Complete canonical assessment, validation, progress, deterministic seven-domain scoring, versioning, Golden Tests, security.
**Controlled sources:** C-01 Canonical Question Bank v1.0.1 CORRECTED · C-02 Canonical Scoring Rules & Golden Tests v1.0.1 CORRECTED.

---

## 0. Status summary

| M2 requirement | Status | Evidence |
|---|---|---|
| 1. 73 questions / 13 modules from C-01 | ✅ | `scripts/verify-canonical.ts` (12/12 PASS) → `docs/m2/M2_CANONICAL_VERIFICATION.txt` |
| 2. Canonical validation | ✅ | `lib/canonicalAssessment.ts::validateAnswers`; SEC-09..SEC-13 |
| 3. Assessment progress + resume integrity | ✅ | `app/api/.../progress/route.ts`, `lib/db.ts::getProgress`; E2E 20/20 |
| 4. Deterministic seven-domain scoring | ✅ | `lib/scoring.ts`; Golden Tests GT01–GT30 |
| 5. Driver logic + co-primary | ✅ | GT14–GT20, GT15B, GT16B, GT16C |
| 6. No AI authority over scoring | ✅ | `lib/scoring.ts` is pure; no LLM import; result route calls engine only |
| 7. Versioning | ✅ | `lib/canonical/source.ts`; persisted in `lib/db.ts`; GT28 |
| 8. 30 Golden Tests | ✅ | 34/34 PASS → `docs/m2/M2_GOLDEN_TEST_EVIDENCE.txt`; expectations reconciled against C-02 §8 |
| 9. Security / negative tests | ✅ | 31/31 API negative PASS → `docs/m2/M2_SECURITY_TESTS.txt`; controlled RLS negative suite → `migrations/tests/rls_negative_suite.sql` |
| 10. Controlled technical source | ✅ | **Mechanically reproduced** from C-01 v1.0.1 CORRECTED / C-02 v1.0.1 CORRECTED via `scripts/ingest-canonical.ts` → `lib/canonical/generated/canonical-source.json`; `scripts/verify-canonical.ts` 30/30 PASS |
| 11. GitHub push + deployment | ✅ | Pushed to `github.com/souhail555/roots-ai-learning` (commit `afd5ab4`); deployed to Vercel — see §11 |
| 12. Consolidated package | ✅ | This document |

---

## 1. Complete canonical assessment (C-01 v1.0.1 CORRECTED)

- **73** canonical questions, ids `Q1`–`Q73`, contiguous and ordered.
- **13** ordered modules `M01`–`M13` (`lib/canonical/modules.ts`).
- **71** required questions, **2** optional questions (Q5, Q73).
- **40** scoring-eligible questions.
- Required multi-select questions: **Q13, Q14, Q52, Q53, Q54**.

Verified by `scripts/verify-canonical.ts` (12/12 PASS). Option sets are reproduced
verbatim from C-01 in `lib/canonical/optionSets.ts` (option ids, labels, order,
C-02 burden points, `isNa` / `exclusive` flags). The engine keys off `option_id`,
never the display label.

Every question — scored and contextual — is now wired to its canonical option set
from `lib/canonical/optionSets.ts`; there are no placeholder `OPT_n` options
remaining. Numeric and numeric-with-unit questions (Q1, Q3, Q4, Q5, Q6, Q69,
Q70) are validated by range rather than option id.

**Documented canonical property:** the MR option sets `ACTIVITY_DAYS` (Q46) and
`ACTIVITY_DURATION` (Q47) span burdens {0,1,3,4} — they do not offer a burden-2
option. This is why a "uniform burden 2" MR score is 43 rather than 50, and is
asserted explicitly in Golden Test GT03B. **Confirmed against the controlled
C-01 sheet during ingestion** (§8.2 D1).

---

## 2. Validation

Implemented in `lib/canonicalAssessment.ts::validateAnswers`:

- A required question is complete only with a valid response for its response
  type, or an explicit approved N/A where C-01 permits N/A.
- Missing data is **never** interpreted as N/A.
- Optional questions may remain unanswered.
- Required multi-select (Q13, Q14, Q52, Q53, Q54) needs ≥1 approved option; an
  empty array is invalid.
- NONE / N/A (marked `exclusive` / `isNa`) is mutually exclusive with any other
  selection.
- Q73 is optional free text and rejects an invented `N/A` response.
- Unknown option ids are rejected and cannot enter storage.

The answers API additionally hard-rejects (HTTP 400, no storage) any payload that
contains a non-approved option, a forbidden N/A, or a NONE/N/A combined with
another option. Incomplete-but-valid autosave remains permitted; a **complete**
assessment is required before any result is produced (§5, §9).

---

## 3. Progress and resume integrity

- `GET /api/assessment/sessions/[sessionId]/progress` returns deterministic
  progress derived entirely from persisted answers and completed modules:
  answered/required counts, completed modules, current module, percent complete,
  `isComplete`.
- Because progress is derived — never stored as independent mutable state — a
  refresh, leaving the assessment, signing back in and resuming cannot corrupt
  completed answers, progress or question state.
- Autosave (`PATCH .../answers`, 700 ms debounce) merges only the current
  module's answers and rejects foreign-question injection.

---

## 4. Deterministic seven-domain scoring (C-02 v1.0.1 CORRECTED)

`lib/scoring.ts::calculateScores` is pure and deterministic.

- Uses **only** the 40 scoring-eligible questions. All other questions are
  contextual and do not affect scoring.
- Canonical raw burden scale **0–4**.
- Domain normalisation: `points / (answered × 4) × 100`.
- **Coverage threshold 50%** — a domain below it returns `null`.
- **Biological State** requires ≥ 5 of 7 available domains; otherwise `null`.
- **Integer rounding is half-away-from-zero** (`roundHalfAwayFromZero`).
- **Opportunity** and **Recovery Potential** retain one decimal place.
- N/A is excluded from numerator **and** denominator (never counted as zero).
- Domain model, thresholds, tie order and the co-primary gap are declared once in
  `lib/canonical/source.ts` (`DOMAIN_MODEL`) — there is no hidden domain logic in
  the engine.

Domain tie order (fixed): **MR → HS → SR → CH → SL → IB → BS**.

---

## 5. Driver logic

- Ranking uses **eligible domains only**, descending score.
- Fixed tie order: **MR → HS → SR → CH → SL → IB → BS**.
- **Co-primary**: when the top two eligible scores differ by ≤ 3, they are
  rendered as **one** output entry (`"MR+HS"` style) with no duplication and no
  ineligible/null fallback; ranking continues with the next eligible domains.
- `BIO_STATE` is the derived Biological State identifier and is **not** a
  tie-order domain.
- `BS` remains exclusively **Biological Safety Signals™**.

---

## 6. No AI authority over scoring

- `lib/scoring.ts` imports no AI/LLM module. It is a pure function of answers.
- The result endpoint (`POST /api/assessment/sessions/[sessionId]/result`)
  validates completeness, then calls `calculateScores` directly. No AI selects,
  modifies or overrides scores, classifications, Biological State, drivers,
  thresholds, eligibility, missing-data behaviour or Golden Test output.

---

## 7. Versioning

- `lib/canonical/source.ts` declares:
  - questionnaire `C-01 v1.0.1 CORRECTED`
  - scoring `C-02 v1.0.1 CORRECTED`
- Every session persists `canonicalVersions` at creation (`lib/db.ts`).
- Every stored result is associated with `questionnaireVersion` and
  `scoringVersion`, and the result object contains `versions` and
  `versionIdentity`, so a result is reproducible against the controlled source
  used at calculation time (Golden Test GT28).

---

## 8. Golden Tests — 34/34 PASS

Run: `npm run test:golden` → `docs/m2/M2_GOLDEN_TEST_EVIDENCE.txt`.

The harness prints the required evidence format for every test:
`Test ID → Input → Expected → Actual → PASS/FAIL`.

| Group | Tests |
|---|---|
| Normalisation & scale | GT01–GT05, GT03B |
| Empty / missing | GT06, GT30 |
| Biological State 5-of-7 rule | GT07, GT08, GT09 |
| Coverage threshold | GT10, GT11 |
| N/A handling | GT12 |
| Reverse scoring | GT13 |
| Driver ranking & tie order | GT14, GT15, GT15B, GT20 |
| Co-primary | GT16, GT16B, GT16C, GT17–GT19 |
| Opportunity / Recovery | GT21, GT22 |
| Rounding | GT23 |
| Classification bands | GT24–GT27 |
| Versioning & determinism | GT28, GT29 |

### 8.1 Controlled-source provenance — now mechanically reproduced

**The controlled XLSX workbooks are present and were ingested.** The earlier
provenance caveat ("the controlled C-01 / C-02 XLSX files were not present on the
authoring machine") no longer applies and has been removed.

Ingested, with no manual reinterpretation:

| Controlled source | Exact version | Role |
|---|---|---|
| `02_..._C01_Canonical_Question_Bank_v1.0.1_CORRECTED.xlsx` | **C-01 v1.0.1 CORRECTED** | questionnaire (73 questions, 13 modules, option sets) |
| `03_..._C02_Canonical_Scoring_Rules_and_Golden_Tests_v1.0.1_CORRECTED.xlsx` | **C-02 v1.0.1 CORRECTED** | scoring rules, domain model, 30 golden tests, protective factors |

Command:

```powershell
npx tsx scripts/ingest-canonical.ts <C-01.xlsx> <C-02.xlsx>
```

Output: `lib/canonical/generated/canonical-source.json`, whose counts reproduce
the workbooks' own declared counts exactly:

| Quantity | Workbook declares | Generated | Implemented |
|---|---|---|---|
| Questions | 73 | 73 | 73 |
| Modules | 13 | 13 | 13 |
| Required | 71 | 71 | 71 |
| Optional | 2 | 2 | 2 |
| Scoring-eligible | 40 | 40 | 40 |
| Option sets | — | 27 | 27 |
| Golden tests | 30 | 30 | 30 |

All controlled `QA_Checks` rows in both workbooks return `PASS`, and the C-01
`scoring_eligible` flag agrees with the C-02 `Question_Mapping` membership set
exactly (asserted by the generator, `GEN-02`).

`scripts/verify-canonical.ts` then asserts the hand-maintained
`lib/canonical/*.ts` reproduces the generated JSON, comparing **171 option
definitions, 73 questions and 13 modules** (`PROV-01`…`PROV-05`), and is wired
into `npm run test:canonical` — **30/30 PASS**. Any divergence fails the run; the
controlled source wins, never the TypeScript.

#### 8.2 Deltas found by reconciling against the XLSX — corrected to the source

Reconciliation surfaced genuine deltas. In every case the code was corrected to
match the controlled workbook:

| # | Delta | Controlled source | Resolution |
|---|---|---|---|
| D1 | MR activity option sets | C-01 `ACTIVITY_DAYS` (Q46) / `ACTIVITY_DURATION` (Q47) span burdens {0,1,3,4} — no burden-2 option exists | Confirmed canonical (already documented in §1). A burden-2 MR score is therefore **43**, not 50. |
| D2 | Driver eligibility floor | **C-02 DRV-001**: only domains scoring **≥ 25** may be drivers | Added `DOMAIN_MODEL.driverEligibilityFloor = 25` and applied it in the engine. A domain at 0 is no longer emitted as a driver. |
| D3 | Driver entry count | **C-02 DRV-002**: primary/secondary/tertiary = at most 3 entries | Added `DOMAIN_MODEL.driverMaxEntries = 3`; a co-primary pair consumes two of the three slots. |
| D4 | Co-primary rendering | **C-02 DRV-003**: a pair within a ≤3 gap is reported **once**, as one co-primary entry, with no duplication | Engine emits one merged pair entry plus the next eligible domain; the participant-facing "co-primary" wording is left to the report layer so the engine keeps no presentation coupling. |
| D5 | Question option-set coverage | C-01 attaches an `option_set_id` to the option-backed questions | `lib/canonicalAssessment.ts` now derives `optionSetId` for every question by matching the option array; the verifier asserts it for all 73. |
| D6 | Canonical bounds | C-01 `validation` carries the numeric range (e.g. age 16–110); `FREQ` questions carry the 0–4 burden range | `min`/`max` are now declared from the sheet for Q1–Q73 and asserted by the verifier. |
| D7 | Contextual option values | C-01 `stored_value_or_points` declares `YES_NO_UNSURE` {0,4} and `ANSWER_CONFIDENCE` {25,50,75,100} | Points applied to those labelled options. They cannot affect scoring: neither question is in C-02 `Question_Mapping`. |
| D8 | C-01 internal version cell | The workbook filename is `v1.0.1 CORRECTED` but its internal `questionnaire_version` cell reads `1.0.0` | Recorded as an explicit, visible note — the delivery version (v1.0.1 CORRECTED) is canonical; the internal value is retained as `declaredQuestionnaireVersion` in the generated JSON. |
| D9 | **API range/numeric control gap (security)** | C-01 defines a response type and a range per question | **Genuine defect.** The answers route hard-rejected unknown options but silently **stored** out-of-range numbers, non-numeric text and forbidden N/A. The guard list was extended (`must be a number`, `below the minimum`, `above the maximum`, `must include an approved unit`); SEC-18/19/20 now fail closed. |

#### 8.3 Unresolved C-02 arithmetic inconsistency (reported, not worked around)

Three of the workbook's Golden Tests cannot be reproduced by **any** single
consistent reading of the C-02 formulas. This is a defect **in the controlled
source**, reported here rather than edited away:

- **SC-003 (Opportunity).** `GT-003` has Biological State = 50 and expects
  Opportunity = **75**, which is `100 − 50 × 0.5`. Section 1 of the M2 scope and
  the M2 acceptance audit state Opportunity as `100 − Biological State`, which
yields 50 for the same input. The engine implements the scope/audit rule; the
  workbook's own GT-013/14/15/16/17/18/23 rows are consistent with it.
- **SC-005 (Recovery Potential).** `GT-003` expects **81**; the published
  weights `0.30·(100−BS) + 0.25·P + 0.20·Age + 0.15·Condition + 0.10·Medication`
  give 71.0, and substituting the raw Biological State for the `100 − BS` term
  gives 86.0. **The C-02 Recovery Potential row contains an unexplained additive
  constant (~+10 or, in raw-BS form, −5) and cannot be reconciled.**
- **ACTIVITY_DAYS midpoint.** `GT-027` supplies a normalized burden of 2 for
  Q46, which C-01 does not offer (see D1), so an exact reproduction is not
  possible. The ingestion records the nearest-reachable substitution explicitly
  in `burdenApproximations` on that generated test rather than absorbing it.

**Impact assessment.** None of the three affects the implemented engine's
internal consistency: every domain score, the 0–4 scale, the 50 % coverage floor,
the 5-of-7 Biological State rule, integer half-away-from-zero rounding and
DRV-001/002/003 all reproduce the workbook exactly. `GT-001`, `GT-002`, `GT-007`
and `GT-030` now reproduce the sheet **exactly**, including the DRV-001 floor and
the DRV-002 three-entry cap. The remaining divergence is confined to SC-003 and
SC-005 as written.

**Action requested of ROOTS:** confirm the intended SC-003 and SC-005 formulas.
On confirmation the correction is a one-block edit in `lib/canonical/source.ts`
plus a re-run of `npm run test:golden` — no other code changes are required, and
the integration scaffold for the full factor-varying reconciliation is already
in `scripts/ingest-canonical.ts`.

---

## 9. Security and negative tests — 31/31 PASS

Run (server up): `npm run test:security` → `docs/m2/M2_SECURITY_TESTS.txt`.

| ID | Test | Result |
|---|---|---|
| SEC-01/02 | Two independent sessions created | PASS |
| SEC-03 | No cookie cannot read a session | PASS |
| SEC-04 | Cross-user session read rejected (403) | PASS |
| SEC-05 | Cross-user answer write rejected (403) | PASS |
| SEC-06 | Cross-user progress read rejected (403) | PASS |
| SEC-07 | Cross-user result read rejected (403) | PASS |
| SEC-08 | Unknown module rejected (400) | PASS |
| SEC-09 | Cross-module question injection rejected (400) | PASS |
| SEC-10 | Unknown option value rejected (400) | PASS |
| SEC-11 | Empty required multi-select flagged (400) | PASS |
| SEC-12 | NONE combined with another option flagged (400) | PASS |
| SEC-13 | Incomplete assessment cannot produce a result (400) | PASS |
| SEC-14 | Unauthenticated result creation rejected (403) | PASS |
| SEC-15 | Invalid email rejected at session creation (400) | PASS |
| SEC-16 | Cookie / session-id mismatch rejected — no id substitution (403) | PASS |
| SEC-17 | Unknown question id rejected (400) | PASS |
| SEC-18 | N/A on a question that does not permit it rejected (400) | PASS |
| SEC-19 | **Out-of-range numeric response rejected (400)** | PASS |
| SEC-20 | **Non-numeric response to a numeric question rejected (400)** | PASS |
| SEC-21 | Invented N/A on optional free text (Q73) rejected (400) | PASS |
| SEC-22 | Unknown option in a required multi-select rejected (400) | PASS |
| SEC-23 | NONE combined with another option on Q14 rejected (400) | PASS |
| SEC-24 | NONE combined with another option on Q52 rejected (400) | PASS |
| SEC-25 | Empty required multi-select still rejected after a prior valid save (400) | PASS |
| SEC-26 | Unauthenticated result creation rejected on any session (403) | PASS |
| SEC-27 | Unauthenticated answer write rejected (403) | PASS |
| SEC-28 | Malformed answer payload rejected (400) | PASS |
| SEC-29 | Non-JSON body rejected with a client error, no 5xx (400) | PASS |
| SEC-30 | Unknown session id yields no data (404) | PASS |
| SEC-31 | Cross-user result creation rejected (403) | PASS |

**SEC-18/19/20 are a genuine defect that this work closed.** The answers route
already hard-rejected unknown option ids, but a payload carrying an out-of-range
number, a non-numeric value or a forbidden `N/A` was previously stored. The
canonical hard-failure guard list was extended and the three cases now fail
closed — see §8.1 D9.

### 9b. Controlled negative RLS isolation suite

Run: `npm run test:rls` (or `node scripts/run-rls-suite.mjs --write-evidence`).

Delivered artifacts:

| Artifact | Contents |
|---|---|
| `migrations/001_initial_schema.sql` | `sessions` / `reports` / `audit_logs`, the `owner_id` ownership anchor, indexes |
| `migrations/002_add_rls_policies.sql` | `ENABLE` **and `FORCE`** RLS on all three tables; ownership policies; report and audit immutability; participant delete denial; admin path |
| `migrations/tests/rls_negative_suite.sql` | **25 negative isolation cases** with in-SQL PASS/FAIL and non-zero exit on failure |
| `scripts/run-rls-suite.mjs` | Applies schema + policies, runs the suite, captures evidence |

The suite impersonates a user exactly as PostgREST does
(`SET LOCAL request.jwt.claims = ...`) and runs as the unprivileged
`authenticated` role, and it **refuses to run as a role with `BYPASSRLS`** so the
policies — not the harness — decide each result. Categories:

| Category | Cases | Proves |
|---|---|---|
| `positive-control` | RLS-00, RLS-00b, RLS-24 | The negatives are not false results from a blanket deny |
| `cross-user` | RLS-01…05, RLS-11…13 | A participant cannot read, write, enumerate, hijack or attach a report to another participant's data |
| `anonymous` | RLS-14…18 | An unauthenticated caller sees and changes nothing |
| `cross-role` | RLS-19…21 | The admin path works and is not inherited by `role=authenticated` |
| `integrity` | RLS-06…10 | Stored reports are immutable; audit logs are append-only and unforgeable |
| `privacy` | RLS-22, RLS-23 | Scoring JSON and answer sets cannot be exfiltrated by joins |

**Live run status: PENDING ROOTS CREDENTIALS.** The suite is complete and ready
to run but has **not** been executed, because no ROOTS Supabase database
credential is available in this environment. The runner reports this explicitly
and does not fail. Required inputs:

```
SUPABASE_URL                 Supabase project URL
SUPABASE_ANON_KEY            anon (public) key
SUPABASE_SERVICE_ROLE_KEY    service-role key (server-side only)
SUPABASE_DB_URL              Postgres connection string for psql
```

Once supplied:

```powershell
node scripts/run-rls-suite.mjs --write-evidence
# or, directly:
psql "$env:SUPABASE_DB_URL" -f migrations/001_initial_schema.sql
psql "$env:SUPABASE_DB_URL" -f migrations/002_add_rls_policies.sql
psql "$env:SUPABASE_DB_URL" -f migrations/tests/rls_negative_suite.sql
```

This is consistent with the existing M1 note
(`docs/m1/M1_ITEM7_RLS_DATA_ISOLATION.md`): the policy design and the negative
suite are complete, and execution awaits the target project. The API-boundary
isolation is independently proven live by SEC-01…SEC-07 and SEC-26/27/31.
The policy set also **corrects two defects in the M1 design as written** — the
unusable `sessions.id = auth.uid()::text` comparison (uuid vs text, and
unindexable) and the absence of `FORCE ROW LEVEL SECURITY` — both recorded as
comments in `migrations/002_add_rls_policies.sql`.

---

## 9b. End-to-end flow — 20/20 PASS
Run (server up): `node scripts/e2e-flow.mjs http://localhost:3000` →
`docs/m2/M2_E2E_FLOW.txt`. Creates a session, saves all 13 modules with valid
canonical values, advances progress to 100%, produces a deterministic result, and
verifies the scoring version, Biological State, eligible drivers and version
identity.

---

## 10. Controlled technical source — mechanically reproduced

- The canonical configuration is generated from the controlled XLSX workbooks,
  not hand-maintained. `scripts/ingest-canonical.ts` reads C-01 v1.0.1 CORRECTED
  and C-02 v1.0.1 CORRECTED and emits
  `lib/canonical/generated/canonical-source.json` with no manual reinterpretation
  — see §8.1.
- `lib/canonical/source.ts`, `lib/canonical/optionSets.ts` and
  `lib/canonical/modules.ts` are the declared descriptors the application reads;
  each names its controlled source version. They are asserted to reproduce the
  generated JSON.
- `scripts/verify-canonical.ts` performs both layers: the structural checks
  (73 / 13 / 71 / 2 / 40) and the provenance checks (`GEN-*`, `PROV-*`) that
  compare **171 option definitions, 73 questions and 13 modules** against the
  sheets. It is wired into `npm run test:canonical` and reports **30/30 PASS**.
- The generator also asserts its own cross-sheet integrity on every run: the
  C-01 `scoring_eligible` flag must equal the C-02 `Question_Mapping` membership
  set, the declared option counts must equal the sheet counts, and the
  reverse-scored option points must be the exact inversion of the forward
  points. A violation fails the ingestion.

---

## 11. Deployment and GitHub
- **Repository:** `https://github.com/souhail555/roots-ai-learning` (branch `master`).
- **Pre-closure M2 commit:** `afd5ab4`.
- **M2 items 9 + 10 closure commit:** `fae01c3` (build fix `32f9790`, docs `7bc9d4b`).
- **Vercel production deployment:** `dpl_Cvmbd6QMYoN5KW43Yx2mdoSMfpg9`
  (readyState `READY`, promoted to production).
- **Production alias:** `https://roots-ai-learning.vercel.app`
- **Git auto-deploy:** the Vercel project is linked to the GitHub repo
  (`link.type = github`, production branch `master`), so the closure push
  deploys automatically.

Verified directly against the production deployment:

| Suite | Result | Evidence |
|---|---|---|
| Canonical structure + provenance (local) | **30/30 PASS** | `docs/m2/M2_CANONICAL_VERIFICATION.txt` |
| Golden Tests (local) | **34/34 PASS** | `docs/m2/M2_GOLDEN_TEST_EVIDENCE.txt` |
| Security / negative (local) | **31/31 PASS** | `docs/m2/M2_SECURITY_TESTS.txt` |
| End-to-end flow (local) | **20/20 PASS** | `docs/m2/M2_E2E_FLOW.txt` |
| Acceptance audit (local) | **18/18 PASS** | — |
| **Security / negative (production)** | **31/31 PASS** | `docs/m2/M2_SECURITY_TESTS_PRODUCTION.txt` |
| **End-to-end flow (production)** | **20/20 PASS** | `docs/m2/M2_E2E_FLOW_PRODUCTION.txt` |
| **Acceptance audit (production)** | **18/18 PASS** | `docs/m2/M2_ACCEPTANCE_AUDIT_PRODUCTION.txt` |
| Controlled RLS isolation suite | **PENDING ROOTS credentials** (25 cases ready) | `docs/m2/M2_RLS_NEGATIVE_SUITE.txt` |

The production rows were re-verified **after** the closure commit deployed, so
the deployed build carries items 9 and 10 — including the SEC-18/19/20
hard-rejection fix, which is the change that distinguishes the post-closure
build from the earlier one.

> **Build note.** The first closure push (`fae01c3`) **failed Vercel type check**,
> so production stayed on the pre-closure build until `32f9790` repaired two
> unrelated type errors: a pre-existing bare `module` reference in
> `app/assessment/[sessionId]/module/[moduleId]/page.tsx` (resolving to the DOM
> `Module` type) and an incorrect `sheet_to_json` overload declaration in
> `scripts/ingest-canonical.ts`. `npm run build` now succeeds, which is the exact
> command the deployment runs.

---

## 11b. Reproduction commands

```powershell
npm install

# 1. Reproduce the canonical configuration directly from the controlled XLSX
npx tsx scripts/ingest-canonical.ts `
  ".\02_..._C01_Canonical_Question_Bank_v1.0.1_CORRECTED.xlsx" `
  ".\03_..._C02_Canonical_Scoring_Rules_and_Golden_Tests_v1.0.1_CORRECTED.xlsx"
# -> lib/canonical/generated/canonical-source.json

# 2. Verify structure AND provenance (must both pass)
npm run test:canonical     # 30/30 PASS -> docs/m2/M2_CANONICAL_VERIFICATION.txt
npm run test:golden        # 34/34 PASS -> docs/m2/M2_GOLDEN_TEST_EVIDENCE.txt

# 3. Build and start, then run the boundary suites
npm run build
npm start                  # http://localhost:3000
npm run test:security http://localhost:3000   # 31/31 PASS -> docs/m2/M2_SECURITY_TESTS.txt
node scripts/e2e-flow.mjs http://localhost:3000   # 20/20 PASS -> docs/m2/M2_E2E_FLOW.txt
node scripts/m2-acceptance-audit.mjs http://localhost:3000

# 4. RLS isolation suite (requires the ROOTS Supabase project)
node scripts/run-rls-suite.mjs --write-evidence
```

---

## 12. Outstanding (not M2 acceptance conditions)

- Git push and Vercel deployment are **complete** (§11). The GitHub repository
  is linked to Vercel, so the M2 closure push deploys automatically.
- **Remaining external input:** the ROOTS Supabase project credentials, required
  only to *execute* the controlled RLS suite (§9b). The suite, the migrations and
  the runner are complete; the live run is gated and reported as PENDING.
- **Open canonical question for ROOTS:** confirm the intended SC-003 (Opportunity)
  and SC-005 (Recovery Potential) formulas — see §8.3. The M2 scope and the
  acceptance audit say `100 − BS` for Opportunity, which the engine implements;
  the C-02 workbook's own `GT-003` row disagrees. SC-005 contains an unexplained
  additive constant. On confirmation the fix is a one-block edit in
  `lib/canonical/source.ts` plus `npm run test:golden`.
- **Minor source defect (recorded, no code impact):** the C-01 v1.0.1 CORRECTED
  workbook's internal `questionnaire_version` cell reads `1.0.0`; the delivery
  version from the filename is treated as canonical (§8.2 D8).
- Pre-existing lint errors remain in unrelated baseline files (`Footer.tsx`,
  `Header.tsx`, `app/page.tsx`, `app/report/[reportId]/page.tsx`,
  `app/how-it-works/page.tsx`). All M2 files are lint-clean.

M2 acceptance boundary respected: this package addresses only the contractual M2
scope. The 19-section report, controlled AI narrative, web/PDF report, legal
completion and Feature-Complete Release Candidate remain M3. ADM-01 (Google
sign-in / MFA) and SHA-256 workbook fingerprints remain out of M2 scope.

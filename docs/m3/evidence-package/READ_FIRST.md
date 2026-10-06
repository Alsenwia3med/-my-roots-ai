# ROOTS-AI™ — M3 evidence package, commit `d04a324`

Prepared in response to your request of 30 September 2026, 10:38.

---

## 1. Nothing was regenerated for this review

You asked for the exact evidence set corresponding to the delivered commit, without modification.

**No generator was run to produce this package.** The `docs/m3` directory here is the working tree
at commit `d04a324`, taken from a clean checkout: `git status` reports nothing uncommitted, and
`git diff d04a324 -- docs/m3` is empty. The folder structure and filenames are as delivered.

### Verifying it

`docs/m3/ROOTS-AI_M3_Release_Manifest.md` carries the SHA-256 and byte count of every evidence
file. We checked all 102 entries against the files in this package before sending:

| | |
|---|---|
| Files listed in the manifest | 102 |
| **Matching their recorded SHA-256** | **101** |
| Not matching | 1 — the manifest itself, for the reason below |

**Why the manifest cannot verify itself.** It hashes the evidence set and then writes itself into
that set, so its own entry is necessarily the hash of the *previous* version. Every other file
verifies. This is a property of the design rather than a discrepancy, and it is stated here rather
than left to be discovered.

### One thing to know if you re-extract from git

Eleven of the evidence files are stored in the repository with LF line endings while the working
copy has CRLF, because git normalises line endings when a file is committed on Windows. The
content is identical; only the line endings differ.

This matters in one specific way: **the manifest records the hashes of the working-tree files, so a
file extracted with `git archive` or from a fresh clone will not match the recorded hash for those
eleven.** The files in this package are the working-tree versions, which is why 101 of 102 verify
here.

We regard this as a defect in how the manifest is produced — it should hash what the commit
stores, not what sits in a working directory — and we will correct the generator. We have not
corrected it for this package, because that would mean regenerating the manifest, which you asked
us not to do. The eleven affected files are:

`ROOTS-AI_M3_AI_Boundary_DB_Tests.sql`, `ROOTS-AI_M3_C03_Wording_Register.md`,
`ROOTS-AI_M3_C07_Critical_Row_Trace.md`, `ROOTS-AI_M3_C07_Traceability_Summary.md`,
`ROOTS-AI_M3_Decision_Log.md`, `ROOTS-AI_M3_Package_Integrity_Verification.md`,
`ROOTS-AI_M3_Release_Manifest.md`, `ROOTS-AI_M3_Security_Evidence.md`,
`ROOTS-AI_M3_Token_Contrast_Evidence.md`, `ROOTS-AI_M3_Vendor_Copy_Register.md`,
`ROOTS-AI_M3_Web_PDF_Parity_Matrix.md`.

No content differs. Any of them can be confirmed by comparing against the repository with line
endings normalised:

    git show d04a324:docs/m3/<file> | diff - <(tr -d '\r' < <file>)

---

## 2. Two things you asked for that are not in the package

Named here rather than left for you to discover.

### 2.1 Clean-install evidence produces no document

`npm run db:verify` applies the schema to an empty PostgreSQL database and runs 12 structural
checks. It passed at this commit — 12/12 — and it is re-runnable by anyone with the repository.

**But it writes its result to the console only. There is no evidence document for it at
`d04a324`.** The command and its purpose are referenced in the release manifest and the backup
drill plan; the result itself is not captured anywhere in the package.

We have not added one, because you asked that nothing be produced for this review. If you would
like the clean install to produce a document like the database probe log does, say so and it will
be added in a subsequent commit and re-run.

### 2.2 There are no dedicated accessible-colour screenshots

`docs/m3/ROOTS-AI_M3_Token_Contrast_Evidence.md` gives the before and after contrast ratio for all
14 corrected declarations, each measured against the actual surface it appears on, plus the ratio
at each of the three page backgrounds.

The **55 full-page screenshots** in `docs/m3/evidence/responsive/` show the corrected colours as
rendered, across 11 routes at 5 widths, and are the closest thing in the package to a visual
record.

**What does not exist is a screenshot made specifically to show the two colours side by side.** If
that is what you need for the colour decision, we will produce it — but it would be a new artefact,
so it is not in this package.

---

## 3. Where each item you listed is

| You asked for | In the package |
|---|---|
| `ROOTS-AI_M3_Closure_Register.md` | `docs/m3/ROOTS-AI_M3_Closure_Register.md` |
| Q14 / C-01 / C-07 reconciliation, with controlled-source references | `docs/m3/ROOTS-AI_M3_C07_Critical_Row_Trace.md` — see §4 below |
| C-03 Amendment A1 and its 15-string register | `docs/m3/ROOTS-AI_C03_Amendment_A1_Report_Corrections.md` |
| Accessible-colour evidence and screenshots | `docs/m3/ROOTS-AI_M3_Token_Contrast_Evidence.md` + `docs/m3/evidence/responsive/` — see §2.2 |
| Section 7 semantic and parity evidence | `docs/m3/ROOTS-AI_M3_Section7_Presentation_Matrix.md` and `ROOTS-AI_M3_Web_PDF_Parity_Matrix.md` |
| `Point21_Content_Matrix_FOR_ROOTS.xlsx` | `docs/m3/evidence/Point21_Content_Matrix_FOR_ROOTS.xlsx` |
| `ROOTS-AI_M3_C03_Wording_Register.md` | `docs/m3/ROOTS-AI_M3_C03_Wording_Register.md` |
| `ROOTS-AI_M3_Vendor_Copy_Register.md` | `docs/m3/ROOTS-AI_M3_Vendor_Copy_Register.md` |
| Coverage evidence: excluded files, unreachable guards, configuration, raw results | `docs/m3/ROOTS-AI_M3_Coverage_Evidence.md` |
| The 10/10 final verification | `docs/m3/ROOTS-AI_M3_Final_Report_Verification.md` |
| Test evidence | Inside the coverage evidence, which runs the whole suite: 463 tests, 463 passed, 0 failed |
| Accessibility | `docs/m3/ROOTS-AI_M3_Accessibility_Evidence.md` |
| Security | `docs/m3/ROOTS-AI_M3_Security_Evidence.md` |
| Database probes | `docs/m3/ROOTS-AI_M3_DB_Probe_Execution_Log.md` + `docs/m3/evidence/db-probes.csv` — 98 probes, 98 pass |
| Package integrity | `docs/m3/ROOTS-AI_M3_Package_Integrity_Verification.md` — 23/23 files match |
| Clean install | **No document.** See §2.1 |

---

## 4. The Q14 reconciliation, in short

The full comparison is in `ROOTS-AI_M3_C07_Critical_Row_Trace.md`. The relevant entry:

| Source | States, for Q14 |
|---|---|
| C-07 v1.0.1 CORRECTED, atomic row **SCR-0034** | *"Zero or more approved option IDs"* |
| **C-01 v1.0.1 CORRECTED, `Questions` sheet, `Q14`, `validation` column** | *"One or more approved option IDs required; empty array invalid; NONE/NA exclusive where provided"* |
| The delivered build | Matches C-01 exactly |

Both controlled-source references are named so you can check the exact entries. The C-01 value is
read from the `Questions` sheet of `02_ROOTS_AI_C01_Canonical_Question_Bank_v1.0.1_CORRECTED.xlsx`,
row for `Q14`, column `validation`.

This was found by comparing all 38 rows whose canonical artifact is the C-02 scoring configuration,
field by field, against both the controlled C-01 and the delivered build — **204 individual
comparisons**. Q14's validation was the only disagreement. Every other field matched on all three.

The trace document also records that this is not a wording difference: the two statements disagree
about whether an empty selection may be submitted.

---

## 5. What else is in the package

### `docs/m3/archive/`

Three dated snapshots of the evidence set, taken before each regeneration:

| Snapshot | Commit |
|---|---|
| `2026-09-29-3f3d25f/` | `3f3d25f` |
| `2026-09-29-d12d2b1/` | `d12d2b1` |
| `2026-09-30-48c6639/` | `48c6639` |

These exist because of your instruction that regenerating evidence must not destroy the version
already sent. Each was taken automatically before a regeneration, and a second snapshot at the
same commit is refused. They are included so the history is visible, not because they supersede
anything: **the current evidence is the files at the top level of `docs/m3`.**

### `ROOTS-AI_Project_Brief.md`

At the root of this package, **outside `docs/m3`**. Accompanying context describing how the
delivered system is built — the stack, the routes, the API, how the application connects to
Supabase, and how authentication works.

**It is not evidence and it is not part of the M3 evidence set.** It was written after `d04a324`
and nothing in `docs/m3` was touched to produce it. It is separated deliberately so the evidence
set remains exactly what the commit contains.

---

## 6. Package contents

| | |
|---|---|
| Source commit | `d04a324e9b3edcfbe6f7734f24e628884614409e` |
| Repository | `ROOTS-AI-Health-Systems/rootai`, branch `main` |
| Source | The clean working tree at that commit; no generator run |
| Evidence documents | 36 at the top level of `docs/m3` |
| Evidence files in total | 102 at `d04a324`, each hashed in the release manifest |
| Files in this package | 407, including the three archive snapshots, this note and the project brief |
| Regenerated for this review | **Nothing** |

---

## 7. On the seven decisions

No response is needed to this note. We understand the seven decisions will come together in one
controlled response once you have reviewed the package, and that the Q14 governing-source
determination will be included after you have checked the exact C-01 and C-07 entries.

The two gaps in §2 are the only items we are aware of where what you asked for is not present. If
anything else is missing when you reach it, naming it will get it.

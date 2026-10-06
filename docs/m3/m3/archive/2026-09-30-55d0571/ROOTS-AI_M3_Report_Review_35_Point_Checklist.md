# ROOTS-AI™ — 35-point report-review checklist

**Source of the points:** ROOTS final report review, 24 September 2026. Titles are read from
the issued document by `npm run evidence:review35`, so they cannot drift.

**Structure required by the ROOTS decision of 29 September 2026:** for every affected item,
the ROOTS decision, the controlling source or amendment, the implementation change, the test
evidence and the remaining dependency.

## How status is assigned

Deliberately conservative, per the instruction not to describe an item as approved merely
because it is implemented or has passed an internal test:

| Status | Meaning |
|---|---|
| **Closed** | Implemented and evidenced, and requiring no further ROOTS approval |
| **Implemented — awaiting ROOTS** | Correction is in the build and evidenced, but a ROOTS approval is outstanding. **Not closed.** |
| **Pre-existing — verified** | The review asked that something be preserved; it already was, and this is the evidence |
| **Open** | Not implemented, or expressly held open by ROOTS |

| Status | Points |
|---|---|
| Closed | 9 |
| Implemented — awaiting ROOTS | 9 |
| Pre-existing — verified | 13 |
| Open — inventory supplied | 2 |
| Open | 2 |

## The 35 points

| # | Point | Status | Controlling source / amendment | Implementation change | Test evidence | Remaining dependency |
|---|---|---|---|---|---|---|
| 1 | Correct and clarify questionnaire/scoring/report versioning | Closed | C-01/C-02/C-03 versions | Questionnaire, scoring, report, narrative and disclaimer versions carried separately on §1 and §17 | `tests/report/build.test.ts` | — |
| 2 | Recovery Potential — do not render a pseudo-score when unavailable | Closed | C-02 SC-005 | Recovery Potential renders the approved null copy when Biological State is null; no pseudo-score | `tests/report/build.test.ts`; parity cases GT-017, GT-020 | — |
| 3 | Clarify the meaning of Confidence | Implemented — awaiting ROOTS | Review point 3; C-02 SC-008 and `Classifications` | Confidence explanation in §5; composite note beneath the component values | `reviewPoints.test.ts` — 4 tests, incl. 68 → Moderate-High | C-03 Amendment A1 approval |
| 4 | Clarify score direction in the Seven-Domain Score Breakdown | Implemented — awaiting ROOTS | Review point 4; C-02 `Domains` | Score-direction statement above the §7 bars | `reviewPoints.test.ts` — 3 tests across the seven domains | C-03 Amendment A1 approval |
| 5 | Strengthen the Key Drivers explanation | Implemented — awaiting ROOTS | Review point 5; C-02 DRV-001/002/003 | Driver note added; ranking logic unchanged | `driverStates.test.ts` — 7 tests over all 30 Golden Tests | C-03 Amendment A1 approval |
| 6 | Refine the Executive Summary wording | Closed | C-03 §4; ROOTS wording of 25 Sep | Executive Summary wording for single, list and no-driver states | `driverStates.test.ts` | — |
| 7 | Preserve the Biological State philosophy and boundary | Pre-existing — verified | C-03 §4.3 | None — boundary copy already approved and in place | `build.test.ts` | — |
| 8 | Refine Opportunity Score language | Pre-existing — verified | C-03 §4.4 | None — Opportunity note already carries the approved framing | `build.test.ts` | — |
| 9 | Biological Safety Signals™ — verify the definition | Pre-existing — verified | C-02 `Domains` BS definition | None — definition matches the controlled source | `evidence:point21` matrix, BS row | — |
| 10 | Biological Triad™ — distinguish domains from contextual/protective factors | Closed | C-03 §4.8 | Triad distinguishes drivers from protective factors, now in text as well as colour | `check:parity`; `evidence:section7` | — |
| 11 | Preserve the inflammation boundary | Pre-existing — verified | C-03 §3 IB definition | None — "not a laboratory or clinical inflammation measure" retained | `evidence:point21` matrix, IB row | — |
| 12 | Refine “Future Projection” | Pre-existing — verified | C-03 §4.9 | None — Future Projection uses the approved fallback | `build.test.ts` | — |
| 13 | Refine the 90-Day Roadmap framing | Pre-existing — verified | C-03 §5 | None — roadmap framing approved | `build.test.ts` | — |
| 14 | Keep recommendations low-risk and governed | Pre-existing — verified | C-03 §5 micro-action library | None — actions drawn from the approved library only | `build.test.ts` | — |
| 15 | Refine selected action wording | Pre-existing — verified | C-03 §5 | None | `build.test.ts` | — |
| 16 | Nutrition language | Pre-existing — verified | C-03 §5 nutrition copy | None | `build.test.ts` | — |
| 17 | Rename Suggested Laboratory Discussion | Closed | C-03 §6 | Section titled "Suggested Laboratory Discussion"; prompts only | `build.test.ts` | — |
| 18 | Review Specific Concerns and safety escalation | Pre-existing — verified | C-03 §4.14 | None — Specific Concerns uses approved copy, no alarming labels | `build.test.ts` | — |
| 19 | Add non-destructive data-quality/plausibility handling | Open — inventory supplied | Review point 19; ROOTS review 29 Sep item 2 | The non-destructive requirements hold and are now asserted: entered value and unit stored as given, no unit inference, the entered value printed with its unit. The plausibility prompt is **not** implemented, because C-01 defines no plausibility range and point 19 forbids inventing one | `evidence:point19` — 5 typed measurements inventoried; `reviewPoints.test.ts` — 5 tests | ROOTS to issue the plausibility ranges and answer the three questions in the inventory |
| 20 | Preserve participant answers verbatim | Implemented — awaiting ROOTS | Review point 20; C-01 `scoring_eligible` | Scoring input / Context only / Participant response marking; free text verbatim | `reviewPoints.test.ts` — 3 tests | C-03 Amendment A1 approval |
| 21 | Reduce repetitive templated interpretation language | Open | Review point 21; ROOTS decision 29 Sep item 6 | **None** — approved wording retained | `evidence:point21` — 28-combination matrix | ROOTS to determine which combinations need additional approved content |
| 22 | Preserve “What Is Going Well” | Pre-existing — verified | C-03 §4.13 | None — What Is Going Well retained | `build.test.ts` | — |
| 23 | Improve explainability | Implemented — awaiting ROOTS | Review point 23 | "Why this appeared" on §§3, 4, 5, 6 | `reviewPoints.test.ts` — 6 tests incl. no-causation and no-constants | C-03 Amendment A1 approval |
| 24 | Biological Card | Closed | C-03 §4.17 | Biological Card carries all six elements plus version/audit information | `build.test.ts`; `check:parity` | — |
| 25 | Preserve the Final Word | Pre-existing — verified | C-03 §4.18 | None — Final Word preserved verbatim | `build.test.ts` | — |
| 26 | Medical and AI governance | Implemented — awaiting ROOTS | Review point 26; ROOTS decision 29 Sep item 2 | Architecture statement in governed-narrative context only; §4.19 disclaimer and `DISCLAIMER_VERSION` unchanged | `check:parity` — wording and placement verified in web and PDF; no contradiction found | C-03 Amendment A1 approval |
| 27 | Make the disclaimer easier to read without weakening it | Closed | C-03 §4.19 | Disclaimer shown as four headed groups; `disclaimerGroups()` refuses to return unless the slices rejoin into the approved text exactly | `build.test.ts` — 2 tests | — |
| 28 | Auditability | Closed | C-06 audit requirements | Audit trace reference on every report; 30 audit actions | `ROOTS-AI_M3_Security_Evidence.md` | — |
| 29 | 19-section completeness | Implemented — awaiting ROOTS | Review point 29 | 19-section acceptance matrix produced | `check:parity` — 19/19 sections in all five states | Section 7 presentation rule (item 5) |
| 30 | Web/PDF parity | Implemented — awaiting ROOTS | Review point 30 | Programmatic web/PDF comparison | `check:parity` — 95/95 renderings, 916 canonical values | Section 7 presentation rule (item 5) |
| 31 | Accessibility | Implemented — awaiting ROOTS | Review point 31; C-05 §13 | Triad kinds in text; bar graphic `aria-hidden`; 14 contrast declarations corrected; skip-link focus ring | `check:a11y`, `check:tokens`, `evidence:section7` | ROOTS visual verification of the candidate tokens (item 3) |
| 32 | Final visual hierarchy | Open | Review point 32; File 14 | Not addressed — final visual hierarchy is Golden Screen work | — | Excluded from current scope at the client’s instruction |
| 33 | Trademark presentation | Pre-existing — verified | C-03 trademark usage | None — ™ carried on every controlled mark | `check:parity`; `check:c04` | — |
| 34 | Global-ready presentation | Open — inventory supplied | Review point 34; ROOTS review 29 Sep item 3 | The architectural half holds and is now evidenced: canonical values are stored unformatted, all 15 display formats name their locale, all 10 dates name their time zone, and translation is structurally confined to the controlled packs. Four unpinned formats were found and corrected. Locale-aware presentation is **possible, not implemented** | `evidence:point34` — 15 formatting sites and 4 comparison sites enumerated from source; the run fails on an unpinned format | ROOTS to name target locales, decide UTC vs participant time zone, and say whether a translated C-03/C-04 pack is planned |
| 35 | Do not change the scientific engine while making these report corrections | Closed | Review point 35 | **No change to the scientific engine.** C-01, C-02, the engine and all 30 Golden Test expectations are untouched throughout | `npm test` — the Golden Test suite passes unchanged | — |

## Points that are open, and why

| # | Point | Why it is open |
|---|---|---|
| 21 | Reduce repetitive templated interpretation language | ROOTS to determine which combinations need additional approved content |
| 32 | Final visual hierarchy | Excluded from current scope at the client’s instruction |

## Point 35 — the controlling constraint

"Do not change the scientific engine while making these report corrections." Nothing in any
correction above altered C-01, C-02, the deterministic engine or the Golden Test expected
outputs. Every change is presentation, content mapping or evidence. The Golden Test suite
passes unchanged, which is the check that would fail first if this constraint were breached.

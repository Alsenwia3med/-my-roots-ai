# ROOTS-AI™ — M3 six-item decision matrix

**Responding to:** ROOTS consolidated decision of 29 September 2026.

**Purpose:** the decision requires that we "return the six-item decision matrix, the point 21
content matrix, and the corresponding implementation evidence with the integrated release
candidate", and that for every affected item we distinguish the ROOTS decision, the controlling
source or amendment, the implementation change, the test evidence and the remaining dependency.

**Two rules observed throughout, as instructed:**

- An item is **not** described as approved merely because it is implemented or passes an
  internal test.
- A conditional item is **not** marked closed before its stated evidence or ROOTS approval is
  complete.

---

## Summary

| # | Item | ROOTS decision | Our status |
|---|---|---|---|
| 1 | ASM-01 CTA label | "Begin Assessment" confirmed | **Label closed.** Secure-link journey evidence outstanding |
| 2 | Report wording, C-03 traceability, point 26 | Retain corrections; prepare a controlled amendment | Amendment prepared; **awaiting ROOTS approval** |
| 3 | Accessible text colours | Authorized in principle; values are candidates | Evidence submitted; **awaiting visual verification** |
| 4 | Header and footer touch targets | Retain 44 × 44 px; correct them | **Closed.** All six corrected, including the consent link |
| 5 | Section 7 paragraphs and bars | Not approved; supply field-by-field evidence | Matrix supplied; **ROOTS retains the decision** |
| 6 | Report-review point 21 | Keep open; prepare the 7 × 4 matrix | Matrix supplied; **point 21 remains open** |

---

## 1. ASM-01 — Assessment entry CTA

| | |
|---|---|
| **ROOTS decision** | Confirm "Begin Assessment" as the visible CTA label. C-04 §3 governs participant-facing wording; "Send Secure Link" is not a replacement for the approved visible label. |
| **Controlling source** | C-04 §3 `/assessment — Assessment`. C-05 ASM-01 zone 5 identifies the zone and its secure-link behaviour. |
| **Implementation change** | None required. The button already read "Begin Assessment", from `ASSESSMENT_ENTRY.cta`. |
| **Test evidence** | `npm run check:c04` — 227/227 governed strings verbatim against the controlled source. All six C-05 ASM-01 zones present; desktop column within the 760 px maximum. |
| **Remaining dependency** | The decision requires verification of the complete controlled secure-link journey — intended action, transition to the next step, loading and success states, applicable errors and retry behaviour. **Outstanding.** |
| **Closure** | Label decision **closed**. Functional and screen-level acceptance remains open pending the journey evidence. |

We have introduced no replacement participant-facing wording. If the journey verification finds
that the approved copy does not adequately explain a necessary step, we will identify the exact
gap and location for a ROOTS decision rather than drafting wording.

---

## 2. Report-review wording, C-03 traceability, and point 26

| | |
|---|---|
| **ROOTS decision** | Retain the corrections already issued and implemented; verify them against the controlled rules; incorporate the exact approved wording into a controlled C-03 amendment. Retain the §4.19 disclaimer and its existing `DISCLAIMER_VERSION`. |
| **Controlling source** | C-03 v1.0.1 CORRECTED, **preserved unchanged**, plus Amendment A1 (prepared, not yet controlled). |
| **Implementation change** | Review points 3, 4, 5, 20, 23 implemented. Point 26 statement present in its governed-narrative context only; the approved disclaimer is untouched. |
| **Test evidence** | `tests/report/reviewPoints.test.ts` (16 tests), `tests/report/build.test.ts`, `tests/report/driverStates.test.ts`; `npm run check:parity` confirms both outputs. |
| **Remaining dependency** | ROOTS approval of Amendment A1. |
| **Closure** | Correction instructions and documentation approach confirmed by ROOTS. **Each affected output closes after its source mapping, implementation and tests are verified.** Not closed here. |

**Amendment:** `ROOTS-AI_C03_Amendment_A1_Report_Corrections.md` — 15 entries, each mapped to
source, content identifier, version, permitted section, applicable state, variables and
verification test. Regenerated from the delivered build by `npm run evidence:c03-amendment`, so
the amendment and the build cannot silently diverge. C-03 v1.0.1 is preserved and remains
authoritative for everything the amendment does not name.

**Conditions the decision asked us to evidence** — all recorded in the amendment:

| Condition | Finding |
|---|---|
| Confidence labels derived from C-02, not assigned manually | Produced by a band lookup over the C-02 `Classifications` table; no code path assigns one by hand |
| A value of 68 receives the applicable approved classification | C-02 CONFIDENCE 60–79 = Moderate-High, so 68 → **Moderate-High**; asserted in test |
| The composite explanation reflects SC-008 | SC-008 weights 0.50 / 0.30 / 0.20, so "not a simple average" is accurate; weights not disclosed |
| The score-direction statement is supported for every output | C-02 `Domains` states the direction; all seven share formula SC-001, so it is uniform — **no conflict to flag** |
| Driver and "Why this appeared" content tied to deterministic output | Eligible domains read from `scoring.trace.drivers.eligible`, the engine's own trace |
| Point 20 labels do not change how any answer is used | Labels read the controlled C-01 `scoring_eligible` field; engine and all 30 Golden Tests unchanged |

**Point 26 and §4.19.** The approved disclaimer and `DISCLAIMER_VERSION` are retained. The point
26 statement remains attached where a governed narrative touches a section; it does not replace
the disclaimer and does not suggest AI can calculate, select or modify authoritative results. We
verified the wording and placement in both web and PDF and **identified no contradiction**. Had
we found one, we would have reported both passages and their locations rather than resolving it
by editing legal content.

---

## 3. Accessible text colours

| | |
|---|---|
| **ROOTS decision** | Purpose-specific accessible text variants authorized **in principle**. The proposed values are **not** granted final visual approval. Do not replace `--zd-teal` or `--zd-gold` globally. |
| **Controlling source** | C-05 §13 contrast requirement. Approved brand colours and Golden Screen visual direction unchanged. |
| **Implementation change** | `--zd-teal-ink #437971` and `--zd-gold-ink #886b2e` added as text-specific candidates and applied to the affected declarations. The approved accents remain in use for rules, borders, icons and large display text. |
| **Test evidence** | `npm run check:tokens` — before/after for every declaration with its actual surface, size, weight, measured contrast and interaction states. `npm run check:a11y` — 286 declarations checked. |
| **Remaining dependency** | ROOTS contrast and visual verification of the exact values and affected states. |
| **Closure** | Correction **method** authorized. Token values and visual states **not closed**. |

**Correction to our earlier count.** Our message of 28 September reported eleven affected
declarations and the decision quotes that figure. The correct number is **14**: the original
count treated each of the five legal notices as one declaration when each has two — an eyebrow
and a body link. Every declaration is itemised in the evidence so the figure can be checked.

Two further declarations were corrected on their own terms without a candidate token: the status
pill (muted on gray-100 was 4.39:1, now soft navy) and the article share field (white surface,
charcoal value text).

Contrast verified on all three light surfaces, not only white. The approved accents remain in
active use (`--zd-teal` × 15, `--zd-gold` × 16), so neither was globally replaced. No declaration
required a visible departure from the approved reference, so there is no isolated change to
submit for written conformity approval. The home screen needed no change: its gold sits on navy
at 6.03–6.21:1.

---

## 4. Header and footer touch targets

| | |
|---|---|
| **ROOTS decision** | Retain C-05's 44 × 44 px minimum; do not substitute the WCAG threshold. Correct the undersized targets. First enlarge the effective interactive area without changing approved visible dimensions, alignment, spacing or hierarchy where technically possible. |
| **Controlling source** | C-05 §5, touch target. |
| **Implementation change** | Four controls corrected with a centred `::after` overlay, which is absolutely positioned and contributes nothing to layout. Each keeps its exact approved visible box. |
| **Test evidence** | `npm run evidence:responsive` — effective interactive bounds measured at 320/360/640/768/1024/1440 px, with overlap checked against every neighbouring control. |
| **Remaining dependency** | None. |
| **Closure** | Requirement confirmed and closed. Every measured control meets 44 × 44 px at 320/360/768/1024/1440 px. |

| Control | Visible box (unchanged) | Effective target |
|---|---|---|
| Brand logo link | 37 × 48 | 44 × 48 |
| Footer brand link | 143 × 34 | 143 × 44 |
| "More" navigation button | 35 × 44 | 44 × 44 |
| Assessment shell logo link | 37 × 48 | 44 × 48 |
| ASM-01 legal links (included per the decision) | — | 26 px → 44 px tall |

No enlarged area intersects another control, so no unintended activation is introduced. Keyboard
access, visible focus (`solid 3px #2563eb`, 5.17:1) and accessible labels are preserved and were
re-verified after the change.

**The one case we submitted rather than fixed — now applied.** We described the "Privacy Notice"
link as a footer link. It is not: it sits inside the contact form's consent sentence as an inline
link within running text, wrapped by the checkbox label. The footer's own links already meet
44 × 44 px.

ROOTS ruled that the 44 × 44 px minimum stands, so the adjustment is applied. Vertical padding on
an inline element expands the pointer target without entering layout: the link's 20 px inline box
plus 12 px above and below gives exactly 44 px, and the link itself does not move. The sentence
keeps its wording, its size, its colour and its line breaks; the one visible change is the space
between those lines. Measured live at 111 × 44 px.

**Correction to our own figures.** We submitted this as "line-height 20 → 24 px, block +8 px".
Both numbers were wrong. The 20 px was the link's own inline box, not the line-height, which was
already 26 px in the stylesheet and 24 px as rendered; and 24 px would not have kept the enlarged
target clear of the lines around it. A 44 px target reaches 22 px from the centre of its line, an
adjacent line of text reaches 10 px back from the centre of its own, and the two stop touching at
exactly 32 px. The consent sentence is set to **line-height 32 px**, up from the 24 px it
rendered at. The block therefore grows by 8 px per wrapped line: 24 px at 375 px width, where the
sentence runs to three lines.

The enlarged target overlaps neither the checkbox nor the text of the line above or below it, so
a click meant for the label still ticks the box. That follows from the 32 px line-height and so
holds at any width; it was measured directly at 375 px by hit-testing every 4 px down the consent
block, where each row returns the link itself or the label and never another control. The link
does not wrap at 320, 360, 768, 1024 or 1440 px, so it stays a single 111 × 44 px fragment.

---

## 5. Section 7 — canonical paragraphs and bar rendering

| | |
|---|---|
| **ROOTS decision** | Preserve the canonical object and its paragraphs pending verification. Do **not** treat paragraph suppression as approved. Supply a field-by-field comparison, verify accessible representation, provide an evidence matrix. |
| **Controlling source** | C-03 §4.7 and §2; C-05 §13 for the accessible representation. |
| **Implementation change** | No canonical paragraph deleted or altered. One accessibility change: the bar graphic is now `aria-hidden="true"`. |
| **Test evidence** | `npm run evidence:section7` — **179 field comparisons** across five cases covering scored, null and each classification band. |
| **Remaining dependency** | **ROOTS retains the approval decision on semantic equivalence.** |
| **Closure** | Closes only after ROOTS confirms the presentation rule and the implementation passes the corresponding tests. **Not closed.** |

Every field in a suppressed paragraph — domain name, score, classification, null qualifier — is
rendered by the bar, and the interpretation and safety text are rendered by the section items, in
both web and PDF and in the accessible output. On that evidence we **propose** recording the
suppression as a shared presentation rule with the canonical paragraphs retained. We are not
treating that as decided.

**Duplicate announcement found and removed.** The decision asks us to avoid unnecessary duplicate
announcements. The bar carried `role="img"` with an `aria-label` repeating the visible text
immediately above it, so a screen reader announced every domain twice. The graphic is now
`aria-hidden`, and the visible text remains the chart's text equivalent as C-05 §13 requires.

---

## 6. Report-review point 21 — domain-specific interpretation

| | |
|---|---|
| **ROOTS decision** | **Keep point 21 open.** No waiver is issued. Retain the current approved wording. Prepare the 7 × 4 matrix using existing approved content only; mark missing interpretation as requiring ROOTS content approval. |
| **Controlling source** | C-03 §3 domain meanings and classification explanations; C-02 `Classifications` bounds. |
| **Implementation change** | **None.** The approved current presentation is retained unchanged. |
| **Test evidence** | `npm run evidence:point21` — all 28 combinations, each with its approved meaning, approved classification explanation and the exact current rendered text taken from the real builder. |
| **Remaining dependency** | ROOTS determination of which combinations require additional approved content, issued as a controlled C-03 amendment. |
| **Closure** | **Open.** Closes after the applicable content is approved, implemented and verified. |

All 28 combinations are marked as having no domain-specific interpretation in C-03 v1.0.1. We
searched the controlled pack and found no such library: C-03 provides per-domain meanings and
four per-classification explanations, and nothing combining them.

Nothing in the matrix is newly authored. No cell contains physiological or medical claims, and no
variations were generated to make the combinations sound different. The matrix is a review
instrument, as the decision states.

The decision records that the alternative — accepting the current presentation — would require a
separate, explicit ROOTS decision, and that no such decision is issued. We have therefore **not**
recorded point 21 as closed on the basis of the current pairing.

---

## Evidence index

| Item | Document | Regenerate |
|---|---|---|
| 1 | `ROOTS-AI_M3_Decision_Log.md` (Q-01) | — |
| 2 | `ROOTS-AI_C03_Amendment_A1_Report_Corrections.md` | `npm run evidence:c03-amendment` |
| 3 | `ROOTS-AI_M3_Token_Contrast_Evidence.md` | `npm run check:tokens` |
| 4 | `ROOTS-AI_M3_Responsive_Evidence.md` | `npm run evidence:responsive` |
| 5 | `ROOTS-AI_M3_Section7_Presentation_Matrix.md` | `npm run evidence:section7` |
| 6 | `ROOTS-AI_M3_Point21_Content_Matrix.md` | `npm run evidence:point21` |
| All | `ROOTS-AI_M3_Web_PDF_Parity_Matrix.md`, `ROOTS-AI_M3_Accessibility_Evidence.md`, `ROOTS-AI_M3_Security_Evidence.md` | see the submission index |

Repository, branch, commit, build and test version for every evidence set are recorded in the
integrated submission. Where a correction was made after a test run, the affected tests are
re-run against the delivered commit; earlier passing results are not offered as evidence that a
later build still passes.

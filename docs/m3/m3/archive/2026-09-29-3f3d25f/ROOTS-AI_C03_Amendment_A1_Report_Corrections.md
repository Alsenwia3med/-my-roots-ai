# ROOTS-AI™ — C-03 Amendment A1: report corrections of 24 September 2026

**Amendment:** A1 to C-03 v1.0.1 CORRECTED. **Report template version:** 1.0.1.

**Status:** prepared by the vendor for ROOTS approval, per the decision of 29 September 2026,
item 2. Not yet a controlled document.

## Authority

The ROOTS decision of 29 September 2026 records that the report-review instructions of
24 September "are not suspended while that amendment is prepared" and that an approved
correction must not be reverted "merely because the original C-03 v1.0.1 did not yet contain
its wording".

This amendment therefore records the exact issued wording as the controlled implementation
authority for the specified corrections. **C-03 v1.0.1 CORRECTED is preserved unchanged** and
remains authoritative for everything this amendment does not name.

Each string below is reproduced from the delivered build by `npm run evidence:c03-amendment`,
so the amendment cannot silently diverge from what is implemented. The amendment is the
authority; regeneration is how it is kept faithful. Text embedded in code is not treated as
the authoritative source.

## Scope

Report-review points 3, 4, 5, 20 and 23, plus the Triad element captions required by point 31
and C-05 §13. **Out of scope:** the C-03 §4.19 disclaimer and `DISCLAIMER_VERSION`, which the
decision retains unchanged for this release, and any wording not supplied by the controlled
package or the issued review — which "requires a separate ROOTS decision before
implementation".

## Entries

### A1-P03-01 — review point 3 — Clarify the meaning of Confidence

> Confidence reflects data completeness, self-reported answer confidence and internal response consistency—not diagnostic certainty.

| Attribute | Value |
|---|---|
| Content identifier | `A1-P03-01` |
| Origin | ROOTS verbatim |
| Source | Final report review, 24 September 2026, point 3 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §5 ROOTS Confidence™ — paragraph |
| Applicable state | Every state, including when Confidence is derived without a consistency term |
| Variables | none |
| Verification test | `review point 3 — the meaning of Confidence › section 5 carries the approved explanation` |

### A1-P03-02 — review point 3 — Composite explanation, shown where the components are shown

> The composite Confidence score is produced by the controlled confidence model, which combines these components with fixed weightings. It is not a simple average of the values above.

| Attribute | Value |
|---|---|
| Content identifier | `A1-P03-02` |
| Origin | Drafted to the review instruction |
| Source | Final report review, 24 September 2026, point 3 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §5 ROOTS Confidence™ — footnote beneath the component values |
| Applicable state | Every state in which the component values are displayed |
| Variables | none |
| Verification test | `review point 3 › the composite is explained where the component scores are shown` |

### A1-P04-01 — review point 4 — Clarify score direction

> Higher scores indicate greater reported burden within this assessment.

| Attribute | Value |
|---|---|
| Content identifier | `A1-P04-01` |
| Origin | ROOTS verbatim |
| Source | Final report review, 24 September 2026, point 4 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §7 Seven-Domain Score Breakdown — lede, above the bars |
| Applicable state | Every state, including where some domains are null |
| Variables | none |
| Verification test | `review point 4 › the direction statement appears with the breakdown` |

### A1-P05-01 — review point 5 — Strengthen the Key Drivers explanation

> Drivers identify the highest-ranked eligible questionnaire domains; they do not establish biological causation.

| Attribute | Value |
|---|---|
| Content identifier | `A1-P05-01` |
| Origin | ROOTS verbatim |
| Source | Final report review, 24 September 2026, point 5 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §6 Key Drivers — paragraph after the ranking |
| Applicable state | Every state, including the no-eligible-driver state |
| Variables | none |
| Verification test | `driver output entries across the report (D-04)` |

### A1-P20-01 — review point 20 — Preserve participant answers verbatim

> Scoring input / Context only

| Attribute | Value |
|---|---|
| Content identifier | `A1-P20-01` |
| Origin | Drafted to the review instruction |
| Source | Final report review, 24 September 2026, point 20 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §16 Participant Answers — per-answer marking |
| Applicable state | Every answer. Derived from the controlled C-01 `scoring_eligible` field |
| Variables | `kind` ∈ { scoring, context } |
| Verification test | `review point 20 › every answer states whether it was a scoring input, from the C-01 field` |

### A1-P20-02 — review point 20 — Identify free text as the participant’s own words

> Participant response

| Attribute | Value |
|---|---|
| Content identifier | `A1-P20-02` |
| Origin | Drafted to the review instruction |
| Source | Final report review, 24 September 2026, point 20 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §16 Participant Answers — marking on free-text answers |
| Applicable state | Answers whose C-01 `question_type` is `free_text` |
| Variables | `freeText` ∈ { true, false } |
| Verification test | `review point 20 › free text is identified as the participant response` |

### A1-P23-00 — review point 23 — Improve explainability (heading)

> Why this appeared

| Attribute | Value |
|---|---|
| Content identifier | `A1-P23-00` |
| Origin | Drafted to the review instruction |
| Source | Final report review, 24 September 2026, point 23 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §§3, 4, 5, 6 — heading above the explanation |
| Applicable state | Wherever an explanation is rendered |
| Variables | none |
| Verification test | `review point 23 › the major scores and the drivers each carry an explanation` |

### A1-P23-01 — review point 23 — Biological State explainability

> This value summarizes the seven-domain scores available in your answers ({available_list}). It is a composite of those domain scores, not a separate measurement.

| Attribute | Value |
|---|---|
| Content identifier | `A1-P23-01` |
| Origin | Drafted to the review instruction |
| Source | Final report review, 24 September 2026, point 23 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §3 ROOTS Biological State™ |
| Applicable state | Biological State available (C-02 SC-002) |
| Variables | `{available_list}` — the domains with a score, in the fixed display order |
| Verification test | `review point 23 › no explanation exposes a weighting, constant or threshold` |

### A1-P23-02 — review point 23 — Biological State, null state

> Too few of the seven domains had enough answers for this composite to be produced, so no value is shown.

| Attribute | Value |
|---|---|
| Content identifier | `A1-P23-02` |
| Origin | Drafted to the review instruction |
| Source | Final report review, 24 September 2026, point 23 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §3 ROOTS Biological State™ |
| Applicable state | Biological State null — fewer than five domains available (C-02 SC-002) |
| Variables | none |
| Verification test | `review point 23 › a null score is explained rather than left unexplained` |

### A1-P23-03 — review point 23 — Opportunity Score explainability

> This value is derived from your ROOTS Biological State™ score. It uses no answers beyond those already summarized there.

| Attribute | Value |
|---|---|
| Content identifier | `A1-P23-03` |
| Origin | Drafted to the review instruction |
| Source | Final report review, 24 September 2026, point 23 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §4 ROOTS Opportunity Score™ |
| Applicable state | Opportunity available (C-02 SC-003) |
| Variables | none |
| Verification test | `review point 23 › no explanation exposes a weighting, constant or threshold` |

### A1-P23-04 — review point 23 — Opportunity Score, null state

> This value is derived from your ROOTS Biological State™ score, which is not available for this assessment.

| Attribute | Value |
|---|---|
| Content identifier | `A1-P23-04` |
| Origin | Drafted to the review instruction |
| Source | Final report review, 24 September 2026, point 23 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §4 ROOTS Opportunity Score™ |
| Applicable state | Opportunity null, because Biological State is null (C-02 SC-003) |
| Variables | none |
| Verification test | `review point 23 › a null score is explained rather than left unexplained` |

### A1-P23-05 — review point 23 — Confidence explainability

> This value comes from three recorded inputs: how much of the questionnaire you answered ({coverage_percent}% of scored questions), the answer confidence you reported yourself ({answer_confidence}/100), and how consistent your responses were within each available domain.

| Attribute | Value |
|---|---|
| Content identifier | `A1-P23-05` |
| Origin | Drafted to the review instruction |
| Source | Final report review, 24 September 2026, point 23 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §5 ROOTS Confidence™ |
| Applicable state | Every state |
| Variables | `{coverage_percent}`, `{answer_confidence}` — both already displayed as components |
| Verification test | `review point 3 › the Confidence label is the C-02 band for the score, never chosen by hand` |

### A1-P23-06 — review point 23 — Key Drivers explainability

> The domains named above were the highest-ranked of the domains that met the eligibility rule in your answers. The domains that met it, in rank order, were: {eligible_list}. Ranking reflects the level of burden reported in those domains; it does not identify a cause.

| Attribute | Value |
|---|---|
| Content identifier | `A1-P23-06` |
| Origin | Drafted to the review instruction |
| Source | Final report review, 24 September 2026, point 23 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §6 Key Drivers |
| Applicable state | At least one domain meets DRV-001 eligibility |
| Variables | `{eligible_list}` — read from `scoring.trace.drivers.eligible`, in DRV-002 rank order |
| Verification test | `review point 23 › the driver explanation matches what the engine found eligible` |

### A1-P23-07 — review point 23 — Key Drivers, no eligible driver

> No domain met the eligibility rule in the available answers, so no driver is ranked. This may reflect missing answers rather than an absence of signals.

| Attribute | Value |
|---|---|
| Content identifier | `A1-P23-07` |
| Origin | Drafted to the review instruction |
| Source | Final report review, 24 September 2026, point 23 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §6 Key Drivers |
| Applicable state | No domain meets DRV-001 eligibility |
| Variables | none |
| Verification test | `review point 23 › the driver explanation matches what the engine found eligible` |

### A1-P31-01 — review point 31 / C-05 §13 — Biological Triad element kinds

> Driver / Protective factor / Not available

| Attribute | Value |
|---|---|
| Content identifier | `A1-P31-01` |
| Origin | Drafted to the review instruction |
| Source | Final report review, 24 September 2026, point 31 / C-05 §13 |
| Version | Amendment A1 to C-03 v1.0.1; report template 1.0.1 |
| Permitted report section | §8 Biological Triad™ — caption on each element, web and PDF |
| Applicable state | Every rendered element |
| Variables | `kind` ∈ { driver, protective, unavailable } |
| Verification test | `npm run check:parity` — compared in both outputs across all five cases |

## Conditions verified before use

The decision requires evidence for the conditions we reported having verified. Each was
checked against the controlled source before the wording was applied.

| Condition | Controlled source | Finding | Test |
|---|---|---|---|
| Confidence values and labels are derived from approved C-02 rules, not assigned manually | C-02 `Classifications`, scale `CONFIDENCE` | The label is produced by a band lookup over the C-02 table; no code path assigns one by hand | `the Confidence label is the C-02 band for the score, never chosen by hand` |
| A value of 68 receives the applicable approved classification | C-02 `Classifications`: CONFIDENCE 60-79 = Moderate-High | 68 classifies as **Moderate-High** | same test, which asserts `band(68) === 'Moderate-High'` |
| The composite explanation reflects the approved SC-008 calculation | C-02 `Formulas` SC-008: 0.50 x coverage + 0.30 x Q72 + 0.20 x mean consistency | Weighted, so "not a simple average" is accurate. The weights are not disclosed to participants | `the composite is genuinely not a simple average of the displayed components` |
| The score-direction statement is supported for every output it is applied to | C-02 `Domains`: "Higher scores mean greater self-reported burden"; all seven share formula SC-001 | Direction is uniform across the seven displayed domains; **no conflict to flag** | `the statement matches the canonical direction for every displayed domain` |
| Driver wording and "Why this appeared" stay tied to the deterministic output | C-02 DRV-001/002/003 | The eligible-domain list is read from `scoring.trace.drivers.eligible`, the engine's own trace, so it cannot drift from the rule that produced the drivers | `the driver explanation matches what the engine found eligible` |
| The point 20 labels do not change how any answer is used by the engine | C-01 `scoring_eligible` | The labels read that controlled field; the engine is untouched, and all 30 Golden Tests are unchanged | `every answer states whether it was a scoring input, from the C-01 field` |
| No explanation implies causation | Review point 23 | Asserted across all 30 Golden Tests and four sections | `no explanation implies causation` |
| No explanation exposes a weighting, constant or threshold | Review point 23 | Asserted; only coverage % and the answer-confidence value appear, both already shown to the participant | `no explanation exposes a weighting, constant or threshold` |

## Point 26 and the C-03 §4.19 disclaimer

Per the decision: the approved §4.19 disclaimer and its existing `DISCLAIMER_VERSION` are
retained for this release, and no replacement disclaimer or new disclaimer version is
authorized. The point 26 statement remains in its governed-narrative context only, attached
where a governed narrative touches a section, and does not replace the approved disclaimer.

The §4.19 disclaimer is presented as four headed groups for readability (review point 27). The
grouping is slices of the approved text: `disclaimerGroups()` refuses to return unless
re-joining them reproduces that text character for character, so the disclaimer is still shown
in full and untruncated and no word is rewritten. That is why `DISCLAIMER_VERSION` is unchanged.

## Traceability

| Item | Value |
|---|---|
| Preserved controlled source | C-03 v1.0.1 CORRECTED — unchanged |
| Amendment | A1 (this document) |
| Report template version | 1.0.1 |
| Regenerate | `npm run evidence:c03-amendment` |
| Rendering evidence | `npm run evidence:parity && npm run check:parity` — web and PDF |
| Test suite | `npm test` |

**Commit, branch and build are recorded in the integrated submission**, per the decision that
every evidence set be associated with the exact repository, branch, commit, build and test
version, and that affected tests be re-run against the delivered commit.

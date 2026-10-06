# ROOTS-AI™ — C-03 wording register: ROOTS-issued and vendor-drafted

Prepared in response to the ROOTS review of 29 September 2026, item 7.

Every participant-facing string the report can print, separated by who wrote it, so that
approval can be given to our wording without re-approving ROOTS'.

## How each string was classified

Not by a label in our code. Each string is looked for, word for word, in two controlled
sources: the C-03 Report Content & Visual Reference Pack v1.0.1 CORRECTED, and the Final
Report Review of 24 September 2026. A string found in either was written by ROOTS; a string
found in neither was written by us.

Comparison is whitespace-insensitive only, as in the C-04 check: a PDF wraps sentences
across lines, so runs of whitespace collapse on both sides, and typographic quotes are
folded because the two sources print them differently. A changed word, a dropped clause or
altered punctuation does not match. Strings carrying `{placeholders}` are matched whole,
because both sources print the placeholder tokens themselves rather than filled examples.

Regenerate with `npm run check:c03`.

## Summary

| | Strings | What ROOTS is being asked to do |
|---|---|---|
| ROOTS-issued — C-03 pack | 80 | Nothing. Already controlled and approved. |
| ROOTS-issued — 24 Sep review | 5 | Nothing. Issued wording, reproduced verbatim. |
| **Vendor-drafted** | **19** | **Approve, amend or reject each.** |
| Short labels, not classified | 19 | Confirm by eye; a substring hit proves nothing at this length. |
| Total | 123 | |

---

## 1. ROOTS-issued — found verbatim in the C-03 pack

Controlled copy. Listed so the register is complete; no decision is required.

| Where | String |
|---|---|
| `REPORT_TITLE` | ROOTS Biological Intelligence Report™ |
| `EDUCATIONAL_BADGE` | Educational — Not a Diagnosis |
| `DOMAIN_LABELS.HS` | Hunger & Satiety Signals™ |
| `DOMAIN_LABELS.SR` | Sleep Recovery Index™ |
| `DOMAIN_LABELS.CH` | Circadian Health Score™ |
| `DOMAIN_LABELS.IB` | Inflammation Burden Index™ |
| `DOMAIN_LABELS.BS` | Biological Safety Signals™ |
| `DOMAIN_MEANINGS.MR` | Self-reported resistance to expected weight change and activity-related metabolic context. |
| `DOMAIN_MEANINGS.HS` | Hunger, craving, fullness and post-meal response patterns. |
| `DOMAIN_MEANINGS.SR` | Sleep duration, continuity and perceived restoration. |
| `DOMAIN_MEANINGS.CH` | Alignment of light, screen, meal and sleep timing. |
| `DOMAIN_MEANINGS.SL` | Perceived tension, cognitive activation and stress-linked eating. |
| `DOMAIN_MEANINGS.IB` | Non-specific symptom burden; not a laboratory or clinical inflammation measure. |
| `DOMAIN_MEANINGS.BS` | Perceived energy, appetite drive and resistance signals. |
| `CLASSIFICATION_EXPLANATIONS.Optimized` | Few burden signals were reported in this area. |
| `CLASSIFICATION_EXPLANATIONS.Compensating` | Some signals are present, while current routines may still be helping your system compensate. |
| `CLASSIFICATION_EXPLANATIONS.Strained` | Several signals may be placing consistent pressure on this area. |
| `CLASSIFICATION_EXPLANATIONS.Dysregulated` | A high burden of signals was reported. This is not a diagnosis; consider discussing persistent or concerning symptoms with a qualified professional. |
| `SECTION_TITLES[3]` | ROOTS Biological State™ |
| `SECTION_TITLES[4]` | ROOTS Opportunity Score™ |
| `SECTION_TITLES[7]` | Seven-Domain Score Breakdown |
| `SECTION_TITLES[13]` | What Is Going Well |
| `SECTION_TITLES[15]` | Suggested Laboratory Discussion |
| `SECTION_TITLES[19]` | Medical and AI Disclaimer |
| `COPY.executiveSummary` | Your current pattern reflects a combination of reported biological signals. The strongest areas in this assessment are {primary_driver}, {secondary_driver} and {tertiary_driver}. These results are educational and describe your answers; they do not diagnose a condition. |
| `COPY.biologicalState` | Your ROOTS Biological State™ is {biological_state}/100 — {domain_classification}. |
| `COPY.biologicalStateNote` | This summarizes the available seven-domain questionnaire pattern; it is not a medical risk probability. |
| `COPY.opportunity` | Your ROOTS Opportunity Score™ is {opportunity_score}/100. |
| `COPY.opportunityNote` | This proprietary educational indicator reflects the amount of modifiable capacity suggested by the current questionnaire pattern. It is not a forecast or clinical outcome probability. |
| `COPY.confidence` | Confidence in this interpretation is {confidence_label} ({confidence_score}/100). |
| `COPY.drivers` | Primary: {primary_driver}. Secondary: {secondary_driver}. Tertiary: {tertiary_driver}. |
| `COPY.noDriver` | No dominant burden signal was identified in the available answers. |
| `COPY.domainLine` | {domain_label}: {domain_score}/100 — {domain_classification}. |
| `COPY.domainNull` | Not enough information |
| `COPY.triad` | Your current triad connects {primary_driver}, {secondary_driver} and {top_protective_factor}. |
| `COPY.futureProjection` | If the current pattern continues, the same signals may remain influential. Small consistent changes may alter the pattern over time. |
| `COPY.roadmapMonths[0]` | Month 1 — Stabilize signals. |
| `COPY.roadmapMonths[1]` | Month 2 — Build flexibility. |
| `COPY.roadmapMonths[2]` | Month 3 — Reinforce recovery. |
| `COPY.nutrition` | Focus on meal structure, adequate protein and fibre, hydration, and timing patterns that match your circumstances. |
| `COPY.actions` | Start with the smallest action you can repeat consistently. |
| `COPY.goingWell` | Your answers also show strengths that may support change. |
| `COPY.noProtective` | No protective factor was confirmed from the available answers; this may reflect missing data rather than absence. |
| `COPY.concerns` | Some reported signals may deserve additional attention, especially if they are persistent, worsening or affecting daily function. |
| `COPY.laboratory` | You may wish to discuss whether any tests are appropriate with a qualified healthcare professional. |
| `COPY.answers` | Your answers are shown exactly as submitted. |
| `COPY.biologicalCard` | Biological State {biological_state}; Opportunity {opportunity_score}; Recovery Potential {recovery_potential}; Confidence {confidence_label}. |
| `COPY.finalWord` | Your answers are a starting point, not a verdict. Choose one realistic action, observe how you respond, and seek professional support when symptoms are persistent or concerning. |
| `COPY.disclaimer` | ROOTS-AI™ provides educational wellness information based on self-reported answers. It is not a medical device, diagnostic service, clinical assessment, prognosis or substitute for a qualified healthcare professional. It does not provide medical treatment or medication instructions. Scores are proprietary questionnaire indicators and are not validated probabilities of disease or future outcomes. AI may assist with wording, but all scores and classifications are calculated by deterministic rules. If you have severe, sudden or worsening symptoms, or believe you may be in immediate danger, contact local emergency services or a qualified healthcare professional. |
| `MICRO_ACTIONS.MR.action` | Schedule three 10-minute walks after meals this week. |
| `MICRO_ACTIONS.MR.rationale` | Supports routine movement without promising weight loss. |
| `MICRO_ACTIONS.MR.safety` | If exercise is unsafe or painful, obtain professional guidance. |
| `MICRO_ACTIONS.HS.action` | Include a protein source and fibre-rich food in one regular meal daily. |
| `MICRO_ACTIONS.HS.rationale` | May support meal satisfaction. |
| `MICRO_ACTIONS.HS.safety` | Adapt for allergies, kidney disease or clinician-directed diets. |
| `MICRO_ACTIONS.SR.action` | Keep wake time within a one-hour window for seven days. |
| `MICRO_ACTIONS.SR.rationale` | Supports a consistent recovery schedule. |
| `MICRO_ACTIONS.SR.safety` | Persistent snoring/gasping warrants professional assessment. |
| `MICRO_ACTIONS.CH.action` | Seek 10-20 minutes of outdoor morning light when safe. |
| `MICRO_ACTIONS.CH.rationale` | Supports time-of-day cues. |
| `MICRO_ACTIONS.CH.safety` | Avoid direct sun exposure beyond safe local guidance. |
| `MICRO_ACTIONS.SL.action` | Use a two-minute slow-breathing or pause routine once daily. |
| `MICRO_ACTIONS.SL.rationale` | Creates a repeatable recovery cue. |
| `MICRO_ACTIONS.SL.safety` | Not a substitute for mental-health care. |
| `MICRO_ACTIONS.IB.action` | Track one recurring symptom, meal context and timing for seven days. |
| `MICRO_ACTIONS.IB.rationale` | May help identify patterns for discussion. |
| `MICRO_ACTIONS.IB.safety` | Do not use the log to self-diagnose food intolerance. |
| `MICRO_ACTIONS.BS.action` | Choose one action small enough to repeat for two weeks. |
| `MICRO_ACTIONS.BS.rationale` | Builds consistency while respecting perceived resistance. |
| `MICRO_ACTIONS.BS.safety` | Seek care for persistent, severe or unexplained symptoms. |
| `LAB_LIBRARY.GLUCOSE.discussion` | Whether glucose regulation testing, such as fasting glucose or HbA1c, is appropriate |
| `LAB_LIBRARY.GLUCOSE.mandatory` | Only a clinician can decide whether testing is appropriate and interpret the result. |
| `LAB_LIBRARY.THYROID.discussion` | Whether thyroid evaluation is appropriate |
| `LAB_LIBRARY.THYROID.mandatory` | Questionnaire answers cannot determine thyroid function. |
| `LAB_LIBRARY.CARDIOMETABOLIC.discussion` | Whether a lipid profile and blood-pressure review are appropriate |
| `LAB_LIBRARY.CARDIOMETABOLIC.mandatory` | No test is required by ROOTS-AI™. |
| `LAB_LIBRARY.NON_SPECIFIC.discussion` | Whether targeted clinical evaluation is appropriate before broad testing |
| `LAB_LIBRARY.NON_SPECIFIC.mandatory (not shown)` | Do not recommend hs-CRP or other tests automatically. |
| `LAB_LIBRARY.SLEEP.discussion` | Whether sleep assessment is appropriate |
| `LAB_LIBRARY.SLEEP.mandatory (not shown)` | Do not label sleep apnoea from the questionnaire. |

## 2. ROOTS-issued — found verbatim in the review of 24 September 2026

Wording ROOTS supplied in the review and we reproduced without alteration. C-03 Amendment
A1 records each of these with its content identifier, permitted section and applicable
state; this register confirms the wording itself is ROOTS'.

| Where | String |
|---|---|
| `TRIAD_NOTE` | The diagram shows possible relationships between these areas, not causes. |
| `DRIVER_NOTE` | Drivers identify the highest-ranked eligible questionnaire domains; they do not establish biological causation. |
| `CONFIDENCE_NOTE` | Confidence reflects data completeness, self-reported answer confidence and internal response consistency—not diagnostic certainty. |
| `DOMAIN_DIRECTION_NOTE` | Higher scores indicate greater reported burden within this assessment. |
| `WHY_HEADING` | Why this appeared |

## 3. Vendor-drafted — for ROOTS approval

These sentences appear in no controlled source. We wrote them, because the report cannot
render the state without them or because a review instruction required an explanation that
C-03 does not supply. Each is minimal, states no finding the controlled rules have not
already determined, and names no weighting, constant or threshold.

**Until ROOTS approves them, they are vendor copy in a controlled document.** They are
listed here individually so that approval, amendment or rejection can be recorded per
string rather than in the aggregate.

| Where | String | ROOTS decision |
|---|---|---|
| `COPY.executiveSummarySingle` | Your current pattern reflects a combination of reported biological signals. The highest-ranked driver in this assessment is {primary_driver}. These results are educational and describe your answers; they do not diagnose a condition. |  |
| `COPY.executiveSummaryList` | Your current pattern reflects a combination of reported biological signals. The highest-ranked drivers in this assessment are {driver_list}. These results are educational and describe your answers; they do not diagnose a condition. |  |
| `COPY.triadTwo` | The available information brings together {first} and {second}. |  |
| `COPY.triadOne` | Only {first} is available for this view. |  |
| `COPY.triadNone` | Not enough information is available to display this view. |  |
| `TRIAD_DIAGRAM_LABEL` | Biological Triad — the elements this view brings together |  |
| `CONFIDENCE_COMPOSITE_NOTE` | The composite Confidence score is produced by the controlled confidence model, which combines these components with fixed weightings. It is not a simple average of the values above. |  |
| `WHY.biologicalState` | This value summarizes the seven-domain scores available in your answers ({available_list}). It is a composite of those domain scores, not a separate measurement. |  |
| `WHY.biologicalStateNull` | Too few of the seven domains had enough answers for this composite to be produced, so no value is shown. |  |
| `WHY.opportunity` | This value is derived from your ROOTS Biological State™ score. It uses no answers beyond those already summarized there. |  |
| `WHY.opportunityNull` | This value is derived from your ROOTS Biological State™ score, which is not available for this assessment. |  |
| `WHY.confidence` | This value comes from three recorded inputs: how much of the questionnaire you answered ({coverage_percent}% of scored questions), the answer confidence you reported yourself ({answer_confidence}/100), and how consistent your responses were within each available domain. |  |
| `WHY.drivers` | The domains named above were the highest-ranked of the domains that met the eligibility rule in your answers. The domains that met it, in rank order, were: {eligible_list}. Ranking reflects the level of burden reported in those domains; it does not identify a cause. |  |
| `WHY.driversNone` | No domain met the eligibility rule in the available answers, so no driver is ranked. This may reflect missing answers rather than an absence of signals. |  |
| `PROTECTIVE_LABELS.P1` | Regular physical activity |  |
| `PROTECTIVE_LABELS.P2` | Consistent meal timing |  |
| `PROTECTIVE_LABELS.P3` | A supportive home food environment |  |
| `PROTECTIVE_LABELS.P4` | No current nicotine use |  |
| `PROTECTIVE_LABELS.P5` | Readiness to try one small change |  |

## 4. Short labels — not classified by search

One- and two-word labels. A substring hit in a 60-page pack proves nothing at this length:
the pack contains "Driver" only inside "Driver cardinality and rendering", a heading about
implementation rather than the Triad caption that string is. A label that is absent may
equally be the approved one under a heading the extraction did not carry. These are
therefore counted neither as issued nor as drafted: the Found column is information only,
and ROOTS is asked to confirm them by eye against C-03 §3 and §4.

| Where | String | Found in |
|---|---|---|
| `PARTICIPANT_FALLBACK` | Participant | C-03 pack |
| `DOMAIN_LABELS.MR` | Metabolic Resistance™ | C-03 pack |
| `DOMAIN_LABELS.SL` | Stress Load™ | C-03 pack |
| `SECTION_TITLES[1]` | Cover Page | C-03 pack |
| `SECTION_TITLES[2]` | Executive Summary | C-03 pack |
| `SECTION_TITLES[5]` | ROOTS Confidence™ | C-03 pack |
| `SECTION_TITLES[6]` | Key Drivers | C-03 pack |
| `SECTION_TITLES[8]` | Biological Triad™ | C-03 pack |
| `SECTION_TITLES[9]` | Future Projection | C-03 pack |
| `SECTION_TITLES[10]` | 90-Day Roadmap | C-03 pack |
| `SECTION_TITLES[11]` | Nutrition Priorities | C-03 pack |
| `SECTION_TITLES[12]` | Action Priorities | C-03 pack |
| `SECTION_TITLES[14]` | Specific Concerns | C-03 pack |
| `SECTION_TITLES[16]` | Participant Answers | C-03 pack |
| `SECTION_TITLES[17]` | Biological Card | C-03 pack |
| `SECTION_TITLES[18]` | Final Word | C-03 pack |
| `TRIAD_KIND_LABELS.driver` | Driver | C-03 pack |
| `TRIAD_KIND_LABELS.protective` | Protective factor | not found |
| `TRIAD_KIND_LABELS.unavailable` | Not available | not found |

### Why each group exists

| Group | Why it was drafted |
|---|---|
| `WHY.*` | Review point 23 requires an explanation beside each major score and the drivers. C-03 v1.0.1 supplies no copy for it. The heading itself, "Why this appeared", is ROOTS' own wording from that point, and is listed in section 2. |
| `CONFIDENCE_COMPOSITE_NOTE` | Review point 3's second requirement: an explanation where the component scores are shown. The review states the requirement but does not give the sentence. |
| `TRIAD_KIND_LABELS.*` (section 4) | Review point 31 and C-05 §13 require the Triad's meaning not to rest on colour alone. These are interface labels for a `kind` the builder already records, and they are too short to classify by search. |
| `TRIAD_DIAGRAM_LABEL` | Names the diagram for assistive technology. Not report content: it states no finding. |
| `PROTECTIVE_LABELS.*` | C-02 defines five protective factors by identifier; C-03 gives no participant-facing names for them. |
| `COPY.executiveSummarySingle`, `COPY.executiveSummaryList`, `COPY.triadTwo`, `COPY.triadOne`, `COPY.triadNone` | C-03 v1.0.1 §4 and §5 require reduced states ("zero to three output entries"; a "two-element/one-element state") but supply copy only for the three-item case. Wording for the driver variants was supplied by ROOTS on 25 September 2026 and is recorded in the decision log. |
| Anything else above | Functional wording for a state C-03 does not cover. |

### What approval of this section would settle

1. Whether each sentence is accepted as written, amended, or withdrawn.
2. Whether accepted sentences are incorporated into C-03 by amendment, so that the next
   release has no vendor copy in a controlled document.
3. Which, if any, must not appear at all, in which case the state they cover needs approved
   copy before that state can be rendered.

---

## The review instructions this answers

Reproduced from the controlled review so the drafted wording can be read against the
instruction it was written to satisfy.

### Review point 3

> Clarify the meaning of Confidence
> 
> Add concise explanatory copy making clear that Confidence is **not diagnostic or clinical certainty**.
> 
> Use:
> 
> **“Confidence reflects data completeness, self-reported answer confidence and internal response consistency—not diagnostic certainty.”**
> 
> Where the component scores are shown, add a short explanation that the composite Confidence score is calculated according to the controlled confidence model and should not be assumed to be a simple arithmetic average, **provided this is consistent with the canonical calculation**.
> 
> Also verify that **68/100 = Moderate-High** is the exact controlled classification.
> 
> Do not use a manually selected confidence label.

### Review point 23

> Improve explainability
> 
> For major scores and drivers, provide concise **“Why this appeared”** explainability where supported by the controlled rules/content.
> 
> The explanation should trace the interpretation to relevant questionnaire patterns without unnecessarily exposing proprietary scoring logic.
> 
> No explanation may imply causality when the underlying system establishes only an association or pattern.

### Review point 31

> Accessibility
> 
> The final report must not communicate meaning through colour alone.
> 
> Ensure appropriate:
> 
> - readable contrast;
> - logical reading order;
> - headings;
> - selectable/accessible text where applicable;
> - textual/numeric equivalents for charts;
> - accessible description of relationship diagrams such as the Biological Triad.


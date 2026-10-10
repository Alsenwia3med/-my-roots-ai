/**
 * C-03 Report Content & Visual Reference Pack v1.0.1 CORRECTED (ROOTS-C03-REPORT-001),
 * transcribed as data. Every participant-facing sentence in the report comes from here; the builder
 * (./build.ts) only selects and fills it.
 *
 * Copy marked PENDING is functional wording C-03 does not supply. It is minimal, neutral,
 * makes no claim, and is listed for ROOTS approval (same convention as lib/assessment/copy.ts).
 */

import type { DomainId } from '../scoring/c02-ruleset';

export const REPORT_DOCUMENT_ID = 'ROOTS-C03-REPORT-001';
/** C-03 v1.0.1 §6: "Report-template version is C-03 v1.0.1." */
export const REPORT_TEMPLATE_VERSION = '1.0.1';
/**
 * No AI narrative layer exists yet, so every governed-narrative section uses its approved
 * deterministic fallback (C-03 §7, acceptance check RPT-07). The version says so.
 */
export const NARRATIVE_TEMPLATE_VERSION = '1.0.0-deterministic-fallback';
/**
 * The fixed medical and AI disclaimer (C-03 §4.19). The v1.0.1 correction states it does not
 * change the disclaimer, so its version stays at 1.0.0 — the copy is what this identifies, not
 * the pack it arrived in.
 */
export const DISCLAIMER_VERSION = '1.0.0';

export const REPORT_TITLE = 'ROOTS Biological Intelligence Report™';
export const EDUCATIONAL_BADGE = 'Educational — Not a Diagnosis';
export const PARTICIPANT_FALLBACK = 'Participant';

/** C-03 §3 — approved labels and meanings. Display order is fixed MR, HS, SR, CH, SL, IB, BS (§4.7). */
export const DOMAIN_DISPLAY_ORDER: readonly DomainId[] = ['MR', 'HS', 'SR', 'CH', 'SL', 'IB', 'BS'];

export const DOMAIN_LABELS: Record<DomainId, string> = {
  MR: 'Metabolic Resistance™',
  HS: 'Hunger & Satiety Signals™',
  SR: 'Sleep Recovery Index™',
  CH: 'Circadian Health Score™',
  SL: 'Stress Load™',
  IB: 'Inflammation Burden Index™',
  BS: 'Biological Safety Signals™',
};

export const DOMAIN_MEANINGS: Record<DomainId, string> = {
  MR: 'Self-reported resistance to expected weight change and activity-related metabolic context.',
  HS: 'Hunger, craving, fullness and post-meal response patterns.',
  SR: 'Sleep duration, continuity and perceived restoration.',
  CH: 'Alignment of light, screen, meal and sleep timing.',
  SL: 'Perceived tension, cognitive activation and stress-linked eating.',
  IB: 'Non-specific symptom burden; not a laboratory or clinical inflammation measure.',
  BS: 'Perceived energy, appetite drive and resistance signals.',
};

/** C-03 §3 — participant-facing explanation of each classification. */
export const CLASSIFICATION_EXPLANATIONS: Record<string, string> = {
  Optimized: 'Few burden signals were reported in this area.',
  Compensating: 'Some signals are present, while current routines may still be helping your system compensate.',
  Strained: 'Several signals may be placing consistent pressure on this area.',
  Dysregulated:
    'A high burden of signals was reported. This is not a diagnosis; consider discussing persistent or concerning symptoms with a qualified professional.',
};

/** C-03 §4 — section titles, in the fixed order 1-19. */
export const SECTION_TITLES: readonly string[] = [
  'Cover Page',
  'Executive Summary',
  'ROOTS Biological State™',
  'ROOTS Opportunity Score™',
  'ROOTS Confidence™',
  'Key Drivers',
  'Seven-Domain Score Breakdown',
  'Biological Triad™',
  'Future Projection',
  '90-Day Roadmap',
  'Nutrition Priorities',
  'Action Priorities',
  'What Is Going Well',
  'Specific Concerns',
  'Suggested Laboratory Discussion',
  'Participant Answers',
  'Biological Card',
  'Final Word',
  'Medical and AI Disclaimer',
];

/** C-03 §4 — approved required / fallback copy, verbatim. {placeholders} are filled by the builder. */
export const COPY = {
  executiveSummary:
    'Your current pattern reflects a combination of reported biological signals. The strongest areas in this assessment are {primary_driver}, {secondary_driver} and {tertiary_driver}. These results are educational and describe your answers; they do not diagnose a condition.',
  biologicalState: 'Your ROOTS Biological State™ is {biological_state}/100 — {domain_classification}.',
  biologicalStateNote: 'This summarizes the available seven-domain questionnaire pattern; it is not a medical risk probability.',
  opportunity: 'Your ROOTS Opportunity Score™ is {opportunity_score}/100.',
  opportunityNote:
    'This proprietary educational indicator reflects the amount of modifiable capacity suggested by the current questionnaire pattern. It is not a forecast or clinical outcome probability.',
  confidence: 'Confidence in this interpretation is {confidence_label} ({confidence_score}/100).',
  drivers: 'Primary: {primary_driver}. Secondary: {secondary_driver}. Tertiary: {tertiary_driver}.',
  noDriver: 'No dominant burden signal was identified in the available answers.',
  domainLine: '{domain_label}: {domain_score}/100 — {domain_classification}.',
  domainNull: 'Not enough information',
  triad: 'Your current triad connects {primary_driver}, {secondary_driver} and {top_protective_factor}.',
  /*
   * C-03 v1.0.1 §4 and §5 supersede the fixed three-item assumption ("zero to three output
   * entries"; "a reduced two-element/one-element state or the approved Not Available state")
   * but supply copy only for the three-item case.
   *
   * Wording supplied by ROOTS on 25 September 2026. The earlier proposal used "strongest
   * area(s)", which was not approved: it can read as the participant's healthiest areas, which
   * is the opposite of what a driver is. These strings remain marked for controlled-copy
   * verification until their applicable C-03 states and content rules have been checked.
   */
  executiveSummarySingle:
    'Your current pattern reflects a combination of reported biological signals. The highest-ranked driver in this assessment is {primary_driver}. These results are educational and describe your answers; they do not diagnose a condition.',
  executiveSummaryList:
    'Your current pattern reflects a combination of reported biological signals. The highest-ranked drivers in this assessment are {driver_list}. These results are educational and describe your answers; they do not diagnose a condition.',
  triadTwo: 'The available information brings together {first} and {second}.',
  triadOne: 'Only {first} is available for this view.',
  triadNone: 'Not enough information is available to display this view.',
  futureProjection:
    'If the current pattern continues, the same signals may remain influential. Small consistent changes may alter the pattern over time.',
  roadmapMonths: ['Month 1 — Stabilize signals.', 'Month 2 — Build flexibility.', 'Month 3 — Reinforce recovery.'],
  nutrition:
    'Focus on meal structure, adequate protein and fibre, hydration, and timing patterns that match your circumstances.',
  actions: 'Start with the smallest action you can repeat consistently.',
  goingWell: 'Your answers also show strengths that may support change.',
  noProtective:
    'No protective factor was confirmed from the available answers; this may reflect missing data rather than absence.',
  concerns:
    'Some reported signals may deserve additional attention, especially if they are persistent, worsening or affecting daily function.',
  laboratory: 'You may wish to discuss whether any tests are appropriate with a qualified healthcare professional.',
  answers: 'Your answers are shown exactly as submitted.',
  biologicalCard:
    'Biological State {biological_state}; Opportunity {opportunity_score}; Recovery Potential {recovery_potential}; Confidence {confidence_label}.',
  finalWord:
    'Your answers are a starting point, not a verdict. Choose one realistic action, observe how you respond, and seek professional support when symptoms are persistent or concerning.',
  disclaimer:
    'ROOTS-AI™ provides educational wellness information based on self-reported answers. It is not a medical device, diagnostic service, clinical assessment, prognosis or substitute for a qualified healthcare professional. It does not provide medical treatment or medication instructions. Scores are proprietary questionnaire indicators and are not validated probabilities of disease or future outcomes. AI may assist with wording, but all scores and classifications are calculated by deterministic rules. If you have severe, sudden or worsening symptoms, or believe you may be in immediate danger, contact local emergency services or a qualified healthcare professional.',
} as const;

/**
 * Final report review point 27 — "Make the disclaimer easier to read without weakening it".
 *
 * The approved C-03 §4.19 disclaimer is presented as four headed groups instead of one dense
 * block. Not a single word is rewritten: the groups are slices of `COPY.disclaimer` itself,
 * and `disclaimerGroups()` throws unless re-joining every slice reproduces the approved text
 * character for character. The disclaimer therefore still appears in full and untruncated
 * (C-03 §4.19), which is why DISCLAIMER_VERSION is unchanged — only the layout differs.
 *
 * Sentence allocation:
 *   1  What this report is
 *   2-4  What this report is not
 *   5  How AI is used
 *   6  When professional or urgent care is appropriate
 */
const DISCLAIMER_GROUP_PLAN: readonly { heading: string; sentences: number }[] = [
  { heading: 'What this report is', sentences: 1 },
  { heading: 'What this report is not', sentences: 3 },
  { heading: 'How AI is used', sentences: 1 },
  { heading: 'When professional or urgent care is appropriate', sentences: 1 },
];

export function disclaimerGroups(): { heading: string; text: string }[] {
  const sentences = COPY.disclaimer.match(/[^.]+\./g) ?? [];
  const expected = DISCLAIMER_GROUP_PLAN.reduce((n, g) => n + g.sentences, 0);
  if (sentences.length !== expected) {
    throw new Error(`disclaimer has ${sentences.length} sentences; the approved grouping covers ${expected}`);
  }

  let at = 0;
  const groups = DISCLAIMER_GROUP_PLAN.map((g) => {
    const text = sentences.slice(at, at + g.sentences).join('').trim();
    at += g.sentences;
    return { heading: g.heading, text };
  });

  // C-03 §4.19: the disclaimer is shown in full and never truncated.
  if (groups.map((g) => g.text).join(' ') !== COPY.disclaimer) {
    throw new Error('the grouped disclaimer does not reproduce the approved text exactly');
  }
  return groups;
}

/** C-03 §4.9 governance: "Never predict disease, lifespan, deterioration or guaranteed improvement." */
/**
 * C-05 §13 — "color is never the sole carrier of meaning" — and final report review point 31,
 * which requires an "accessible description of relationship diagrams such as the Biological
 * Triad". Each element's kind is shown as text beside it in both outputs; the colour and the
 * ring style remain, but they now repeat information rather than carry it alone.
 *
 * These are interface labels for the `kind` the builder already records, not report content:
 * no new finding is stated, and C-03 §4.8's separation of domains from contextual/protective
 * factors is what they make visible.
 */
export const TRIAD_KIND_LABELS: Record<'driver' | 'protective' | 'unavailable', string> = {
  driver: 'Driver',
  protective: 'Protective factor',
  unavailable: 'Not available',
};

/** Names the diagram for assistive technology; the relationship wording stays in TRIAD_NOTE. */
export const TRIAD_DIAGRAM_LABEL = 'Biological Triad — the elements this view brings together';

export const TRIAD_NOTE = 'The diagram shows possible relationships between these areas, not causes.';

/**
 * Supplied by ROOTS in the final report review (point 5), to be added while the deterministic
 * Primary / Secondary / Tertiary ranking stays exactly as it is.
 */
export const DRIVER_NOTE =
  'Drivers identify the highest-ranked eligible questionnaire domains; they do not establish biological causation.';

/**
 * Final report review point 3 — supplied by ROOTS, added verbatim.
 *
 * Verified against C-02 before use:
 *   - the three named inputs are exactly SC-008's three components (overall coverage, the Q72
 *     self-reported answer-confidence value, and mean available-domain consistency);
 *   - the classification label is never chosen by hand. `band(CLASSIFICATIONS.CONFIDENCE, …)`
 *     derives it from the C-02 Classifications table, where 60-79 is Moderate-High, so a score
 *     of 68 classifies as Moderate-High as the review requires.
 */
export const CONFIDENCE_NOTE =
  'Confidence reflects data completeness, self-reported answer confidence and internal response consistency—not diagnostic certainty.';

/**
 * Point 3, second requirement: shown where the component scores are shown.
 *
 * C-02 SC-008 weights the three components 0.50 / 0.30 / 0.20, so the composite is genuinely
 * not an arithmetic average of them. The weights themselves are proprietary and are not shown.
 */
export const CONFIDENCE_COMPOSITE_NOTE =
  'The composite Confidence score is calculated according to the controlled confidence model and should not be assumed to be a simple arithmetic average.';

/**
 * Point 4 — supplied by ROOTS, added verbatim.
 *
 * The review requires this only if it precisely reflects the canonical semantics across the
 * displayed domains. C-02 "Domains" states "Higher scores mean greater self-reported burden"
 * for the sheet as a whole, and all seven domains share one formula (SC-001), so the direction
 * is uniform and there is no conflict to flag.
 */
export const DOMAIN_DIRECTION_NOTE = 'Higher scores indicate greater reported burden within this assessment.';

/**
 * Point 23 explainability — "Why this appeared".
 *
 * Each string states only what the controlled rules already determine, and names no weighting,
 * constant or threshold value. Association only: nothing here says an answer caused a score.
 *
 *   whyBiologicalState  C-02 SC-002 — mean of the available seven domain scores
 *   whyOpportunity      C-02 SC-003 — derived from Biological State alone
 *   whyConfidence       C-02 SC-008 — the three recorded components
 *   whyDrivers          C-02 DRV-001/002/003 — eligibility then rank
 *
 * C-03 v1.0.1 supplies no approved copy for this section, so these strings are review-derived
 * and are recorded in the M3 decision log as pending incorporation into C-03.
 */
export const WHY_HEADING = 'Why this appeared';

export const WHY = {
  biologicalState:
    'This value summarizes the seven-domain scores available in your answers ({available_list}). It is a composite of those domain scores, not a separate measurement.',
  biologicalStateNull:
    'Too few of the seven domains had enough answers for this composite to be produced, so no value is shown.',
  opportunity:
    'This value is derived from your ROOTS Biological State™ score. It uses no answers beyond those already summarized there.',
  opportunityNull: 'This value is derived from your ROOTS Biological State™ score, which is not available for this assessment.',
  confidence:
    'This value comes from three recorded inputs: how much of the questionnaire you answered ({coverage_percent}% of scored questions), the answer confidence you reported yourself ({answer_confidence}/100), and how consistent your responses were within each available domain.',
  drivers:
    'The domains named above were the highest-ranked of the domains that met the eligibility rule in your answers. The domains that met it, in rank order, were: {eligible_list}. Ranking reflects the level of burden reported in those domains; it does not identify a cause.',
  driversNone: 'No eligible driver was ranked from the available assessment data.',
} as const;

/** C-03 §5 — approved micro-action library, one per domain. */
export const MICRO_ACTIONS: Record<DomainId, { action: string; rationale: string; safety: string }> = {
  MR: {
    action: 'Schedule three 10-minute walks after meals this week.',
    rationale: 'Supports routine movement without promising weight loss.',
    safety: 'If exercise is unsafe or painful, obtain professional guidance.',
  },
  HS: {
    action: 'Include a protein source and fibre-rich food in one regular meal daily.',
    rationale: 'May support meal satisfaction.',
    safety: 'Adapt for allergies, kidney disease or clinician-directed diets.',
  },
  SR: {
    action: 'Keep wake time within a one-hour window for seven days.',
    rationale: 'Supports a consistent recovery schedule.',
    safety: 'Persistent snoring/gasping warrants professional assessment.',
  },
  CH: {
    action: 'Seek 10-20 minutes of outdoor morning light when safe.',
    rationale: 'Supports time-of-day cues.',
    safety: 'Avoid direct sun exposure beyond safe local guidance.',
  },
  SL: {
    action: 'Use a two-minute slow-breathing or pause routine once daily.',
    rationale: 'Creates a repeatable recovery cue.',
    safety: 'Not a substitute for mental-health care.',
  },
  IB: {
    action: 'Track one recurring symptom, meal context and timing for seven days.',
    rationale: 'May help identify patterns for discussion.',
    safety: 'Do not use the log to self-diagnose food intolerance.',
  },
  BS: {
    action: 'Choose one action small enough to repeat for two weeks.',
    rationale: 'Builds consistency while respecting perceived resistance.',
    safety: 'Seek care for persistent, severe or unexplained symptoms.',
  },
};

export type LabId = 'GLUCOSE' | 'THYROID' | 'CARDIOMETABOLIC' | 'NON_SPECIFIC' | 'SLEEP';

/**
 * C-03 §6 — laboratory discussion library. Prompts only: never ordered, required or interpreted.
 *
 * The "Mandatory wording" column mixes two kinds of text: sentences addressed to the
 * participant, and instructions addressed to the implementer ("Do not recommend hs-CRP…",
 * "Do not label sleep apnoea…"). The second kind is honoured as a rule — nothing here names a
 * test or a condition beyond the approved prompt — and is not shown to participants.
 */
export const LAB_LIBRARY: Record<LabId, { discussion: string; mandatory: string; mandatoryShown: boolean }> = {
  GLUCOSE: {
    discussion: 'Whether glucose regulation testing, such as fasting glucose or HbA1c, is appropriate',
    mandatory: 'Only a clinician can decide whether testing is appropriate and interpret the result.',
    mandatoryShown: true,
  },
  THYROID: {
    discussion: 'Whether thyroid evaluation is appropriate',
    mandatory: 'Questionnaire answers cannot determine thyroid function.',
    mandatoryShown: true,
  },
  CARDIOMETABOLIC: {
    discussion: 'Whether a lipid profile and blood-pressure review are appropriate',
    mandatory: 'No test is required by ROOTS-AI™.',
    mandatoryShown: true,
  },
  NON_SPECIFIC: {
    discussion: 'Whether targeted clinical evaluation is appropriate before broad testing',
    mandatory: 'Do not recommend hs-CRP or other tests automatically.',
    mandatoryShown: false,
  },
  SLEEP: {
    discussion: 'Whether sleep assessment is appropriate',
    mandatory: 'Do not label sleep apnoea from the questionnaire.',
    mandatoryShown: false,
  },
};

/** PENDING — participant-facing names for the C-02 protective factors (C-03 gives none). */
export const PROTECTIVE_LABELS: Record<'P1' | 'P2' | 'P3' | 'P4' | 'P5', string> = {
  P1: 'Regular physical activity',
  P2: 'Consistent meal timing',
  P3: 'A supportive home food environment',
  P4: 'No current nicotine use',
  P5: 'Readiness to try one small change',
};

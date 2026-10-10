import { DOMAIN_LABELS, DOMAIN_TIE_ORDER, type DomainId } from "@/lib/canonical/source";
import { assessmentModules, allQuestions } from "@/lib/canonicalAssessment";
import { classification, type ScoringResult } from "@/lib/scoring";

export const REPORT_SECTION_TITLES = [
  "Cover Page", "Executive Summary", "ROOTS Biological State\u2122",
  "ROOTS Opportunity Score\u2122", "ROOTS Confidence\u2122", "Key Drivers",
  "Seven-Domain Score Breakdown", "Biological Triad\u2122", "Future Projection",
  "90-Day Roadmap", "Nutrition Priorities", "Action Priorities", "What Is Going Well",
  "Specific Concerns", "Suggested Laboratory Discussion", "Participant Answers",
  "Biological Card", "Final Word", "Medical and AI Disclaimer",
] as const;

export const REPORT_DISCLAIMER = "ROOTS-AI\u2122 provides educational wellness information based on self-reported answers. It is not a medical device, diagnostic service, clinical assessment, prognosis or substitute for a qualified healthcare professional. It does not provide medical treatment or medication instructions. Scores are proprietary questionnaire indicators and are not validated probabilities of disease or future outcomes. AI may assist with wording, but all scores and classifications are calculated by deterministic rules. If you have severe, sudden or worsening symptoms, or believe you may be in immediate danger, contact local emergency services or a qualified healthcare professional.";

/**
 * M3 AI-disclosure sentence, required wherever governed narrative touches a section.
 *
 * Controlling copy (ROOTS point 26):
 *   "AI may assist with governed narrative wording from approved inputs; all authoritative
 *    scores, classifications and drivers are produced by the deterministic engine."
 *
 * Kept in one place so the web report, the PDF and the canonical record cannot drift apart.
 */
export const AI_DISCLOSURE =
  "AI may assist with governed narrative wording from approved inputs; all authoritative scores, classifications and drivers are produced by the deterministic engine.";

export const MICRO_ACTIONS: Record<DomainId, { action: string; rationale: string; safety: string }> = {
  MR: { action: "Schedule three 10-minute walks after meals this week.", rationale: "Supports routine movement without promising weight loss.", safety: "If exercise is unsafe or painful, obtain professional guidance." },
  HS: { action: "Include a protein source and fibre-rich food in one regular meal daily.", rationale: "May support meal satisfaction.", safety: "Adapt for allergies, kidney disease or clinician-directed diets." },
  SR: { action: "Keep wake time within a one-hour window for seven days.", rationale: "Supports a consistent recovery schedule.", safety: "Persistent snoring or gasping warrants professional assessment." },
  CH: { action: "Seek 10-20 minutes of outdoor morning light when safe.", rationale: "Supports time-of-day cues.", safety: "Avoid direct sun exposure beyond safe local guidance." },
  SL: { action: "Use a two-minute slow-breathing or pause routine once daily.", rationale: "Creates a repeatable recovery cue.", safety: "It is not a substitute for mental-health care." },
  IB: { action: "Track one recurring symptom, meal context and timing for seven days.", rationale: "May help identify patterns for discussion.", safety: "Do not use the log to self-diagnose food intolerance." },
  BS: { action: "Choose one action small enough to repeat for two weeks.", rationale: "Builds consistency while respecting perceived resistance.", safety: "Seek care for persistent, severe or unexplained symptoms." },
};

export interface GovernedSection {
  index: number; contentId: string; title: string; narrative: string;
  narrativeSource: "deterministic"; reduced: boolean; reducedReason: string | null;
}

export interface ReportLimitation {
  code: "NULL_DOMAIN" | "MISSING_FACTOR" | "NO_DRIVER" | "MISSING_ANSWER_SNAPSHOT";
  domain?: DomainId; message: string;
}

export function activeProtectiveFactorIds(scoring: ScoringResult): string[] {
  return Object.entries(scoring.factorTrace.protective).filter(([, active]) => active).map(([id]) => id);
}

function scoreText(value: number | null): string {
  return value === null ? "Not enough information" : `${value}/100`;
}

function driverDomains(drivers: string[]): DomainId[] {
  const result: DomainId[] = [];
  for (const driver of drivers) {
    for (const id of driver.replace(" co-primary", "").split("+") as DomainId[]) {
      if (!result.includes(id)) result.push(id);
    }
  }
  return result;
}

function driverOutputText(driver: string): string {
  const ids = driver.replace(" co-primary", "").split("+") as DomainId[];
  const labels = ids.map((id) => DOMAIN_LABELS[id]);
  return driver.includes(" co-primary") ? `${labels.join(" and ")} (co-primary)` : labels.join(" and ");
}

/** Controlled-copy candidate: wording remains open for C-03 verification. */
export function rankedDriverCopy(drivers: string[]): string {
  if (drivers.length === 0) return "No dominant burden signal was identified in the available answers.";
  const entries = drivers.map(driverOutputText);
  return drivers.length === 1
    ? `The highest-ranked driver in this assessment is ${entries[0]}.`
    : `The highest-ranked drivers in this assessment are ${entries.join("; ")}.`;
}

type TriadElement = { text: string; kind: "driver output" | "protective context" };

function triadElementText(element: TriadElement): string {
  return `${element.kind} (${element.text})`;
}

function triadCopy(drivers: string[], protective: string[]): { text: string; reduced: boolean; reason: string | null } {
  // Controlled-copy candidate: C-03 verification remains explicitly open.
  const elements: TriadElement[] = [
    ...drivers.map((driver): TriadElement => ({ text: driverOutputText(driver), kind: "driver output" })),
    ...protective.map((label): TriadElement => ({ text: label, kind: "protective context" })),
  ].slice(0, 3);
  const relationshipNote = "The diagram shows possible relationships, not causes.";
  if (elements.length === 0) return { text: `Not enough information is available to display this view. ${relationshipNote}`, reduced: true, reason: "No verified driver output or protective factor is available." };
  if (elements.length === 1) return { text: `Only ${triadElementText(elements[0])} is available for this view. ${relationshipNote}`, reduced: true, reason: "Only one verified element is available for this view." };
  if (elements.length === 2) return { text: `The available information brings together ${triadElementText(elements[0])} and ${triadElementText(elements[1])}. ${relationshipNote}`, reduced: true, reason: "Two verified elements are available for this view." };
  return { text: `Your current triad connects ${elements.map(triadElementText).join(", ")}. ${relationshipNote}`, reduced: false, reason: null };
}

function protectiveLabels(scoring: ScoringResult): string[] {
  const labels: Record<string, string> = {
    P1: "regular activity context", P2: "meal timing consistency", P3: "supportive home environment",
    P4: "non-nicotine context", P5: "readiness for one small change",
  };
  return activeProtectiveFactorIds(scoring).map((id) => labels[id]);
}

function answerValue(questionId: string, value: unknown): string {
  const question = allQuestions.find((item) => item.id === questionId);
  if (question?.type === "decimal_with_unit" && typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as { value?: number; unit?: string };
      return `${parsed.value ?? ""} ${parsed.unit ?? ""}`.trim();
    } catch { return value; }
  }
  if (Array.isArray(value)) return value.map((item) => question?.options?.find((option) => option.id === item)?.label ?? String(item)).join(", ");
  return question?.options?.find((option) => option.id === value)?.label ?? String(value);
}

export function answerSnapshot(answers: Record<string, unknown> | undefined): string {
  if (!answers || Object.keys(answers).length === 0) return "Answer snapshot not available in this report record.";
  return assessmentModules.map((module) => {
    const rows = module.questions.map((question) => {
        if (question.id === "Q73") return answers[question.id] === undefined ? null : "Q73: optional free text received; not quoted verbatim";
        return answers[question.id] === undefined ? null : `${question.id} (${question.text}): ${answerValue(question.id, answers[question.id])}`;
      }).filter((row): row is string => Boolean(row));
    return rows.length ? `${module.title} \u2014 ${rows.join("; ")}` : null;
  }).filter((row): row is string => Boolean(row)).join(" | ");
}

function consistencyMean(scoring: ScoringResult): number | null {
  const values = DOMAIN_TIE_ORDER.map((id) => scoring.consistency[id]).filter((value): value is number => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}


function sectionCopy(index: number, scoring: ScoringResult, reportId: string, generatedAt: string, answers?: Record<string, unknown>): { text: string; reduced: boolean; reason: string | null } {
  const rankedDrivers = rankedDriverCopy(scoring.drivers);
  const protective = protectiveLabels(scoring);
  const triad = triadCopy(scoring.drivers, protective);
  const meanConsistency = consistencyMean(scoring);
  const actionDomains = driverDomains(scoring.drivers).filter((id) => MICRO_ACTIONS[id]);
  const actionText = actionDomains.slice(0, 3).map((id) => MICRO_ACTIONS[id].action).join(" ");
  switch (index) {
    case 1:
      return { text: `ROOTS Biological Intelligence Report\u2122 \u00b7 Participant \u00b7 Report ${reportId} \u00b7 ${generatedAt} \u00b7 Educational \u2014 Not a Diagnosis`, reduced: false, reason: null };
    case 2:
      return { text: `Your current pattern reflects a combination of reported biological signals. ${rankedDrivers} These results are educational and describe your answers; they do not diagnose a condition. Confidence is ${scoring.confidenceLabel.toLowerCase()} at ${scoring.confidence}/100.`, reduced: false, reason: null };
    case 3:
      return { text: scoring.biologicalState === null ? "Your ROOTS Biological State\u2122 is Not Available. Not enough information was available to calculate this roll-up. No missing answer was replaced or guessed." : `Your ROOTS Biological State\u2122 is ${scoring.biologicalState}/100 \u2014 ${scoring.biologicalStateClassification}. This summarizes the available seven-domain questionnaire pattern; it is not a medical risk probability.`, reduced: scoring.biologicalState === null, reason: scoring.biologicalState === null ? "Fewer than five domains reached the coverage threshold." : null };
    case 4:
      return { text: scoring.opportunity === null ? "Your ROOTS Opportunity Score\u2122 is Not Available because the Biological State is Not Available." : `Your ROOTS Opportunity Score\u2122 is ${scoring.opportunity.toFixed(1)}/100. This proprietary educational indicator reflects modifiable capacity suggested by the current questionnaire pattern. It is not a forecast or clinical outcome probability.`, reduced: scoring.opportunity === null, reason: scoring.opportunity === null ? "Biological State is Not Available." : null };
    case 5:
      return { text: `Confidence in this interpretation is ${scoring.confidenceLabel} (${scoring.confidence}/100). Overall scored-item coverage is ${scoring.overallCoverage}%; mean available-domain consistency is ${meanConsistency === null ? "Not Available" : `${Math.round(meanConsistency)}%`}. Missing or null domains remain visible.`, reduced: false, reason: null };
    case 6:
      return { text: rankedDrivers, reduced: scoring.drivers.length === 0, reason: scoring.drivers.length === 0 ? "No available domain met the deterministic driver threshold." : null };
    case 7:
      return { text: DOMAIN_TIE_ORDER.map((id) => `${DOMAIN_LABELS[id]}: ${scoreText(scoring.domains[id])} \u2014 ${classification(scoring.domains[id]) ?? "Not Available"}`).join(" \u00b7 "), reduced: DOMAIN_TIE_ORDER.some((id) => scoring.domains[id] === null), reason: "One or more domains are Not Available because coverage was below 50%." };
    case 8:
      return triad;
    case 9:
      return { text: "If the current pattern continues, the same signals may remain influential. Small consistent changes may alter the pattern over time. This is not a prognosis.", reduced: false, reason: null };
    case 10:
      return { text: actionDomains.length === 0 ? "Not Available: no eligible micro-action could be selected from the available driver output." : `Month 1 \u2014 Stabilize signals. Month 2 \u2014 Build flexibility. Month 3 \u2014 Reinforce recovery. ${actionText}`, reduced: actionDomains.length === 0, reason: actionDomains.length === 0 ? "No eligible driver output is available." : null };
    case 11:
      return { text: "Focus on meal structure, adequate protein and fibre, hydration, and timing patterns that match your circumstances. No calorie prescription, supplement dosage or therapeutic diet is provided.", reduced: false, reason: null };
    case 12:
      return { text: actionDomains.length === 0 ? "Not Available: no eligible action could be selected from the available driver output." : actionDomains.slice(0, 3).map((id) => `${MICRO_ACTIONS[id].action} ${MICRO_ACTIONS[id].rationale} Safety: ${MICRO_ACTIONS[id].safety}`).join(" "), reduced: actionDomains.length === 0, reason: actionDomains.length === 0 ? "No eligible driver output is available." : null };
    case 13:
      return { text: protective.length === 0 ? "No protective factor was confirmed from the available answers; this may reflect missing data rather than absence." : `Your answers also show strengths that may support change: ${protective.join(", ")}.`, reduced: protective.length === 0, reason: protective.length === 0 ? "No protective factor is confirmed." : null };
    case 14:
      return { text: "Some reported signals may deserve additional attention, especially if they are persistent, worsening or affecting daily function. Discuss persistent or concerning symptoms with a qualified professional.", reduced: false, reason: null };
    case 15:
      return { text: "You may wish to discuss whether any tests are appropriate with a qualified healthcare professional. Tests are optional discussion prompts only; ROOTS-AI\u2122 does not order or interpret tests.", reduced: false, reason: null };
    case 16:
      return { text: `Your answers are shown exactly as submitted. ${answerSnapshot(answers)}`, reduced: !answers || Object.keys(answers).length === 0, reason: !answers || Object.keys(answers).length === 0 ? "Answer snapshot is not available in this report record." : null };
    case 17:
      return { text: `Biological State ${scoring.biologicalState ?? "Not Available"}; Opportunity ${scoring.opportunity === null ? "Not Available" : scoring.opportunity.toFixed(1)}; Recovery Potential ${scoring.recoveryPotential === null ? "Not Available" : scoring.recoveryPotential.toFixed(1)}; Confidence ${scoring.confidenceLabel} (${scoring.confidence}/100).`, reduced: scoring.biologicalState === null, reason: scoring.biologicalState === null ? "Biological State is Not Available." : null };
    case 18:
      return { text: "Your answers are a starting point, not a verdict. Choose one realistic action, observe how you respond, and seek professional support when symptoms are persistent or concerning.", reduced: false, reason: null };
    case 19:
      return { text: REPORT_DISCLAIMER, reduced: false, reason: null };

    default:
      return { text: "Not Available.", reduced: true, reason: "Governed content is not available." };
  }
}



export function buildGovernedSections(scoring: ScoringResult, reportId: string, generatedAt: string, answers?: Record<string, unknown>): GovernedSection[] {
  return REPORT_SECTION_TITLES.map((title, offset) => {
    const index = offset + 1;
    const copy = sectionCopy(index, scoring, reportId, generatedAt, answers);
    return {
      index,
      contentId: `C03.SECTION.${String(index).padStart(2, "0")}`,
      title,
      narrative: copy.text,
      narrativeSource: "deterministic",
      reduced: copy.reduced,
      reducedReason: copy.reason,
    };
  });
}

export function buildReportLimitations(scoring: ScoringResult, hasAnswers: boolean): ReportLimitation[] {
  const limitations: ReportLimitation[] = [];
  for (const id of DOMAIN_TIE_ORDER) {
    if (scoring.domains[id] === null) {
      limitations.push({ code: "NULL_DOMAIN", domain: id, message: "Not enough information was available to calculate this domain. No missing answer was replaced or guessed." });
    }
  }
  for (const factor of scoring.factorTrace.limitations) {
    limitations.push({ code: "MISSING_FACTOR", message: `${factor} factor is unavailable; Recovery Potential may be limited.` });
  }
  if (scoring.drivers.length === 0) {
    limitations.push({ code: "NO_DRIVER", message: "No dominant burden signal was identified in the available answers." });
  }
  if (!hasAnswers) {
    limitations.push({ code: "MISSING_ANSWER_SNAPSHOT", message: "The canonical answer snapshot is not available in this report record." });
  }
  return limitations;
}


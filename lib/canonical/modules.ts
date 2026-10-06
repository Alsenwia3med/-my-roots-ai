/**
 * ROOTS-AI(TM) Phase 1 MVP - Canonical assessment modules.
 *
 * Controlled source: C-01 Canonical Question Bank v1.0.1 CORRECTED
 * ("13 Ordered Assessment Modules"). Module identifiers, order, titles and
 * question ranges are immutable.
 *
 * `title` reproduces C-01 `module_title` verbatim (the controlled value).
 * `participantLabel` records the C-05 v1.0.1 section 8 participant-facing
 * label where it differs from C-01; it never overrides canonical identity.
 */

export interface AssessmentModule {
  /** Canonical module_id (M01-M13). */
  id: string;
  /** Canonical module_order, 1-13. */
  order: number;
  /** Canonical C-01 module_title. */
  title: string;
  /** Canonical C-01 purpose. */
  purpose: string;
  /** C-05 v1.0.1 participant label where it differs, otherwise equal to title. */
  participantLabel: string;
  /** Canonical first question_order in the module. */
  firstQuestionOrder: number;
  /** Canonical last question_order in the module. */
  lastQuestionOrder: number;
}

export const assessmentModules: AssessmentModule[] = [
  { id: "M01", order: 1, title: "Body Foundations", purpose: "Profile and physical measurements", participantLabel: "Body Foundations", firstQuestionOrder: 1, lastQuestionOrder: 8 },
  { id: "M02", order: 2, title: "Weight & Metabolic History", purpose: "Weight trajectory and metabolic context", participantLabel: "Weight & Metabolic History", firstQuestionOrder: 9, lastQuestionOrder: 15 },
  { id: "M03", order: 3, title: "Sleep Recovery Index", purpose: "Sleep duration, continuity and restoration", participantLabel: "Sleep Recovery Index", firstQuestionOrder: 16, lastQuestionOrder: 22 },
  { id: "M04", order: 4, title: "Hunger & Satiety Signals", purpose: "Hunger, fullness, cravings and meal response", participantLabel: "Hunger & Satiety Signals", firstQuestionOrder: 23, lastQuestionOrder: 30 },
  { id: "M05", order: 5, title: "Stress Load & Inflammation Signals", purpose: "Stress activation and self-reported symptom burden", participantLabel: "Stress Load & Inflammation Signals", firstQuestionOrder: 31, lastQuestionOrder: 40 },
  { id: "M06", order: 6, title: "Circadian Health", purpose: "Light, screen, meal and sleep timing", participantLabel: "Circadian Health Score", firstQuestionOrder: 41, lastQuestionOrder: 45 },
  { id: "M07", order: 7, title: "Physical Activity Mapping", purpose: "Frequency, duration and activity pattern", participantLabel: "Activity Context", firstQuestionOrder: 46, lastQuestionOrder: 48 },
  { id: "M08", order: 8, title: "Biological Safety Signals", purpose: "Perceived resistance, appetite control and energy", participantLabel: "Biological Safety Signals", firstQuestionOrder: 49, lastQuestionOrder: 51 },
  { id: "M09", order: 9, title: "Root Cause Discovery", purpose: "Participant-perceived drivers and caffeine context", participantLabel: "Root Cause Discovery", firstQuestionOrder: 52, lastQuestionOrder: 55 },
  { id: "M10", order: 10, title: "Hormonal & Reproductive Context", purpose: "Optional hormonal and reproductive context", participantLabel: "Hormonal/Reproductive Context", firstQuestionOrder: 56, lastQuestionOrder: 60 },
  { id: "M11", order: 11, title: "Lifestyle & Environment", purpose: "Tobacco, alcohol, eating environment and support", participantLabel: "Lifestyle & Environment", firstQuestionOrder: 61, lastQuestionOrder: 66 },
  { id: "M12", order: 12, title: "Goals & Readiness", purpose: "Goals, priorities and readiness for change", participantLabel: "Goals & Readiness", firstQuestionOrder: 67, lastQuestionOrder: 71 },
  { id: "M13", order: 13, title: "Confidence & Additional Context", purpose: "Response confidence and optional participant context", participantLabel: "Confidence & Context", firstQuestionOrder: 72, lastQuestionOrder: 73 },
];

export function getModule(moduleId: string): AssessmentModule | undefined {
  return assessmentModules.find((module) => module.id === moduleId);
}

export function moduleForQuestionOrder(questionOrder: number): AssessmentModule | undefined {
  return assessmentModules.find(
    (module) => questionOrder >= module.firstQuestionOrder && questionOrder <= module.lastQuestionOrder,
  );
}

export const moduleCount = assessmentModules.length;

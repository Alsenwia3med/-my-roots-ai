import { CANONICAL_VERSIONS } from "@/lib/canonical/source";
import { optionSets } from "@/lib/canonical/optionSets";

export type QuestionType = "integer" | "decimal" | "decimal_with_unit" | "single_select" | "multi_select" | "likert" | "integer_scale" | "free_text";

export interface AssessmentOption { id: string; label: string; points?: number; isNa?: boolean; exclusive?: boolean; }
export interface CanonicalQuestion { id: string; text: string; type: QuestionType; required: boolean; allowNa: boolean; scoringEligible: boolean; domain?: string; reverseScored?: boolean; helpText?: string; options?: AssessmentOption[]; optionSetId?: string; min?: number; max?: number; }
export interface AssessmentModule { id: string; order: number; title: string; purpose: string; firstQuestionOrder: number; lastQuestionOrder: number; questions: CanonicalQuestion[]; }

/**
 * Option sets are sourced from lib/canonical/optionSets.ts, which reproduces the
 * C-01 v1.0.1 approved option sets verbatim (option ids, labels, order and C-02
 * burden points). The engine keys off option id and reads points from here -
 * there is no scoring table hardcoded in the scoring engine.
 */
const freq = optionSets.FREQ.options;
const yesNo = optionSets.YES_NO_UNSURE.options;
const set = (optionSetId: string): AssessmentOption[] => optionSets[optionSetId].options;

/**
 * Canonical option_set_id for a question. C-01 records the option_set_id on
 * every option-backed question; the descriptor is derived here by matching the
 * option array by identity so the two can never drift.
 */
function optionSetIdFor(options?: AssessmentOption[]): string | undefined {
  if (!options) return undefined;
  return Object.keys(optionSets).find((id) => optionSets[id].options === options);
}

/**
 * Canonical min/max parsed from the C-01 `validation` string. Numeric and
 * numeric-with-unit questions are range-validated; option-backed questions
 * carry the canonical 0-4 burden range.
 */
function boundsFor(optionSetId: string | undefined, explicit: { min?: number; max?: number }): { min?: number; max?: number } {
  if (optionSetId === "FREQ") return { min: 0, max: 4 };
  return explicit;
}

const q = (id: number, text: string, type: QuestionType = "likert", options?: AssessmentOption[], extra: Partial<CanonicalQuestion> = {}): CanonicalQuestion => {
  // `likert` questions use the shared FREQ set; every other option-backed
  // question carries the set supplied by the caller.
  const effectiveOptions = type === "likert" ? freq : options;
  const optionSetId = optionSetIdFor(effectiveOptions);
  const { min, max, ...rest } = extra;
  return {
    id: `Q${id}`,
    text,
    type,
    required: true,
    allowNa: type !== "integer" && type !== "decimal" && type !== "decimal_with_unit",
    scoringEligible: false,
    options: effectiveOptions,
    optionSetId,
    ...boundsFor(optionSetId, { min, max }),
    ...rest,
  };
};
const scored = (question: CanonicalQuestion, domain: string, reverseScored = false): CanonicalQuestion => ({ ...question, domain, scoringEligible: true, reverseScored });

const moduleData: Array<[string, string, string, number, number]> = [
  ["M01", "Body Foundations", "Profile and physical measurements", 1, 8],
  ["M02", "Weight & Metabolic History", "Weight trajectory and metabolic context", 9, 15],
  ["M03", "Sleep Recovery Index", "Sleep duration, continuity and restoration", 16, 22],
  ["M04", "Hunger & Satiety Signals", "Hunger, fullness, cravings and meal response", 23, 30],
  ["M05", "Stress Load & Inflammation Signals", "Stress activation and self-reported symptom burden", 31, 40],
  ["M06", "Circadian Health", "Light, screen, meal and sleep timing", 41, 45],
  ["M07", "Physical Activity Mapping", "Frequency, duration and activity pattern", 46, 48],
  ["M08", "Biological Safety Signals", "Perceived resistance, appetite control and energy", 49, 51],
  ["M09", "Root Cause Discovery", "Participant-perceived drivers and caffeine context", 52, 55],
  ["M10", "Hormonal & Reproductive Context", "Optional hormonal and reproductive context", 56, 60],
  ["M11", "Lifestyle & Environment", "Tobacco, alcohol, eating environment and support", 61, 66],
  ["M12", "Goals & Readiness", "Goals, priorities and readiness for change", 67, 71],
  ["M13", "Confidence & Additional Context", "Response confidence and optional participant context", 72, 73],
];

const questions: CanonicalQuestion[] = [
  q(1, "What is your age?", "integer", undefined, { allowNa: false, min: 16, max: 110, helpText: "Enter your age in completed years." }),
  q(2, "What sex were you assigned at birth?", "single_select", set("SEX"), { allowNa: false, helpText: "Used for context only; it does not change scores." }),
  q(3, "What is your height?", "decimal", undefined, { allowNa: false, min: 100, max: 250, helpText: "Enter height in centimetres." }),
  q(4, "What is your current weight?", "decimal", undefined, { allowNa: false, min: 25, max: 350, helpText: "Enter weight in kilograms." }),
  q(5, "What is your target weight, if you have one?", "decimal", undefined, { required: false, allowNa: true, min: 25, max: 350, helpText: "Optional; this does not affect scoring." }),
  q(6, "What is your waist circumference?", "decimal_with_unit", set("WAIST_UNIT"), { allowNa: false, min: 40, max: 200, helpText: "Measure around the midpoint between the lowest rib and top of the hip bone." }),
  q(7, "How long have you been near your current weight?", "single_select", set("WEIGHT_DURATION")),
  q(8, "How would you describe your weight pattern over the last five years?", "single_select", set("WEIGHT_PATTERN")),
  scored(q(9, "How did the weight change that concerns you begin?", "single_select", set("GAIN_PATTERN")), "MR"),
  scored(q(10, "How often have well-planned diet or activity efforts produced less change than you expected?"), "MR"),
  scored(q(11, "After an intentional weight loss, how often has some or all of the weight returned?"), "MR"),
  scored(q(12, "How many meaningful cycles of weight loss and regain have you experienced?", "single_select", set("WEIGHT_CYCLES")), "MR"),
  q(13, "Have you been told by a clinician that you have any of the following?", "multi_select", set("CONDITIONS")),
  q(14, "Are you currently using medicines that may relate to metabolism, appetite, weight or hormones?", "multi_select", set("MEDICATION_CONTEXT")),
  q(15, "Does a first-degree relative have a history of type 2 diabetes or substantial weight-related metabolic difficulty?", "single_select", yesNo),
  scored(q(16, "How many hours of sleep do you typically get in a 24-hour period?", "single_select", set("SLEEP_HOURS")), "SR"),
  ...[17, 18, 19, 20, 21, 22].map((id) => scored(q(id, ({17:"How often do you feel tired even after what seemed like enough time in bed?",18:"How often do you wake during the night and struggle to return to sleep?",19:"How often is your bedtime after midnight?",20:"How often do you remain awake until 2:00 AM or later because you cannot settle to sleep?",21:"How often do you snore loudly, wake gasping, or receive feedback that your breathing pauses during sleep?",22:"How often do you experience a marked afternoon energy crash?"} as Record<number,string>)[id]), "SR")),
  ...[23,24,25,26,27,28,29,30].map((id) => scored(q(id, ({23:"How often do you feel physically hungry within two hours after a full meal?",24:"How often do you experience food cravings when you are not physically hungry?",25:"How often do you eat enough but still fail to feel comfortably full?",26:"How often do you feel comfortably full after a normal meal?",27:"How often are you hungry again three to four hours after a protein-rich meal?",28:"How often does a protein-rich meal keep you satisfied for four hours or longer?",29:"How often do you feel sleepy, foggy or low in energy after a main meal?",30:"When you start eating sweets or snack foods, how often is it difficult to stop at the amount you intended?"} as Record<number,string>)[id]), "HS", id === 26 || id === 28)),
  ...[31,32,33,34].map((id) => scored(q(id, ({31:"How often do you feel persistent physical tension or stress?",32:"How often does stress increase your desire to eat?",33:"How often does your mind race when you are trying to sleep?",34:"How often are cravings noticeably stronger in the evening?"} as Record<number,string>)[id]), "SL")),
  ...[35,36,37,38,39,40].map((id) => scored(q(id, ({35:"How often do you experience bloating, gas or digestive discomfort?",36:"How often do you experience brain fog after meals?",37:"How often do you experience unexplained joint pain or stiffness?",38:"How often does fat around your waist seem resistant to your usual efforts?",39:"How often do you experience unusual thirst or a dry mouth?",40:"How often have reducing calories and increasing activity produced little sustained change?"} as Record<number,string>)[id]), "IB")),
  ...[41,42,43,44,45].map((id) => scored(q(id, ({41:"How often do you spend the first hour after waking indoors without natural daylight exposure?",42:"How often do you use a phone, tablet or computer during the final hour before sleep?",43:"How often do you eat within three hours of bedtime?",44:"How often does your sleep schedule vary by more than two hours across the week?",45:"How often do you feel more alert late at night than during the morning?"} as Record<number,string>)[id]), "CH")),
  scored(q(46, "On how many days per week do you complete intentional physical activity?", "single_select", set("ACTIVITY_DAYS")), "MR"),
  scored(q(47, "On active days, what is the usual duration of your intentional activity?", "single_select", set("ACTIVITY_DURATION")), "MR"),
  scored(q(48, "Which option best describes your usual physical activity pattern?", "single_select", set("ACTIVITY_TYPE")), "MR"),
  ...[49,50,51].map((id) => scored(q(id, ({49:"How often does your body seem to resist weight loss despite consistent effort?",50:"How often does hunger feel stronger than your ability to regulate it?",51:"How often are your energy levels lower than you believe they should be?"} as Record<number,string>)[id]), "BS")),
  q(52, "When stressed, what responses are most typical for you?", "multi_select", set("STRESS_RESPONSE")),
  q(53, "What do you believe most often contributes to your hunger or cravings?", "multi_select", set("HUNGER_CAUSE")),
  q(54, "What do you believe most often contributes to low energy?", "multi_select", set("ENERGY_CAUSE")),
  q(55, "How many caffeinated drinks do you usually consume per day?", "single_select", set("CAFFEINE")),
  q(56, "Which hormonal or reproductive stage best describes your current situation?", "single_select", set("HORMONAL_STAGE")),
  q(57, "How often have hormonal or reproductive changes affected sleep, appetite, energy or weight?"), q(58, "Are you currently using hormonal medication, contraception or hormone therapy?", "single_select", yesNo), q(59, "How often do appetite or weight patterns change alongside hormonal or reproductive symptoms?"), q(60, "Have you been told by a clinician that you have a thyroid, reproductive or other hormonal concern?", "single_select", yesNo),
  q(61, "How often do you smoke, vape or use nicotine?", "single_select", set("TOBACCO")), q(62, "How often do you consume alcohol?", "single_select", set("ALCOHOL")), q(63, "Which description best matches your usual eating pattern?", "single_select", set("EATING_PATTERN")), q(64, "How often are your meals reasonably consistent in timing from day to day?"), q(65, "How supportive is your home food environment of the choices you want to make?", "single_select", set("SUPPORT_LEVEL")), q(66, "How much practical or emotional support do you have for making health-related changes?", "single_select", set("SUPPORT_LEVEL")),
  q(67, "What is your primary goal for completing this assessment?", "single_select", set("PRIMARY_GOAL"), { allowNa: false }), q(68, "Which area would you most like to understand first?", "single_select", set("PRIORITY_AREA"), { allowNa: false }), q(69, "How ready do you feel to try one small, realistic change during the next two weeks?", "integer_scale", undefined, { allowNa: false, min: 0, max: 10 }), q(70, "How confident are you that you can maintain one small change for two weeks?", "integer_scale", undefined, { allowNa: false, min: 0, max: 10 }), q(71, "What pace of change feels most realistic for you?", "single_select", set("CHANGE_PACE"), { allowNa: false }), q(72, "How confident are you that your answers reflect your usual experience during the last four weeks?", "single_select", set("ANSWER_CONFIDENCE"), { allowNa: false }), q(73, "Is there anything else you would like the report to acknowledge?", "free_text", undefined, { required: false, allowNa: false, min: 0, max: 1000, helpText: "Optional. Do not enter urgent or emergency information here." }),
];

export const assessmentModules: AssessmentModule[] = moduleData.map(([id, title, purpose, start, end], index) => ({ id, order: index + 1, title, purpose, firstQuestionOrder: start, lastQuestionOrder: end, questions: questions.filter((item) => { const number = Number(item.id.slice(1)); return number >= start && number <= end; }) }));
export const allQuestions = questions;
export const questionCount = 73;
export const moduleCount = 13;

// Canonical versions are declared once in lib/canonical/source.ts.
export { CANONICAL_VERSIONS };

// Required multi-select questions that need at least one selection
export const REQUIRED_MULTI_SELECT_QUESTIONS = ["Q13", "Q14", "Q52", "Q53", "Q54"];

export interface ValidationError {
  questionId: string;
  message: string;
}

/**
 * Canonical validation (C-01 v1.0.1 CORRECTED).
 *
 * Rules:
 *  - A required question is complete only when it contains a valid response
 *    defined by its response type, or an explicit approved N/A option where
 *    C-01 permits N/A. Missing data is NEVER automatically interpreted as N/A.
 *  - Optional questions may remain unanswered.
 *  - Required multi-select questions need at least one approved option; an
 *    empty array is invalid.
 *  - A NONE / N/A option (marked `exclusive`) is mutually exclusive with any
 *    other selection.
 *  - Q73 is optional free text and does not permit an invented N/A response.
 *  - Unknown option ids are rejected (they cannot bypass the canonical controls).
 */
export function validateAnswers(answers: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const question of allQuestions) {
    const raw = answers[question.id];
    const isMulti = question.type === "multi_select";

    // Detect presence without treating missing as N/A.
    const hasArray = Array.isArray(raw);
    const array = hasArray ? (raw as unknown[]) : [];
    const scalar = hasArray ? undefined : raw;

    const isBlankScalar =
      scalar === undefined || scalar === null || scalar === "" ||
      (typeof scalar === "string" && scalar.trim() === "");
    const hasScalar = !isBlankScalar;
    const hasSelection = isMulti ? array.length > 0 : hasScalar;

    // Q73: optional free text, invented N/A not permitted.
    if (question.id === "Q73") {
      if (typeof scalar === "string" && /^(n\/?a\.?|na)$/i.test(scalar.trim())) {
        errors.push({
          questionId: question.id,
          message: `Q73 is optional free text and does not permit an N/A response.`,
        });
      }
      continue;
    }

    // Optional questions may remain unanswered.
    if (!question.required) continue;

    // Required multi-select: an empty array is explicitly invalid (C-01).
    if (isMulti && hasArray && array.length === 0) {
      errors.push({
        questionId: question.id,
        message: `Required multi-select question ${question.id} must have at least one approved option selected.`,
      });
      continue;
    }

    // Required questions.
    if (!hasSelection) {
      errors.push({
        questionId: question.id,
        message: question.allowNa
          ? `Required question ${question.id} must have a valid response or an approved N/A option.`
          : `Required question ${question.id} must have a valid response.`,
      });
      continue;
    }

    // decimal_with_unit: a JSON {value, unit} response; the unit must be an
    // approved C-01 unit option and the value must be in range.
    if (question.type === "decimal_with_unit") {
      let parsed: { value?: unknown; unit?: unknown } | null = null;
      try {
        parsed = typeof scalar === "string" ? JSON.parse(scalar) : null;
      } catch {
        parsed = null;
      }
      const unitIds = new Set((question.options ?? []).map((option) => option.id));
      if (!parsed || typeof parsed.unit !== "string" || !unitIds.has(parsed.unit)) {
        errors.push({ questionId: question.id, message: `Question ${question.id} must include an approved unit.` });
        continue;
      }
      const numeric = Number(parsed.value);
      if (!Number.isFinite(numeric)) {
        errors.push({ questionId: question.id, message: `Required question ${question.id} must be a number.` });
        continue;
      }
      if (question.min !== undefined && numeric < question.min) {
        errors.push({ questionId: question.id, message: `Question ${question.id} is below the minimum allowed value.` });
        continue;
      }
      if (question.max !== undefined && numeric > question.max) {
        errors.push({ questionId: question.id, message: `Question ${question.id} is above the maximum allowed value.` });
        continue;
      }
      continue;
    }

    // Numeric response types are validated by range, not by option id.
    if (["integer", "decimal", "integer_scale"].includes(question.type)) {
      const numeric = typeof scalar === "number" ? scalar : Number(scalar);
      if (!Number.isFinite(numeric)) {
        errors.push({ questionId: question.id, message: `Required question ${question.id} must be a number.` });
        continue;
      }
      if (question.min !== undefined && numeric < question.min) {
        errors.push({ questionId: question.id, message: `Question ${question.id} is below the minimum allowed value.` });
        continue;
      }
      if (question.max !== undefined && numeric > question.max) {
        errors.push({ questionId: question.id, message: `Question ${question.id} is above the maximum allowed value.` });
        continue;
      }
      continue;
    }

    const options = question.options ?? [];
    const validIds = new Set(options.map((option) => option.id));
    const naIds = new Set(options.filter((option) => option.isNa).map((option) => option.id));
    const exclusiveIds = new Set(options.filter((option) => option.exclusive || option.isNa).map((option) => option.id));

    // Required multi-select: at least one approved option (empty array invalid).
    if (isMulti) {
      if (array.length === 0) {
        errors.push({
          questionId: question.id,
          message: `Required multi-select question ${question.id} must have at least one approved option selected.`,
        });
        continue;
      }

      const unknown = array.filter((value) => typeof value !== "string" || !validIds.has(value));
      if (unknown.length > 0) {
        errors.push({
          questionId: question.id,
          message: `Question ${question.id} contains options that are not approved by C-01.`,
        });
      }

      // N/A must actually be permitted by C-01 for this question.
      const picksNa = array.some((value) => typeof value === "string" && naIds.has(value));
      if (picksNa && naIds.size === 0) {
        errors.push({
          questionId: question.id,
          message: `Question ${question.id} does not permit an N/A response.`,
        });
      }

      // NONE / N/A mutually exclusive with other selections.
      const exclusivePicked = array.filter((value) => typeof value === "string" && exclusiveIds.has(value));
      if (exclusivePicked.length > 0 && array.length > 1) {
        errors.push({
          questionId: question.id,
          message: `Question ${question.id}: a NONE / N/A option must be mutually exclusive with other selections.`,
        });
      }
      continue;
    }

    // Single-value questions: verify against the canonical option set.
    if (options.length > 0) {
      const value = String(scalar);
      if (!validIds.has(value)) {
        errors.push({
          questionId: question.id,
          message: `Question ${question.id} must use an approved C-01 option.`,
        });
      } else if (naIds.has(value) && !question.allowNa) {
        errors.push({
          questionId: question.id,
          message: `Question ${question.id} does not permit an N/A response.`,
        });
      }
    }
  }
  
  return errors;
}
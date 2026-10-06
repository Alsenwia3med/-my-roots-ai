/**
 * ROOTS-AI(TM) Phase 1 MVP - Canonical option sets.
 *
 * Controlled source: C-01 Canonical Question Bank v1.0.1 CORRECTED
 * ("Approved Option Sets"). Option identifiers, labels and ordering are
 * reproduced verbatim. All logic MUST key off option_id, never the label.
 *
 * `points` carries the C-02 v1.0.1 burden points (0 = lowest burden,
 * 4 = highest burden) where the option participates in deterministic
 * scoring. Contextual-only sets, and sets used solely by protective-factor
 * logic, intentionally carry no `points`.
 */

export interface AssessmentOption {
  /** Canonical option_id from C-01 v1.0.1. */
  id: string;
  /** Exact participant-facing label from C-01 v1.0.1. */
  label: string;
  /** C-02 v1.0.1 burden points (0-4) where the option is scored. */
  points?: number;
  /** Excluded from numerator and denominator. Never treated as zero. */
  isNa?: boolean;
  /** NONE/NA option that must not be combined with other options. */
  exclusive?: boolean;
}

export interface CanonicalOptionSet {
  /** Canonical option_set_id from C-01 v1.0.1. */
  id: string;
  options: AssessmentOption[];
}

const na = (): AssessmentOption => ({ id: "NA", label: "Not applicable", isNa: true, exclusive: true });
const exclusive = (option: AssessmentOption): AssessmentOption => ({ ...option, exclusive: true });

/** FREQ - shared five-point frequency scale (C-01 rows using option_set_id FREQ). */
const FREQ: AssessmentOption[] = [
  { id: "NVR", label: "Never", points: 0 },
  { id: "RLY", label: "Rarely", points: 1 },
  { id: "SMT", label: "Sometimes", points: 2 },
  { id: "OFT", label: "Often", points: 3 },
  { id: "ALW", label: "Almost always", points: 4 },
  na(),
];

const YES_NO_UNSURE: AssessmentOption[] = [
  { id: "NO", label: "No", points: 0 },
  { id: "YES", label: "Yes", points: 4 },
  { id: "UNSURE", label: "Not sure" },
  na(),
];

const SEX: AssessmentOption[] = [
  { id: "FEMALE", label: "Female" },
  { id: "MALE", label: "Male" },
  { id: "INTERSEX", label: "Intersex" },
  { id: "PREFER_NOT", label: "Prefer not to say" },
];

const WAIST_UNIT: AssessmentOption[] = [
  { id: "CM", label: "Centimetres" },
  { id: "IN", label: "Inches" },
];

const WEIGHT_DURATION: AssessmentOption[] = [
  { id: "LT6M", label: "Less than 6 months" },
  { id: "6_12M", label: "6-12 months" },
  { id: "1_3Y", label: "1-3 years" },
  { id: "3_5Y", label: "3-5 years" },
  { id: "GT5Y", label: "More than 5 years" },
  na(),
];

const WEIGHT_PATTERN: AssessmentOption[] = [
  { id: "STABLE", label: "Mostly stable" },
  { id: "GRADUAL", label: "Gradual increase" },
  { id: "CYCLING", label: "Repeated loss and regain" },
  { id: "RECENT", label: "Recent marked change" },
  { id: "OTHER", label: "Other or unsure" },
  na(),
];

const GAIN_PATTERN: AssessmentOption[] = [
  { id: "STABLE", label: "No concerning change or mostly stable", points: 0 },
  { id: "IDENTIFIABLE", label: "After an identifiable life period or event", points: 1 },
  { id: "GRADUAL", label: "Gradually with no single clear reason", points: 2 },
  { id: "CYCLING", label: "In repeated cycles of loss and regain", points: 3 },
  { id: "RAPID", label: "Rapidly or unexpectedly", points: 4 },
  na(),
];

const WEIGHT_CYCLES: AssessmentOption[] = [
  { id: "NONE", label: "None", points: 0 },
  { id: "ONE", label: "One", points: 1 },
  { id: "TWO", label: "Two", points: 2 },
  { id: "THREE_FOUR", label: "Three or four", points: 3 },
  { id: "FIVE_PLUS", label: "Five or more", points: 4 },
  na(),
];

const CONDITIONS: AssessmentOption[] = [
  exclusive({ id: "NONE", label: "None of these" }),
  { id: "T2D", label: "Type 2 diabetes" },
  { id: "PREDIABETES", label: "Prediabetes" },
  { id: "HTN", label: "High blood pressure" },
  { id: "DYSLIPID", label: "High cholesterol or triglycerides" },
  { id: "THYROID", label: "Thyroid condition" },
  { id: "PCOS", label: "Polycystic ovary syndrome" },
  { id: "SLEEP_APNEA", label: "Sleep apnoea" },
  { id: "OTHER", label: "Other" },
  { id: "PREFER_NOT", label: "Prefer not to say" },
  na(),
];

const MEDICATION_CONTEXT: AssessmentOption[] = [
  exclusive({ id: "NONE", label: "No" }),
  { id: "GLUCOSE", label: "Glucose-lowering medicine" },
  { id: "WEIGHT", label: "Weight-management medicine" },
  { id: "STEROID", label: "Long-term corticosteroid" },
  { id: "HORMONAL", label: "Hormonal medicine" },
  { id: "OTHER", label: "Other relevant medicine" },
  { id: "UNSURE", label: "Not sure" },
  { id: "PREFER_NOT", label: "Prefer not to say" },
  na(),
];
const SLEEP_HOURS: AssessmentOption[] = [
  { id: "LT5", label: "Less than 5 hours", points: 4 },
  { id: "H5_6", label: "5 to less than 6 hours", points: 3 },
  { id: "H6_7", label: "6 to less than 7 hours", points: 1 },
  { id: "H7_9", label: "7 to 9 hours", points: 0 },
  { id: "GT9", label: "More than 9 hours", points: 2 },
  na(),
];

const ACTIVITY_DAYS: AssessmentOption[] = [
  { id: "D0", label: "0 days", points: 4 },
  { id: "D1_2", label: "1-2 days", points: 3 },
  { id: "D3_4", label: "3-4 days", points: 1 },
  { id: "D5_7", label: "5-7 days", points: 0 },
  na(),
];

const ACTIVITY_DURATION: AssessmentOption[] = [
  { id: "LT10", label: "Less than 10 minutes", points: 4 },
  { id: "M10_29", label: "10-29 minutes", points: 3 },
  { id: "M30_59", label: "30-59 minutes", points: 1 },
  { id: "M60_PLUS", label: "60 minutes or more", points: 0 },
  na(),
];

const ACTIVITY_TYPE: AssessmentOption[] = [
  { id: "NONE", label: "No intentional activity", points: 4 },
  { id: "LIGHT", label: "Light movement or daily activities", points: 3 },
  { id: "AEROBIC", label: "Mostly aerobic activity", points: 2 },
  { id: "RESISTANCE", label: "Mostly resistance training", points: 1 },
  { id: "MIXED", label: "A mix of aerobic and resistance activity", points: 0 },
  na(),
];

const STRESS_RESPONSE: AssessmentOption[] = [
  { id: "EAT", label: "Eat or seek snack foods" },
  { id: "WITHDRAW", label: "Withdraw or avoid people" },
  { id: "WALK", label: "Walk or move" },
  { id: "BREATHE", label: "Use breathing or relaxation" },
  { id: "TALK", label: "Talk with someone" },
  { id: "WORK_MORE", label: "Work more or stay busy" },
  { id: "OTHER", label: "Other" },
  { id: "UNSURE", label: "Not sure" },
  na(),
];

const HUNGER_CAUSE: AssessmentOption[] = [
  { id: "MEAL_COMPOSITION", label: "Low protein, fibre or meal size" },
  { id: "STRESS", label: "Stress or emotion" },
  { id: "SLEEP", label: "Poor sleep" },
  { id: "HABIT", label: "Habit or availability" },
  { id: "MEDICATION", label: "Medicine-related" },
  { id: "UNSURE", label: "Not sure" },
  { id: "OTHER", label: "Other" },
  na(),
];

const ENERGY_CAUSE: AssessmentOption[] = [
  { id: "SLEEP", label: "Sleep or recovery" },
  { id: "STRESS", label: "Stress" },
  { id: "INACTIVITY", label: "Low activity" },
  { id: "MEALS", label: "Meal pattern" },
  { id: "MEDICATION", label: "Medicine-related" },
  { id: "HEALTH", label: "A known health concern" },
  { id: "UNSURE", label: "Not sure" },
  { id: "OTHER", label: "Other" },
  na(),
];

const CAFFEINE: AssessmentOption[] = [
  { id: "ZERO", label: "0 drinks" },
  { id: "ONE", label: "1 drink" },
  { id: "TWO", label: "2 drinks" },
  { id: "THREE", label: "3 drinks" },
  { id: "FOUR_PLUS", label: "4 or more drinks" },
  na(),
];

const HORMONAL_STAGE: AssessmentOption[] = [
  { id: "NOT_APPLICABLE", label: "Not applicable to me" },
  { id: "REGULAR_CYCLES", label: "Regular menstrual cycles" },
  { id: "IRREGULAR_CYCLES", label: "Irregular menstrual cycles" },
  { id: "PERIMENOPAUSE", label: "Perimenopause" },
  { id: "POSTMENOPAUSE", label: "Postmenopause" },
  { id: "PREGNANT_POSTPARTUM", label: "Pregnant or within one year after birth" },
  { id: "MALE_CONTEXT", label: "Male hormonal context" },
  { id: "OTHER_UNSURE", label: "Other or unsure" },
  { id: "PREFER_NOT", label: "Prefer not to say" },
];

const TOBACCO: AssessmentOption[] = [
  { id: "NEVER", label: "Never" },
  { id: "FORMER", label: "Former use" },
  { id: "OCCASIONAL", label: "Occasional" },
  { id: "DAILY", label: "Daily" },
  { id: "PREFER_NOT", label: "Prefer not to say" },
  na(),
];

const ALCOHOL: AssessmentOption[] = [
  { id: "NEVER", label: "Never" },
  { id: "MONTHLY", label: "Monthly or less" },
  { id: "WEEKLY", label: "1-2 days per week" },
  { id: "FREQUENT", label: "3 or more days per week" },
  { id: "PREFER_NOT", label: "Prefer not to say" },
  na(),
];

const EATING_PATTERN: AssessmentOption[] = [
  { id: "REGULAR_BALANCED", label: "Regular meals with varied foods" },
  { id: "IRREGULAR", label: "Irregular meals" },
  { id: "FREQUENT_SNACKING", label: "Frequent grazing or snacking" },
  { id: "RESTRICT_BINGE", label: "Alternating restriction and overeating" },
  { id: "SPECIAL_DIET", label: "A specific dietary pattern" },
  { id: "OTHER", label: "Other" },
  na(),
];

const SUPPORT_LEVEL: AssessmentOption[] = [
  { id: "NONE", label: "Not at all supportive" },
  { id: "LOW", label: "A little supportive" },
  { id: "MIXED", label: "Mixed or inconsistent" },
  { id: "GOOD", label: "Supportive" },
  { id: "STRONG", label: "Very supportive" },
  na(),
];

const PRIMARY_GOAL: AssessmentOption[] = [
  { id: "WEIGHT", label: "Understand weight resistance" },
  { id: "ENERGY", label: "Improve energy" },
  { id: "SLEEP", label: "Improve sleep and recovery" },
  { id: "CRAVINGS", label: "Understand hunger or cravings" },
  { id: "STRESS", label: "Understand stress patterns" },
  { id: "PREVENTION", label: "Support long-term prevention and healthy ageing" },
  { id: "OTHER", label: "Other" },
];

const PRIORITY_AREA: AssessmentOption[] = [
  { id: "MR", label: "Metabolic resistance" },
  { id: "HS", label: "Hunger and satiety" },
  { id: "SR", label: "Sleep recovery" },
  { id: "CH", label: "Circadian health" },
  { id: "SL", label: "Stress load" },
  { id: "IB", label: "Inflammation burden" },
  { id: "BS", label: "Biological safety" },
  { id: "UNSURE", label: "Not sure" },
];

const CHANGE_PACE: AssessmentOption[] = [
  { id: "ONE_STEP", label: "One small step at a time" },
  { id: "TWO_THREE", label: "Two or three coordinated changes" },
  { id: "STRUCTURED", label: "A structured 90-day plan" },
  { id: "UNDERSTAND_FIRST", label: "I want to understand first" },
];

const ANSWER_CONFIDENCE: AssessmentOption[] = [
  { id: "LOW", label: "Not very confident", points: 25 },
  { id: "MODERATE", label: "Moderately confident", points: 50 },
  { id: "HIGH", label: "Confident", points: 75 },
  { id: "VERY_HIGH", label: "Very confident", points: 100 },
];
export const optionSets: Record<string, CanonicalOptionSet> = {
  FREQ: { id: "FREQ", options: FREQ },
  YES_NO_UNSURE: { id: "YES_NO_UNSURE", options: YES_NO_UNSURE },
  SEX: { id: "SEX", options: SEX },
  WAIST_UNIT: { id: "WAIST_UNIT", options: WAIST_UNIT },
  WEIGHT_DURATION: { id: "WEIGHT_DURATION", options: WEIGHT_DURATION },
  WEIGHT_PATTERN: { id: "WEIGHT_PATTERN", options: WEIGHT_PATTERN },
  GAIN_PATTERN: { id: "GAIN_PATTERN", options: GAIN_PATTERN },
  WEIGHT_CYCLES: { id: "WEIGHT_CYCLES", options: WEIGHT_CYCLES },
  CONDITIONS: { id: "CONDITIONS", options: CONDITIONS },
  MEDICATION_CONTEXT: { id: "MEDICATION_CONTEXT", options: MEDICATION_CONTEXT },
  SLEEP_HOURS: { id: "SLEEP_HOURS", options: SLEEP_HOURS },
  ACTIVITY_DAYS: { id: "ACTIVITY_DAYS", options: ACTIVITY_DAYS },
  ACTIVITY_DURATION: { id: "ACTIVITY_DURATION", options: ACTIVITY_DURATION },
  ACTIVITY_TYPE: { id: "ACTIVITY_TYPE", options: ACTIVITY_TYPE },
  STRESS_RESPONSE: { id: "STRESS_RESPONSE", options: STRESS_RESPONSE },
  HUNGER_CAUSE: { id: "HUNGER_CAUSE", options: HUNGER_CAUSE },
  ENERGY_CAUSE: { id: "ENERGY_CAUSE", options: ENERGY_CAUSE },
  CAFFEINE: { id: "CAFFEINE", options: CAFFEINE },
  HORMONAL_STAGE: { id: "HORMONAL_STAGE", options: HORMONAL_STAGE },
  TOBACCO: { id: "TOBACCO", options: TOBACCO },
  ALCOHOL: { id: "ALCOHOL", options: ALCOHOL },
  EATING_PATTERN: { id: "EATING_PATTERN", options: EATING_PATTERN },
  SUPPORT_LEVEL: { id: "SUPPORT_LEVEL", options: SUPPORT_LEVEL },
  PRIMARY_GOAL: { id: "PRIMARY_GOAL", options: PRIMARY_GOAL },
  PRIORITY_AREA: { id: "PRIORITY_AREA", options: PRIORITY_AREA },
  CHANGE_PACE: { id: "CHANGE_PACE", options: CHANGE_PACE },
  ANSWER_CONFIDENCE: { id: "ANSWER_CONFIDENCE", options: ANSWER_CONFIDENCE },
};

export function getOptionSet(optionSetId: string): CanonicalOptionSet {
  const set = optionSets[optionSetId];
  if (!set) throw new Error(`Unknown canonical option_set_id: ${optionSetId}`);
  return set;
}

export function getOption(optionSetId: string, optionId: string): AssessmentOption | undefined {
  return getOptionSet(optionSetId).options.find((option) => option.id === optionId);
}

/** True when the option set contains an explicit approved N/A option. */
export function optionSetAllowsNa(optionSetId: string): boolean {
  return getOptionSet(optionSetId).options.some((option) => option.isNa === true);
}

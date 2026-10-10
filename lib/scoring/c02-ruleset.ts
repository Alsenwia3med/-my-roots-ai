/**
 * C-02 Canonical Scoring Rules (ROOTS-C02-SCORING-001), from the controlled executable workbook
 * 03_ROOTS_AI_C02_Canonical_Scoring_Rules_and_Golden_Tests_v1.0.1_CORRECTED.xlsx.
 *
 * The tables — domains, the 40-item mapping, the explicit option points, the classification
 * boundaries, the driver tie order and the version — are read from c02-ruleset.json, which
 * scripts/canonical/generate.py produces from the workbook (it records the workbook's SHA-256).
 * The formula constants below are the numbers written in the workbook's Formulas,
 * Protective_Factors and Drivers_Evidence sheets; tests/scoring/source.test.ts checks each one
 * against that text, so none can drift from the controlled source. The engine (./engine.ts)
 * holds no numbers of its own.
 */

import ruleset from './c02-ruleset.json';

export const DATASET_ID: string = ruleset.dataset_id;
export const SCORING_VERSION: string = ruleset.scoring_version;
export const RULESET_SOURCE = ruleset.source;

export type DomainId = 'MR' | 'SR' | 'HS' | 'SL' | 'IB' | 'CH' | 'BS';

const DOMAIN_IDS: readonly DomainId[] = ['MR', 'SR', 'HS', 'SL', 'IB', 'CH', 'BS'];
const asDomain = (id: string): DomainId => {
  if (!(DOMAIN_IDS as readonly string[]).includes(id)) throw new Error(`C-02: unknown domain ${id}`);
  return id as DomainId;
};

/**
 * Output and tie-break order: DRV-002 "exact ties use fixed order MR,HS,SR,CH,SL,IB,BS".
 * Parsed from the rule text so it cannot differ from the workbook.
 */
export const DOMAIN_ORDER: readonly DomainId[] = (() => {
  const rule = ruleset.drivers_evidence.find((r) => r.rule_id === 'DRV-002')?.['deterministic rule'] ?? '';
  const match = /fixed order ([A-Z]{2}(?:,[A-Z]{2})+)/.exec(rule);
  if (!match) throw new Error('C-02: DRV-002 tie order not found');
  const order = match[1].split(',').map(asDomain);
  if (order.length !== 7 || new Set(order).size !== 7) throw new Error('C-02: DRV-002 tie order must list the seven domains once');
  return order;
})();

/** Domains sheet — display names. Higher scores mean greater self-reported burden. */
export const DOMAIN_NAMES: Record<DomainId, string> = Object.fromEntries(
  ruleset.domains.map((d) => [asDomain(d.domain_id), d.display_name]),
) as Record<DomainId, string>;

/** Burden points per option ID (Option_Points sheet). N/A options are absent: they carry no points. */
type PointsMap = Readonly<Record<string, number>>;

export interface ScoredItem {
  question_id: string;
  domain_id: DomainId;
  weight: number;
  reverse_scored: boolean;
  /** The C-01 option set this item is answered from. */
  option_set_id: string;
  points: PointsMap;
}

/** Question_Mapping + Option_Points — the 40 scored items, each in exactly one domain. */
export const SCORED_ITEMS: readonly ScoredItem[] = ruleset.question_mapping.map((m) => {
  const rows = ruleset.option_points.filter((p) => p.question_id === m.question_id);
  const points: Record<string, number> = {};
  for (const p of rows) {
    if (p.excluded_as_na) continue;
    if (typeof p.burden_points !== 'number') throw new Error(`C-02: ${m.question_id}/${p.option_id} has no points`);
    points[p.option_id] = p.burden_points;
  }
  return {
    question_id: m.question_id,
    domain_id: asDomain(m.domain_id),
    weight: m.weight,
    reverse_scored: m.reverse_scored,
    option_set_id: rows[0]?.option_set_id ?? m.points_map,
    points,
  };
});

/** Maximum burden points per item (0-4 scale). */
export const MAX_POINTS = 4;

/** C-02 p.1 — domain coverage threshold: below this a domain score is null. */
export const DOMAIN_COVERAGE_THRESHOLD = 0.5;

/** C-02 p.1 / SC-002 — Biological State needs at least this many available domains. */
export const BIOLOGICAL_STATE_MIN_DOMAINS = 5;

/** SC-003 — Opportunity = 100 - Biological State x 0.5. */
export const OPPORTUNITY_FACTOR = 0.5;

/** SC-004 — Protective Factor Score = 20 x count of active P1-P5. */
export const PROTECTIVE_POINTS_PER_FACTOR = 20;

/** SC-005 — Recovery Potential weights. */
export const RECOVERY_WEIGHTS = {
  inverseBiologicalState: 0.3,
  protective: 0.25,
  age: 0.2,
  condition: 0.15,
  medication: 0.1,
} as const;

/** SC-008 — ROOTS Confidence weights. */
export const CONFIDENCE_WEIGHTS = { coverage: 0.5, answerConfidence: 0.3, consistency: 0.2 } as const;

/** EVD-001 — evidence score weights; high-signal means points >= 3. */
export const EVIDENCE_WEIGHTS = { coverage: 0.45, consistency: 0.35, highSignal: 0.2 } as const;
export const HIGH_SIGNAL_MIN_POINTS = 3;

/**
 * DRV-001..004 — drivers (v1.0.1).
 *
 * DRV-001: only available domains scoring >= 25 are eligible; lower or null domains are never
 * drivers. DRV-002: eligible domains ranked by score, exact ties in DOMAIN_ORDER. DRV-003: if
 * the top two eligible scores differ by <= 3 they are reported once, as one co-primary pair,
 * followed by the next distinct eligible domain if one exists — no duplication, no ineligible
 * fallback. Otherwise primary, secondary, tertiary. DRV-004: no eligible domain, no driver.
 */
export const DRIVER_RULES = {
  /** DRV-001 — minimum score for a domain to be a driver. */
  eligibilityMin: 25,
  /** DRV-003 — top two within this many points are co-primary. */
  coPrimaryMaxDelta: 3,
  /** Primary / secondary / tertiary. */
  count: 3,
} as const;

/**
 * C-02 p.13 — protective factors. Each contributes 20 to the Protective Factor Score, which
 * feeds Recovery Potential only; none alters a domain score or Biological State.
 * Option IDs are C-01's; their labels match C-02's wording exactly.
 */
export const PROTECTIVE_FACTORS = {
  /** Activity >= 3 days/week AND usual duration >= 30 minutes. */
  P1: { Q46: ['D3_4', 'D5_7'], Q47: ['M30_59', 'M60_PLUS'] },
  /** Meal timing consistency: Often or Almost always. */
  P2: { Q64: ['OFT', 'ALW'] },
  /** Home environment: Supportive or Very supportive. */
  P3: { Q65: ['GOOD', 'STRONG'] },
  /** Nicotine context: Never or Former use. */
  P4: { Q61: ['NEVER', 'FORMER'] },
  /** Readiness 7-10 on the 0-10 scale. */
  P5: { Q69: { min: 7, max: 10 } },
} as const;

/** C-01 questions feeding Recovery Potential and ROOTS Confidence. */
export const FACTOR_SOURCES = { age: 'Q1', condition: 'Q13', medication: 'Q14', answerConfidence: 'Q72' } as const;

/** The "none selected" option on the Q13 and Q14 multi-selects. */
export const NONE_OPTION = 'NONE';

/** Q13: Prefer not to say / N/A make the condition factor unavailable and set a limitation flag. */
export const CONDITION_UNAVAILABLE_OPTIONS: readonly string[] = ['PREFER_NOT', 'NA'];

/** Q14: Not sure / Prefer not to say / N/A make the medication factor unavailable and set a limitation flag. */
export const MEDICATION_UNAVAILABLE_OPTIONS: readonly string[] = ['UNSURE', 'PREFER_NOT', 'NA'];

/** C-02 p.13 — age band values for Recovery Potential (Q1). */
export const AGE_BANDS: readonly { min: number; max: number; value: number }[] = [
  { min: 16, max: 30, value: 100 },
  { min: 31, max: 45, value: 80 },
  { min: 46, max: 60, value: 60 },
  { min: 61, max: 75, value: 40 },
  { min: 76, max: 110, value: 20 },
];

/** C-02 p.13 — Q13 condition categories: none=100; one=75; two=50; three or more=25. */
export const CONDITION_VALUES: readonly number[] = [100, 75, 50, 25];

/** C-02 p.13 — Q14 medication categories: none=100; one=75; two or more=50. */
export const MEDICATION_VALUES: readonly number[] = [100, 75, 50];

export interface Classification {
  label: string;
  color_hex: string;
  interpretation: string;
}

interface Band extends Classification {
  min: number;
  max: number;
}

/**
 * Classifications sheet — boundaries. Bounds are inclusive; domain labels describe questionnaire
 * burden only and must never be displayed as a diagnosis.
 */
export const CLASSIFICATIONS: Readonly<Record<'DOMAIN' | 'CONFIDENCE' | 'RECOVERY', readonly Band[]>> = {
  DOMAIN: bands('DOMAIN'),
  CONFIDENCE: bands('CONFIDENCE'),
  RECOVERY: bands('RECOVERY'),
};

function bands(scale: string): Band[] {
  return ruleset.classifications
    .filter((c) => c.scale === scale)
    .map((c) => ({ min: c.minimum, max: c.maximum, label: c.label, color_hex: c.color_hex, interpretation: c.approved_interpretation }));
}

/** EVD-002 — evidence labels. Not a clinical evidence grade. */
export const EVIDENCE_LABELS: readonly { min: number; max: number; label: string }[] = [
  { min: 80, max: 100, label: 'Strong' },
  { min: 60, max: 79, label: 'Moderate' },
  { min: 40, max: 59, label: 'Limited' },
  { min: 0, max: 39, label: 'Weak' },
];

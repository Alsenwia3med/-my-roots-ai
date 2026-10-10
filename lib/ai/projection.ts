/**
 * The approved read-only projection — the only thing the AI narrative layer is ever shown
 * (Regulatory Readiness Annex AI-01; C-03 §7 "Input is an allow-listed explanation object
 * containing pre-calculated values, classifications, driver IDs, eligible content IDs and
 * version identifiers").
 *
 * This is a pure function over a finished C-02 scoring result. It runs only after deterministic
 * scoring is complete, it copies values out, and nothing it returns can travel back into the
 * calculation. Building the projection is therefore the boundary: whatever is not selected here
 * is not available to the model — raw answers, participant identity, free text, the scoring
 * trace and the per-domain coverage are all withheld.
 *
 * Q73 (the optional free-text question) is deliberately NOT projected. C-03 §7 requires it to be
 * sanitised, separately classified and never inserted into system instructions, so only a
 * boolean travels: the Final Word can acknowledge that something was written without the model
 * ever seeing what.
 */

import { DOMAIN_DISPLAY_ORDER, DOMAIN_LABELS, DOMAIN_MEANINGS } from '../report/c03-content';
import type { DomainId } from '../scoring/c02-ruleset';
import type { ScoringResult } from '../scoring/engine';

export interface ProjectedDomain {
  domain_id: DomainId;
  label: string;
  meaning: string;
  /** Already calculated. Null means "not enough information" and must stay explicit (RPT-02). */
  score: number | null;
  classification: string | null;
}

export interface NarrativeProjection {
  biological_state: number | null;
  biological_state_classification: string | null;
  opportunity_score: number | null;
  recovery_potential: number | null;
  confidence: { score: number; label: string };
  /** C-02 driver output verbatim: zero to three entries, a co-primary pair as one entry. */
  drivers: { id: string; label: string }[];
  domains: ProjectedDomain[];
  protective_factors: { id: string; label: string }[];
  /** Machine-readable limitation codes, so the narrative can acknowledge gaps but not fill them. */
  limitations: string[];
  /** Whether a free-text response exists — never its content (C-03 §7). */
  free_text_present: boolean;
  versions: { questionnaire_version: string; scoring_version: string; report_template_version: string };
  /** Scale direction, so the model cannot invert the meaning of a score. */
  scale_note: string;
}

export interface ProjectionInput {
  scoring: ScoringResult;
  /** Driver labels as the report renders them, so the narrative and the report agree. */
  driverLabels: Record<string, string>;
  biologicalStateClassification: string | null;
  protectiveFactors: { id: string; label: string }[];
  freeTextPresent: boolean;
  questionnaireVersion: string;
  reportTemplateVersion: string;
}

/**
 * C-03 §3: 0-24 Optimized … 75-100 Dysregulated, where a higher score means more reported
 * burden. Stated explicitly because a model shown only numbers could otherwise read them as a
 * "health score" and reverse every interpretation.
 */
export const SCALE_NOTE =
  'Scores run 0-100 where a HIGHER score means MORE reported burden in that area, not better health. Null means not enough information.';

export function buildProjection(input: ProjectionInput): NarrativeProjection {
  const { scoring } = input;

  return {
    biological_state: scoring.biological_state,
    biological_state_classification: input.biologicalStateClassification,
    opportunity_score: scoring.opportunity,
    recovery_potential: scoring.recovery_potential,
    confidence: { score: scoring.confidence, label: scoring.classifications.confidence.label },
    drivers: scoring.drivers.map((id) => ({ id, label: input.driverLabels[id] ?? id })),
    domains: DOMAIN_DISPLAY_ORDER.map((id) => ({
      domain_id: id,
      label: DOMAIN_LABELS[id],
      meaning: DOMAIN_MEANINGS[id],
      score: scoring.domains[id],
      classification: scoring.classifications.domains[id]?.label ?? null,
    })),
    protective_factors: input.protectiveFactors,
    limitations: [...scoring.limitations],
    free_text_present: input.freeTextPresent,
    versions: {
      questionnaire_version: input.questionnaireVersion,
      scoring_version: scoring.scoring_version,
      report_template_version: input.reportTemplateVersion,
    },
    scale_note: SCALE_NOTE,
  };
}

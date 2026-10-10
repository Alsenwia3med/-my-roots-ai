/**
 * Engine result -> one public.scores row. Pure, so it can be tested without a database.
 */

import { SCORING_SOURCE_VERSIONS } from '@/lib/versions';
import type { DomainId } from './c02-ruleset';
import type { ScoringResult } from './engine';

const DOMAIN_COLUMNS: Record<DomainId, string> = {
  MR: 'mr_score',
  SR: 'sr_score',
  HS: 'hs_score',
  SL: 'sl_score',
  IB: 'ib_score',
  CH: 'ch_score',
  BS: 'bs_score',
};

export function toScoresRow(
  assessmentId: string,
  result: ScoringResult,
  rawOptionIds: Record<string, string | null>,
): Record<string, unknown> {
  const [primary = null, secondary = null, tertiary = null] = result.drivers;
  return {
    assessment_id: assessmentId,
    ...Object.fromEntries(Object.entries(DOMAIN_COLUMNS).map(([d, column]) => [column, result.domains[d as DomainId]])),
    biological_state: result.biological_state,
    opportunity_score: result.opportunity,
    recovery_potential: result.recovery_potential,
    confidence: result.confidence,
    confidence_label: result.classifications.confidence.label,
    protective_count: result.protective_count,
    primary_driver: primary,
    secondary_driver: secondary,
    tertiary_driver: tertiary,
    drivers_json: result.drivers,
    coverage_json: result.coverage,
    classifications_json: result.classifications,
    evidence_json: result.evidence,
    limitations: result.limitations,
    dataset_id: result.dataset_id,
    scoring_version: result.scoring_version,
    // M2 item 7: the controlled documents this result was calculated from.
    source_versions: SCORING_SOURCE_VERSIONS,
    // C-02 SC-001 audit fields include the raw option IDs behind each item's points.
    calculation_trace: { ...result.trace, raw_option_ids: rawOptionIds, source_versions: SCORING_SOURCE_VERSIONS },
  };
}

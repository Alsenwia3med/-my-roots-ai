/**
 * What is recorded about the narrative on every report (Regulatory Readiness Annex AI-06:
 * "Provider, model, prompt, schema, content-library and fallback versions are stored with the
 * report snapshot").
 *
 * Kept apart from ./config.ts, which is server-only, so the report builder and its tests can
 * describe a report's provenance without pulling in the provider configuration.
 */

export type FallbackReason =
  | 'disabled'
  | 'not_configured'
  | 'timeout'
  | 'provider_error'
  | 'invalid_json'
  | 'schema_rejected'
  | 'prohibited_language';

export interface NarrativeProvenance {
  provider: string;
  model: string;
  prompt_version: string;
  schema_version: string;
  content_library_version: string;
  fallback_version: string;
  /** How the narrative for this report was produced. */
  outcome: 'generated' | 'generated_after_retry' | 'deterministic_fallback';
  /** Present only when the fallback was used, so a failure is never silent. */
  fallback_reason?: FallbackReason;
}

/**
 * A report built without any narrative attempt — the honest record when AI is switched off
 * (AI-11) and the safe default for a report assembled outside the generation path.
 */
export const NO_NARRATIVE: NarrativeProvenance = {
  provider: 'none',
  model: 'none',
  prompt_version: 'n/a',
  schema_version: 'n/a',
  content_library_version: 'C-03-v1.0.1',
  fallback_version: '1.0.0-deterministic-fallback',
  outcome: 'deterministic_fallback',
  fallback_reason: 'disabled',
};

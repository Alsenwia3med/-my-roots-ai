/**
 * Controlled AI narrative configuration (Regulatory Readiness Annex §8, AI-06 and AI-11).
 *
 * AI-06 requires the provider, model, prompt, schema, content-library and fallback versions to
 * be stored with every report snapshot. They are declared here, in one place, so a stored report
 * can always be traced to the exact configuration that produced it.
 *
 * AI-11 requires ROOTS-AI to be able to disable the narrative, or change the approved model,
 * without changing scoring. Both are environment settings: clearing AI_NARRATIVE_ENABLED turns
 * the narrative off and every governed section falls back to its approved deterministic copy
 * (C-03 §7, acceptance check RPT-07). No score, classification or driver is affected either way,
 * because the narrative never takes part in the calculation (AI-01).
 */

import 'server-only';
import type { FallbackReason, NarrativeProvenance } from './provenance';

export type { FallbackReason, NarrativeProvenance } from './provenance';

export const PROVIDER = 'openai';

/**
 * The approved model. ROOTS-AI can change it with OPENAI_MODEL without a code change (AI-11);
 * whichever value is used is recorded in the report snapshot (AI-06).
 */
export const DEFAULT_MODEL = 'gpt-4.1';

export const PROMPT_VERSION = '1.0.0';
export const SCHEMA_VERSION = '1.0.0';
/** The approved interpretation content the narrative is grounded in (AI-04) — C-03 v1.0.1. */
export const CONTENT_LIBRARY_VERSION = 'C-03-v1.0.1';
/** The approved deterministic copy used when the narrative is unavailable (C-03 §7). */
export const FALLBACK_VERSION = '1.0.0-deterministic-fallback';

/** Per-attempt limit. AI-07: timeout and retry prevent indefinite waiting. */
export const REQUEST_TIMEOUT_MS = 20_000;

export function model(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

/** AI-11 — the ROOTS-AI kill switch. Off unless explicitly enabled. */
export function narrativeEnabled(): boolean {
  return process.env.AI_NARRATIVE_ENABLED === 'true';
}

export function apiKey(): string | null {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

/** The configuration recorded on a report, whatever the outcome. */
export function provenance(outcome: NarrativeProvenance['outcome'], fallbackReason?: FallbackReason): NarrativeProvenance {
  return {
    provider: PROVIDER,
    model: model(),
    prompt_version: PROMPT_VERSION,
    schema_version: SCHEMA_VERSION,
    content_library_version: CONTENT_LIBRARY_VERSION,
    fallback_version: FALLBACK_VERSION,
    outcome,
    ...(fallbackReason ? { fallback_reason: fallbackReason } : {}),
  };
}

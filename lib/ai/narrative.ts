/**
 * Governed narrative generation for the report pipeline (Regulatory Readiness Annex AI-01 … AI-11).
 *
 * The order is the boundary:
 *
 *   deterministic scoring finishes
 *     -> read-only projection is built          (AI-01, ./projection.ts)
 *     -> the provider is asked for narrative    (AI-04, AI-07, AI-10, ./provider.ts)
 *     -> shape and language are validated       (AI-02, AI-05, ./orchestrate.ts)
 *     -> accepted, or the approved fallback     (C-03 §7, RPT-07)
 *
 * This function cannot fail a report. Every path returns — AI switched off, missing key,
 * timeout, malformed JSON, rejected schema, prohibited wording — and on each one the caller
 * keeps the approved deterministic copy it already has, with the reason recorded in the
 * provenance so a downgrade is never silent (AI-06, AI-07).
 */

import 'server-only';
import { narrativeEnabled, provenance } from './config';
import { runNarrative } from './orchestrate';
import type { NarrativeProjection } from './projection';
import type { NarrativeProvenance } from './provenance';
import { requestNarrative } from './provider';
import type { Narrative } from './schema';

export interface NarrativeOutcome {
  /** Null whenever the approved deterministic copy must be kept. */
  narrative: Narrative | null;
  provenance: NarrativeProvenance;
}

/** Never throws. A narrative problem degrades to the governed fallback, never to a failed report. */
export async function generateNarrative(projection: NarrativeProjection): Promise<NarrativeOutcome> {
  // AI-11: ROOTS-AI can switch the narrative off without touching scoring.
  if (!narrativeEnabled()) {
    return { narrative: null, provenance: provenance('deterministic_fallback', 'disabled') };
  }

  const result = await runNarrative(projection, requestNarrative);

  if (result.rejections.length) {
    // The wording itself is never logged; only why it was refused.
    console.warn(`narrative rejected (${result.rejections.length}): ${result.rejections.join(' | ')}`);
  }

  return {
    narrative: result.narrative,
    provenance: provenance(result.outcome, result.fallbackReason),
  };
}

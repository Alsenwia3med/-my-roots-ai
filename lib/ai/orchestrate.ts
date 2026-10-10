/**
 * The narrative decision, as a pure function (Regulatory Readiness Annex AI-02, AI-05, AI-07).
 *
 * Everything that decides whether generated wording may be used lives here, with the provider
 * supplied by the caller. That keeps the rule — validate the shape, validate the language, retry
 * once, otherwise fall back — reproducible without a network, so the AI-09 evidence for
 * malformed output, score injection, hallucinated values, prohibited language and
 * timeout/retry/fallback can be produced deterministically in the test suite.
 *
 * ./narrative.ts is the thin server-only wrapper that supplies the real provider and turns the
 * result into stored provenance.
 */

import { checkNarrativeLanguage } from './language';
import type { NarrativeProjection } from './projection';
import type { FallbackReason } from './provenance';
import { validateNarrative, type Narrative } from './schema';

/** C-03 §7: "One governed retry is permitted after validation failure; then the fixed fallback copy is used." */
export const MAX_ATTEMPTS = 2;

/** What the caller must provide: raw model output, or a throw. */
export type RequestNarrative = (projection: NarrativeProjection) => Promise<string>;

/** A provider failure the orchestrator can tell apart from a content failure. */
export class NarrativeProviderError extends Error {
  constructor(
    message: string,
    readonly kind: Extract<FallbackReason, 'timeout' | 'provider_error' | 'not_configured'>,
  ) {
    super(message);
    this.name = 'NarrativeProviderError';
  }
}

export interface NarrativeDecisionResult {
  narrative: Narrative | null;
  outcome: 'generated' | 'generated_after_retry' | 'deterministic_fallback';
  fallbackReason?: FallbackReason;
  /** Why each attempt was refused, in order. Recorded for evidence, never shown to a participant. */
  rejections: string[];
}

export async function runNarrative(projection: NarrativeProjection, request: RequestNarrative): Promise<NarrativeDecisionResult> {
  const rejections: string[] = [];
  let lastReason: FallbackReason = 'provider_error';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = await attemptOnce(projection, request);

    if (result.ok) {
      return { narrative: result.narrative, outcome: attempt === 1 ? 'generated' : 'generated_after_retry', rejections };
    }

    rejections.push(result.detail);
    lastReason = result.reason;
    // A missing key will not resolve itself on a second call.
    if (result.reason === 'not_configured') break;
  }

  return { narrative: null, outcome: 'deterministic_fallback', fallbackReason: lastReason, rejections };
}

type AttemptResult = { ok: true; narrative: Narrative } | { ok: false; reason: FallbackReason; detail: string };

async function attemptOnce(projection: NarrativeProjection, request: RequestNarrative): Promise<AttemptResult> {
  let raw: string;
  try {
    raw = await request(projection);
  } catch (e) {
    if (e instanceof NarrativeProviderError) return { ok: false, reason: e.kind, detail: e.message };
    return { ok: false, reason: 'provider_error', detail: e instanceof Error ? e.message : 'unknown provider failure' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'invalid_json', detail: 'response was not JSON' };
  }

  // AI-02: shape, score-bearing keys, length limits and numerals.
  const shape = validateNarrative(parsed);
  if (!shape.ok) return { ok: false, reason: 'schema_rejected', detail: shape.reason };

  // AI-05: prohibited diagnostic, prescriptive, alarmist, certainty and causal wording.
  const language = checkNarrativeLanguage(shape.narrative);
  if (!language.ok) return { ok: false, reason: 'prohibited_language', detail: language.reason };

  return { ok: true, narrative: shape.narrative };
}

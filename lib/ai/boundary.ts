import {
  buildAiProjection,
  type AiNarrativeProjection,
  type CanonicalReport,
} from "@/lib/canonical/report";

/**
 * Controlled AI narrative boundary.
 *
 * Controlled sources:
 *  - Regulatory Readiness Annex (Vendor-Core AI governance)
 *  - C-03 v1.0.1 CORRECTED (governed report content / interpretation sources)
 *
 * GOVERNANCE INVARIANTS (enforced in code, not by convention)
 * ----------------------------------------------------------
 *  1. AI runs only AFTER deterministic scoring is finalised, and receives only
 *     the read-only projection. Raw answers are never passed to the model.
 *  2. The AI output schema carries NARRATIVE FIELDS ONLY. There is no key in
 *     the schema through which a score, classification, driver, threshold or
 *     eligibility decision could be expressed or written back.
 *  3. Any returned object containing a score-bearing key is rejected outright.
 *  4. Any narrative containing prohibited diagnostic / prescriptive / alarmist /
 *     certainty language is rejected, and the governed fallback is used.
 *  5. Any numeric value in the narrative that is not present in the projection
 *     is treated as a hallucinated value and rejected.
 *  6. Timeout, transport failure, malformed output or governance rejection all
 *     resolve to the deterministic governed fallback. A valid deterministic
 *     result is therefore never lost because narrative generation failed.
 *  7. The AI path has no reference to the scoring result object and no storage
 *     handle; it cannot mutate the authoritative record.
 */

/**
 * Financial/eligibility/clinical decision-making is out of scope by contract.
 * These terms are prohibited in the narrative regardless of context, because
 * their presence signals an out-of-scope decision rather than an explanation.
 */
export const PROHIBITED_DECISION_TERMS = [
  "approved for",
  "denied",
  "eligibility",
  "eligible for",
  "premium",
  "insurance",
  "coverage decision",
  "employment",
  "service access",
  "prescribe",
  "prescription",
  "dosage",
  "dose",
  "medication",
  "treat your",
  "treatment plan",
  "cure",
  "diagnose",
  "diagnosis",
  "you have ",
  "guarantee",
  "guaranteed",
  "will definitely",
  "certainly will",
  "definitely will",
  "you will develop",
  "you will certainly",
] as const;

/** Alarmist / catastrophic framing is prohibited. */
export const PROHIBITED_ALARMIST_TERMS = [
  "dangerous",
  "danger",
  "urgent risk",
  "life-threatening",
  "you will die",
  "serious disease",
  "critical condition",
  "immediately seek",
  "high risk of death",
] as const;

/**
 * Certainty language is prohibited. The product reports a questionnaire
 * pattern, not a prognosis.
 */
export const PROHIBITED_CERTAINTY_TERMS = [
  "proves",
  "proof that",
  "confirms that you",
  "it is certain",
  "definitive",
  "without doubt",
  "undoubtedly",
  "no question that",
] as const;

export const ALL_PROHIBITED_TERMS = [
  ...PROHIBITED_DECISION_TERMS,
  ...PROHIBITED_ALARMIST_TERMS,
  ...PROHIBITED_CERTAINTY_TERMS,
] as const;

/**
 * The ONLY keys the AI output schema may contain. Anything else is a schema
 * violation. Note the deliberate absence of any score/domain/driver key.
 */
export const ALLOWED_NARRATIVE_KEYS = ["sections"] as const;

/** Keys that indicate an attempt to return authoritative values. */
export const SCORE_BEARING_KEYS = [
  "score",
  "scores",
  "biologicalState",
  "biological_state",
  "band",
  "classification",
  "classifications",
  "drivers",
  "opportunity",
  "recoveryPotential",
  "recovery_potential",
  "coverage",
  "domain",
  "domains",
  "overallScore",
  "scoredDomainCount",
  "contentHash",
  "threshold",
  "eligibility",
] as const;

export const GOVERNED_FALLBACK_VERSION = "AI-FALLBACK v1.0.0";

/**
 * The governed fallback narrative.
 *
 * This is deliberately deterministic, non-diagnostic and non-prescriptive. It
 * explains that the narrative is unavailable WITHOUT inferring anything about
 * the participant's health. It never substitutes a score or a clinical read.
 */
export function governedFallbackSections(
  sectionCount: number,
  reason: string,
): Array<{ index: number; narrative: string }> {
  return Array.from({ length: sectionCount }, (_, i) => ({
    index: i + 1,
    narrative:
      `Narrative interpretation is not available for this section. ${reason} ` +
      "The report uses the governed deterministic content and the calculated result is unaffected. " +
      "This educational report does not provide a medical conclusion.",
  }));
}

export type NarrativeOutcome =
  | {
      ok: true;
      sections: Array<{ index: number; narrative: string }>;
      provenance: NonNullable<CanonicalReport["provenance"]["ai"]>;
    }
  | {
      ok: false;
      reason: string;
      code:
        | "malformed_output"
        | "score_injection"
        | "prohibited_language"
        | "hallucinated_number"
        | "timeout"
        | "transport_error"
        | "schema_violation"
        | "disabled";
    };

export interface AiNarrativeConfig {
  provider: string;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  contentLibraryVersion: string;
  /** ROOTS can disable the AI narrative path without affecting scoring. */
  enabled: boolean;
  /** Milliseconds before the AI path is abandoned in favour of the fallback. */
  timeoutMs: number;
  /** Additional retries before falling back (total attempts = retries + 1). */
  retries: number;
}

export const DEFAULT_AI_CONFIG: AiNarrativeConfig = {
  provider: process.env.AI_NARRATIVE_PROVIDER ?? "unconfigured",
  model: process.env.AI_NARRATIVE_MODEL ?? "unconfigured",
  promptVersion: "PROMPT v1.0.0",
  schemaVersion: "SCHEMA v1.0.0",
  contentLibraryVersion: "CONTENT-LIB v1.0.0",
  enabled: process.env.AI_NARRATIVE_ENABLED === "true",
  timeoutMs: 20_000,
  retries: 2,
};

/**
 * Detect any key that could carry an authoritative value.
 *
 * The permitted shape is deliberately narrow:
 *
 *   { sections: [ { index: number, narrative: string }, ... ] }
 *
 * Any other key - at the top level, on a section object, or nested inside
 * either - is rejected. This is what makes "narrative fields only" an enforced
 * property rather than a convention: there is no reachable key through which a
 * score, classification, driver or eligibility decision could be expressed.
 */
export function findDisallowedKey(value: unknown): string | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return "__root__";
  }

  const root = value as Record<string, unknown>;
  for (const key of Object.keys(root)) {
    if (key !== "sections") return key;
  }

  const sections = root.sections;
  if (!Array.isArray(sections)) return "sections";

  for (const entry of sections) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return "__section__";
    }
    for (const key of Object.keys(entry as Record<string, unknown>)) {
      if (key !== "index" && key !== "narrative") return key;
    }
  }
  return null;
}

/** Scan narrative text for prohibited language. Returns the offending term. */
export function findProhibitedLanguage(text: string): string | null {
  const lower = text.toLowerCase();
  for (const term of ALL_PROHIBITED_TERMS) {
    if (lower.includes(term)) return term;
  }
  return null;
}

/**
 * Numbers that appear in narrative text must already exist in the approved
 * projection. A number the model invented is a hallucinated value.
 */
export function findHallucinatedNumber(
  text: string,
  projection: AiNarrativeProjection,
): string | null {
  const approved = new Set<string>();
  const add = (n: number | null) => {
    if (n === null) return;
    approved.add(String(n));
    approved.add(n.toFixed(1));
    approved.add(String(Math.round(n)));
  };
  add(projection.biologicalState);
  for (const d of projection.domains) add(d.score);
  approved.add(String(projection.scoredDomainCount));
  approved.add("7");
  approved.add("100");
  approved.add("5");

  // Percentages and standalone integers/decimals.
  const matches = text.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
  for (const m of matches) {
    if (!approved.has(m)) return m;
  }
  return null;
}

/** Validate a raw model response against schema + governance. */
export function validateNarrativeResponse(
  raw: unknown,
  projection: AiNarrativeProjection,
  sectionCount: number,
): NarrativeOutcome {
  if (raw === null || typeof raw !== "object") {
    return { ok: false, code: "malformed_output", reason: "Response was not an object." };
  }

  const disallowed = findDisallowedKey(raw);
  if (disallowed) {
    const isScoreKey = (SCORE_BEARING_KEYS as readonly string[]).includes(disallowed);
    return {
      ok: false,
      code: isScoreKey ? "score_injection" : "schema_violation",
      reason: `Response contained a key outside the narrative-only schema: "${disallowed}". Only sections[{index,narrative}] is permitted.`,
    };
  }

  const sections = (raw as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) {
    return {
      ok: false,
      code: "schema_violation",
      reason: "Response did not contain a sections array.",
    };
  }

  const validated: Array<{ index: number; narrative: string }> = [];
  for (const entry of sections) {
    if (entry === null || typeof entry !== "object") {
      return { ok: false, code: "malformed_output", reason: "Section entry was not an object." };
    }
    const record = entry as Record<string, unknown>;
    const index = record.index;
    const narrative = record.narrative;
    if (typeof index !== "number" || !Number.isInteger(index) || index < 1 || index > sectionCount) {
      return {
        ok: false,
        code: "schema_violation",
        reason: `Section index ${String(index)} is outside the governed 1..${sectionCount} range.`,
      };
    }
    if (typeof narrative !== "string" || narrative.trim().length === 0) {
      return {
        ok: false,
        code: "malformed_output",
        reason: `Section ${index} had no usable narrative text.`,
      };
    }

    const prohibited = findProhibitedLanguage(narrative);
    if (prohibited) {
      return {
        ok: false,
        code: "prohibited_language",
        reason: `Section ${index} contained prohibited term "${prohibited}".`,
      };
    }

    const hallucinated = findHallucinatedNumber(narrative, projection);
    if (hallucinated) {
      return {
        ok: false,
        code: "hallucinated_number",
        reason: `Section ${index} referenced ${hallucinated}, which is not present in the approved projection.`,
      };
    }

    validated.push({ index, narrative });
  }

  return { ok: true, sections: validated, provenance: provenanceFor() };
}

function provenanceFor(): NonNullable<CanonicalReport["provenance"]["ai"]> {
  return {
    provider: DEFAULT_AI_CONFIG.provider,
    model: DEFAULT_AI_CONFIG.model,
    promptVersion: DEFAULT_AI_CONFIG.promptVersion,
    schemaVersion: DEFAULT_AI_CONFIG.schemaVersion,
    contentLibraryVersion: DEFAULT_AI_CONFIG.contentLibraryVersion,
    fallbackVersion: null,
    usedFallback: false,
    fallbackReason: null,
  };
}

export interface NarrativeRequest {
  projection: AiNarrativeProjection;
  sectionCount: number;
}

/** Transport used to call the provider. Injected so it can be tested. */
export type NarrativeTransport = (
  projection: AiNarrativeProjection,
  signal: AbortSignal,
) => Promise<unknown>;

/**
 * Generate narrative under the controlled boundary.
 *
 * Returns the governed fallback on ANY failure. This function never throws and
 * never mutates the projection or any authoritative value.
 */
export async function generateGovernedNarrative(
  request: NarrativeRequest,
  transport: NarrativeTransport,
  config: AiNarrativeConfig = DEFAULT_AI_CONFIG,
): Promise<NarrativeOutcome> {
  if (!config.enabled) {
    return {
      ok: false,
      code: "disabled",
      reason: "AI narrative is disabled by configuration.",
    };
  }

  let lastReason = "AI narrative unavailable.";
  let lastCode: Exclude<NarrativeOutcome, { ok: true }>["code"] = "transport_error";

  for (let attempt = 0; attempt <= config.retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const raw = await transport(request.projection, controller.signal);
      const outcome = validateNarrativeResponse(
        raw,
        request.projection,
        request.sectionCount,
      );
      if (outcome.ok) return outcome;
      // Governance rejection is deterministic: retrying cannot fix prohibited
      // language or score injection, so we stop and fall back immediately.
      if (
        outcome.code === "score_injection" ||
        outcome.code === "prohibited_language" ||
        outcome.code === "hallucinated_number" ||
        outcome.code === "schema_violation"
      ) {
        return outcome;
      }
      lastReason = outcome.reason;
      lastCode = outcome.code;
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      lastCode = aborted ? "timeout" : "transport_error";
      lastReason = aborted
        ? `AI narrative timed out after ${config.timeoutMs}ms.`
        : `AI narrative transport failed: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      clearTimeout(timer);
    }
  }

  return { ok: false, code: lastCode, reason: lastReason };
}

/** Attach the governed fallback to a report, preserving the deterministic part. */
export function applyFallback(
  report: CanonicalReport,
  reason: string,
  config: AiNarrativeConfig = DEFAULT_AI_CONFIG,
): CanonicalReport {
  // Preserve the deterministic, governed C-03 section copy. The AI fallback
  // changes provenance only; it must not erase the canonical report content.
  return {
    ...report,
    sections: report.sections.map((section) => ({
      ...section,
      narrativeSource: "fallback" as const,
    })),
    provenance: {
      ...report.provenance,
      ai: {
        provider: config.provider,
        model: config.model,
        promptVersion: config.promptVersion,
        schemaVersion: config.schemaVersion,
        contentLibraryVersion: config.contentLibraryVersion,
        fallbackVersion: GOVERNED_FALLBACK_VERSION,
        usedFallback: true,
        fallbackReason: reason,
      },
    },
    // contentHash is intentionally untouched: a narrative failure must never
    // change the hash of the authoritative deterministic result or its governed
    // deterministic section copy.
  };
}

export { buildAiProjection };

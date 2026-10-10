import { calculateScores, type ScoringResult } from "@/lib/scoring";
import { createOpenAiTransport } from "@/lib/ai/openaiTransport";
import {
  buildCanonicalReport,
  buildAiProjection,
  verifyReportIntegrity,
  type CanonicalReport,
} from "@/lib/canonical/report";
import {
  DEFAULT_AI_CONFIG,
  applyFallback,
  generateGovernedNarrative,
  type AiNarrativeConfig,
  type NarrativeOutcome,
  type NarrativeTransport,
} from "@/lib/ai/boundary";

/**
 * Report generation pipeline.
 *
 * Order is contractual and must not be reordered:
 *
 *   deterministic scoring (final)
 *     -> canonical immutable report object
 *     -> controlled AI narrative (read-only projection only)
 *     -> stored canonical record
 *
 * The AI step receives ONLY the read-only projection. It has no access to the
 * scoring result, to raw answers, or to any storage handle, so there is no code
 * path through which it could alter an authoritative value.
 */

export interface GenerateReportResult {
  report: CanonicalReport;
  /** Outcome of the narrative step, for evidence and diagnostics. */
  narrative: NarrativeOutcome;
}

export async function generateReport(
  assessmentId: string,
  answers: Record<string, unknown>,
  options: {
    transport?: NarrativeTransport;
    config?: AiNarrativeConfig;
    scoringOverride?: ScoringResult;
    now?: Date;
  } = {},
): Promise<GenerateReportResult> {
  const config = options.config ?? {
    ...DEFAULT_AI_CONFIG,
    provider: process.env.AI_NARRATIVE_PROVIDER ??
      (process.env.OPENAI_API_KEY ? "openai" : "unconfigured"),
    model: process.env.AI_NARRATIVE_MODEL ?? "unconfigured",
  };
  const transport = options.transport ?? createOpenAiTransport();

  // 1. Deterministic scoring is finalised FIRST and is the sole authority.
  const scoring = options.scoringOverride ?? calculateScores(answers);

  // 2. Canonical object is built from the frozen scoring snapshot.
  const baseReport = buildCanonicalReport({
    assessmentId,
    scoring,
    answers,
    narrative: null,
    now: options.now,
  });

  // 3. Narrative is attempted against the read-only projection only.
  if (!transport) {
    return {
      report: applyFallback(
        baseReport,
        "No narrative transport configured.",
        config,
      ),
      narrative: {
        ok: false,
        code: "transport_error",
        reason: "No narrative transport configured.",
      },
    };
  }

  const outcome = await generateGovernedNarrative(
    {
      projection: buildAiProjection(scoring),
      sectionCount: baseReport.sections.length,
    },
    transport,
    config,
  );

  if (!outcome.ok) {
    return {
      report: applyFallback(baseReport, outcome.reason, config),
      narrative: outcome,
    };
  }

  // Rebuild with narrative. buildCanonicalReport ignores unknown section indexes,
  // so a model cannot introduce report structure, and the deterministic part is
  // re-derived from the same frozen scoring object (identical contentHash).
  const withNarrative = buildCanonicalReport({
    assessmentId,
    scoring,
    answers,
    narrative: { sections: outcome.sections, provenance: outcome.provenance },
    now: options.now,
  });

  return { report: withNarrative, narrative: outcome };
}

/**
 * Guard used before any report is stored or rendered. A report that fails
 * integrity is never served.
 */
export function assertReportIntegrity(report: CanonicalReport): void {
  if (!verifyReportIntegrity(report)) {
    throw new Error(
      "Canonical report integrity check failed: the deterministic content hash does not match the stored report.",
    );
  }
  if (report.sections.length !== 19) {
    throw new Error(
      `Canonical report must contain 19 governed sections; found ${report.sections.length}.`,
    );
  }
}

export { buildAiProjection };

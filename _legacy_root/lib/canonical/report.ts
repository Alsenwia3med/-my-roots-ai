import { createHash } from "node:crypto";
import {
  BIO_STATE_LABEL,
  DOMAIN_LABELS,
  DOMAIN_TIE_ORDER,
  canonicalVersionIdentity,
  type DomainId,
} from "@/lib/canonical/source";
import {
  activeProtectiveFactorIds,
  buildGovernedSections,
  buildReportLimitations,
  rankedDriverCopy,
  type ReportLimitation,
} from "@/lib/canonical/reportContent";
import type { ScoringResult } from "@/lib/scoring";

/**
 * Canonical immutable report object.
 *
 * Controlled source: C-03 Canonical Report Content & Structure.
 *
 * IMPORTANT — M3 IMPLEMENTATION STATUS
 * ------------------------------------
 * The *deterministic spine* of this object is implemented and authoritative:
 * the report identity, the frozen scoring snapshot, the seven-domain breakdown,
 * drivers, version identity and the content hash are all derived mechanically
 * from the C-02 scoring result and cannot be altered by AI or by the UI.
 *
 * The *governed narrative/content layer* (`sections`, `governedContent`,
 * `roadmap`, `protectiveFactors`) is structured but its exact section titles,
 * ordering, explanatory copy and fallback wording are controlled by
 * C-03 v1.0.1 CORRECTED, which was NOT available in this workspace at
 * implementation time. Every such field is therefore marked with
 * `governedSourceAvailable: false` and carries an explicit
 * `UNAVAILABLE:` placeholder rather than invented copy.
 *
 * Do not treat the narrative placeholders as the delivered report content.
 * They exist so that the integrity, immutability and parity guarantees can be
 * built and tested now, and so the governed copy can be dropped in later
 * without touching the deterministic spine.
 */

export const REPORT_CONTENT_SOURCE = {
  /** Controlled source that governs the report content/structure. */
  report: "C-03 v1.0.1 CORRECTED",
  /** True because the controlled C-03 v1.0.1 CORRECTED content contract is ingested. */
  governedSourceAvailable: true,
} as const;

/** The governed 19-section architecture required by C-03 (count is contractual). */
export const REPORT_SECTION_COUNT = 19;

export interface ReportSection {
  /** 1-based governed section number, 1..19. */
  index: number;
  /** Stable content identifier. Required for governed content lookup. */
  contentId: string;
  /**
   * Governed section title from C-03. While `governedSourceAvailable` is false
   * this is an explicit placeholder, never invented marketing copy.
   */
  title: string;
  /** Narrative body. Populated by the controlled AI layer or the fallback. */
  narrative: string | null;
  /** Provenance of this section's narrative. */
  narrativeSource: "deterministic" | "ai" | "fallback" | "unavailable";
  /** True when this section could not be rendered from governed content. */
  reduced: boolean;
  /** Explicit reason when `reduced` is true. Never filled with substitute copy. */
  reducedReason: string | null;
}

/** The read-only projection handed to the AI layer (see lib/ai/boundary.ts). */
export interface AiNarrativeProjection {
  versionIdentity: string;
  biologicalState: number | null;
  biologicalStateLabel: string | null;
  band: string | null;
  domains: Array<{ id: DomainId; label: string; score: number | null }>;
  drivers: string[];
  coPrimary: boolean;
  scoredDomainCount: number;
  methodologyStatement: string;
}

export interface ReportProvenance {
  questionnaireVersion: string;
  scoringVersion: string;
  reportVersion: string;
  /** AI metadata. Null when narrative came from the governed fallback. */
  ai: {
    provider: string;
    model: string;
    promptVersion: string;
    schemaVersion: string;
    contentLibraryVersion: string;
    fallbackVersion: string | null;
    /** True when the AI path timed out, failed or was rejected by governance. */
    usedFallback: boolean;
    /** Reason the narrative is not AI-generated, when applicable. */
    fallbackReason: string | null;
  } | null;
  constructedAt: string;
}

export interface CanonicalReport {
  /** Stable report identity. */
  id: string;
  report_id: string;
  participant_display: string;
  generated_at: string;
  questionnaire_version: string;
  scoring_version: string;
  report_template_version: string;
  narrative_template_version: string;
  domain_scores: Record<DomainId, number | null>;
  biological_state: number | null;
  opportunity_score: number | null;
  recovery_potential: number | null;
  confidence: number;
  drivers: string[];
  protective_factors: string[];
  limitations: ReportLimitation[];
  disclaimer_version: string;
  audit_trace_reference: string;
  /** Assessment/session this report was produced from. */
  assessmentId: string;
  /** Frozen authoritative scoring result. Never recomputed downstream. */
  scoring: ScoringResult;
  /** Governed narrative sections (19). */
  sections: ReportSection[];
  /** Deterministic textual equivalents for every visualised value (a11y). */
  numericEquivalents: Record<string, string>;
  /** Provenance of every versioned artefact used to build this report. */
  provenance: ReportProvenance;
  contentHash: string;
}

/**
 * Deterministic serialisation. Key order is fixed explicitly so that the hash
 * is stable across processes, Node versions and deployments.
 */
function canonicalise(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalise).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalise(v)}`).join(",")}}`;
}

/**
 * Hash of the authoritative deterministic result. Stable for identical inputs
 * and independent of AI narrative, render order or wall-clock time.
 */
export function computeContentHash(
  assessmentId: string,
  scoring: ScoringResult,
): string {
  return createHash("sha256")
    .update(
      canonicalise({
        assessmentId,
        versions: scoring.versions,
        versionIdentity: scoring.versionIdentity,
        domains: scoring.domains,
        coverage: scoring.coverage,
        classifications: scoring.classifications,
        biologicalState: scoring.biologicalState,
        biologicalStateLabel: scoring.biologicalStateLabel,
        biologicalStateAvailable: scoring.biologicalStateAvailable,
        opportunity: scoring.opportunity,
        recoveryPotential: scoring.recoveryPotential,
        drivers: scoring.drivers,
        coPrimary: scoring.coPrimary,
        overallScore: scoring.overallScore,
        band: scoring.band,
        scoredDomainCount: scoring.scoredDomainCount,
      }),
    )
    .digest("hex");
}

/**
 * The approved READ-ONLY projection given to the AI narrative layer.
 *
 * Governance: this projection carries no write-back path and no authoritative
 * field is mutable through it. It deliberately omits raw answers, so no
 * score-bearing value can be re-derived or injected by the model.
 */
export function buildAiProjection(
  scoring: ScoringResult,
): AiNarrativeProjection {
  return {
    versionIdentity: scoring.versionIdentity,
    biologicalState: scoring.biologicalState,
    biologicalStateLabel: scoring.biologicalStateLabel,
    band: scoring.band,
    domains: DOMAIN_TIE_ORDER.map((id) => ({
      id,
      label: DOMAIN_LABELS[id],
      score: scoring.domains[id],
    })),
    drivers: [...scoring.drivers],
    coPrimary: scoring.coPrimary,
    scoredDomainCount: scoring.scoredDomainCount,
    methodologyStatement:
      "Scores are calculated by deterministic canonical rules. Narrative text is AI-assisted and explains the calculated output; it does not determine it.",
  };
}

/** Build the fixed C-03 v1.0.1 section architecture from the canonical result. */
function buildSectionsFromSource(
  scoring: ScoringResult,
  assessmentId: string,
  generatedAt: string,
  answers?: Record<string, unknown>,
): ReportSection[] {
  return buildGovernedSections(scoring, assessmentId, generatedAt, answers);
}

/** Deterministic text/numeric equivalents for every visualised report value. */
function buildNumericEquivalents(
  scoring: ScoringResult,
): Record<string, string> {
  const equivalents: Record<string, string> = {
    biologicalState:
      scoring.biologicalState === null
        ? `${BIO_STATE_LABEL}: not available — fewer than 5 of 7 domains reached the coverage threshold.`
        : `${BIO_STATE_LABEL}: ${scoring.biologicalState} of 100 (${scoring.biologicalStateLabel}).`,
    opportunity:
      scoring.opportunity === null
        ? "Opportunity: not available."
        : `Opportunity: ${scoring.opportunity.toFixed(1)} of 100.`,
    recoveryPotential:
      scoring.recoveryPotential === null
        ? "Recovery potential: not available."
        : `Recovery potential: ${scoring.recoveryPotential.toFixed(1)} of 100.`,
    drivers: rankedDriverCopy(scoring.drivers),
    domainCount: `Scored domains: ${scoring.scoredDomainCount} of 7.`,
  };

  for (const id of DOMAIN_TIE_ORDER) {
    const value = scoring.domains[id];
    equivalents[`domain.${id}`] =
      value === null
        ? `${DOMAIN_LABELS[id]}: not enough information to score.`
        : `${DOMAIN_LABELS[id]}: ${value} of 100.`;
  }
  return equivalents;
}

export interface BuildReportInput {
  assessmentId: string;
  scoring: ScoringResult;
  /** Immutable canonical response snapshot used for C-03 section 16. */
  answers?: Record<string, unknown>;
  /** AI narrative result, or null when the governed fallback was used. */
  narrative?: {
    sections: Array<{ index: number; narrative: string }>;
    provenance: NonNullable<ReportProvenance["ai"]>;
  } | null;
  reportVersion?: string;
  now?: Date;
}

/**
 * Construct the canonical immutable report object.
 *
 * The deterministic portion is derived solely from the scoring result. The AI
 * narrative may only populate `narrative`/`narrativeSource` on existing
 * sections — it can never add, remove, reorder or retitle a section, and it
 * cannot influence `scoring`, `contentHash` or `provenance`.
 */
export function buildCanonicalReport(input: BuildReportInput): CanonicalReport {
  const { assessmentId, scoring, answers, narrative = null } = input;
  const generatedAt = (input.now ?? new Date()).toISOString();
  const reportVersion = input.reportVersion ?? REPORT_CONTENT_SOURCE.report;
  const sections = buildSectionsFromSource(scoring, assessmentId, generatedAt, answers);
  if (narrative) {
    for (const entry of narrative.sections) {
      const target = sections.find((s) => s.index === entry.index);
      // Only pre-declared governed sections can receive narrative. An unknown
      // index is ignored rather than appended: AI cannot create report structure.
      if (!target) continue;
      target.narrative = entry.narrative;
      target.narrativeSource = "ai";
    }
  }

  return {
    id: assessmentId,
    report_id: assessmentId,
    participant_display: "Participant",
    generated_at: generatedAt,
    questionnaire_version: scoring.versions.questionnaire,
    scoring_version: scoring.versions.scoring,
    report_template_version: reportVersion,
    narrative_template_version: reportVersion,
    domain_scores: { ...scoring.domains },
    biological_state: scoring.biologicalState,
    opportunity_score: scoring.opportunity,
    recovery_potential: scoring.recoveryPotential,
    confidence: scoring.confidence,
    drivers: [...scoring.drivers],
    protective_factors: activeProtectiveFactorIds(scoring),
    limitations: buildReportLimitations(scoring, Boolean(answers && Object.keys(answers).length)),
    disclaimer_version: "C-03-DISCLAIMER v1.0.1",
    audit_trace_reference: `REPORT/${assessmentId}/${scoring.versionIdentity}`,
    assessmentId,
    scoring,
    sections,
    numericEquivalents: buildNumericEquivalents(scoring),
    provenance: {
      questionnaireVersion: scoring.versions.questionnaire,
      scoringVersion: scoring.versions.scoring,
      reportVersion,
      ai: narrative ? narrative.provenance : null,
      constructedAt: generatedAt,
    },
    contentHash: computeContentHash(assessmentId, scoring),
  };
}

/** Re-derive the hash from a stored report to verify integrity. */
export function verifyReportIntegrity(report: CanonicalReport): boolean {
  return (
    report.contentHash ===
    computeContentHash(report.assessmentId, report.scoring)
  );
}

export { canonicalVersionIdentity };

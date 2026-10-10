/**
 * Canonical report JSON (C-03 §9) from a C-02 scoring result and the submitted answers.
 *
 * Pure and deterministic: the same inputs always produce the same JSON, so the stored hash
 * identifies one exact report, and the web and PDF renderings of it can be proven identical.
 * The builder only selects and fills C-03 copy; it never computes or adjusts a score. Null
 * values are shown with approved "not available" copy and an explicit limitation — never
 * imputed (RPT-02).
 */

import { getOptions, MODULES, QUESTIONS, type Question } from '../assessment/questionBank';
import type { RawAnswer } from '../assessment/validation';
import { CLASSIFICATIONS, type DomainId } from '../scoring/c02-ruleset';
import type { ScoringResult } from '../scoring/engine';
import type { NarrativeProvenance } from '../ai/provenance';
import {
  CLASSIFICATION_EXPLANATIONS,
  COPY,
  DISCLAIMER_VERSION,
  DOMAIN_DISPLAY_ORDER,
  DOMAIN_LABELS,
  DOMAIN_MEANINGS,
  EDUCATIONAL_BADGE,
  DRIVER_NOTE,
  LAB_LIBRARY,
  MICRO_ACTIONS,
  NARRATIVE_TEMPLATE_VERSION,
  PARTICIPANT_FALLBACK,
  PROTECTIVE_LABELS,
  REPORT_TEMPLATE_VERSION,
  REPORT_TITLE,
  CONFIDENCE_COMPOSITE_NOTE,
  CONFIDENCE_NOTE,
  DOMAIN_DIRECTION_NOTE,
  disclaimerGroups,
  SECTION_TITLES,
  TRIAD_NOTE,
  WHY,
} from './c03-content';
import { actionDomains, concernDomains, eligibleLabPrompts, roadmapDomains, topProtectiveFactor } from './rules';

export type SectionSource = 'template' | 'deterministic' | 'deterministic_fallback' | 'governed_narrative' | 'rules' | 'snapshot' | 'fixed';

export interface ReportItem {
  label: string;
  value?: string;
  note?: string;
}

export interface ReportSection {
  number: number;
  title: string;
  source: SectionSource;
  paragraphs: string[];
  /** Review point 4 — shown directly under the title, ahead of the section content. */
  lede?: string;
  /** Review point 3 — shown after the content, where the component values are shown. */
  footnote?: string;
  /** Review point 23 — "Why this appeared" explainability, shown last. */
  why?: string;
  items?: ReportItem[];
  bars?: { domain_id: DomainId; label: string; score: number | null; classification: string | null; color_hex: string | null }[];
  triad?: { label: string; kind: 'driver' | 'protective' | 'unavailable' }[];
  /**
   * Review point 20. `kind` comes from the controlled C-01 `scoring_eligible` field, so the
   * distinction is the specification's, not the renderer's. `freeText` marks a participant's
   * own words, which are shown verbatim and are never seen or altered by the narrative model.
   */
  modules?: {
    title: string;
    answers: { question_id: string; number: number; text: string; answer: string; kind: 'scoring' | 'context'; freeText: boolean }[];
  }[];
}

/**
 * The deterministic report: everything C-03 §9 requires, built from the scoring result alone.
 * It becomes a CanonicalReport once the narrative decision is recorded against it.
 */
export interface DeterministicReport {
  report_id: string;
  report_title: string;
  participant_display: string;
  generated_at: string;
  questionnaire_version: string;
  scoring_version: string;
  report_template_version: string;
  narrative_template_version: string;
  disclaimer_version: string;
  domain_scores: Record<DomainId, number | null>;
  biological_state: number | null;
  opportunity_score: number | null;
  recovery_potential: number | null;
  confidence: { score: number; label: string };
  drivers: string[];
  protective_factors: { id: string; label: string }[];
  limitations: { code: string; message: string }[];
  sections: ReportSection[];
  audit_trace_reference: string;
}

/**
 * What is stored, hashed and rendered. AI-06 requires the provider, model, prompt, schema,
 * content-library and fallback versions to travel with the report snapshot, so the field is
 * present on every report — including one where the narrative was never attempted.
 */
export interface CanonicalReport extends DeterministicReport {
  narrative_provenance: NarrativeProvenance;
}

export interface ReportInput {
  reportId: string;
  generatedAt: string;
  participantDisplay: string | null;
  questionnaireVersion: string;
  auditTraceReference: string;
  scoring: ScoringResult;
  protective: Record<'P1' | 'P2' | 'P3' | 'P4' | 'P5', boolean>;
  answers: Readonly<Record<string, RawAnswer>>;
}

// ------------------------------------------------------------------ helpers

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? values[key] : m));

const oneDecimal = (n: number) => n.toFixed(1);

/** "A", "A and B", "A, B and C" — so a list reads correctly at any length. */
function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** "MR+SR co-primary" -> "Metabolic Resistance™ and Sleep Recovery Index™ (co-primary)". */
export function driverName(driver: string): string {
  const co = driver.match(/^([A-Z]{2})\+([A-Z]{2}) co-primary$/);
  if (co) return `${DOMAIN_LABELS[co[1] as DomainId]} and ${DOMAIN_LABELS[co[2] as DomainId]} (co-primary)`;
  return DOMAIN_LABELS[driver as DomainId] ?? driver;
}

const LIMITATION_MESSAGES: Record<string, string> = {
  RECOVERY_CONDITION_UNAVAILABLE: 'Recovery Potential is not available because condition information was not provided.',
  RECOVERY_MEDICATION_UNAVAILABLE: 'Recovery Potential is not available because medication information was not provided.',
};

/** An answer exactly as submitted, in display labels (C-03 §4.16); technical values omitted. */
function displayAnswer(q: Question, v: RawAnswer | undefined): string {
  if (v === undefined) return 'Not answered';
  if (typeof v === 'object' && v !== null && !Array.isArray(v) && 'na' in v) return 'Not applicable';
  if (typeof v === 'object' && v !== null && !Array.isArray(v) && 'unit' in v) return `${v.value} ${v.unit === 'CM' ? 'cm' : 'in'}`;
  const options = getOptions(q);
  const label = (id: string) => options.find((o) => o.option_id === id)?.display_label ?? id;
  if (Array.isArray(v)) return v.map(label).join('; ');
  if (typeof v === 'string') return q.question_type === 'free_text' ? v : label(v);
  return String(v);
}

/** C-03 §9: "No field may contain NaN, Infinity or an undeclared enum." */
function assertFinite(value: unknown, path = 'report'): void {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`${path} is not a finite number`);
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) assertFinite(v, `${path}.${k}`);
  }
}

// ------------------------------------------------------------------ builder

export function buildReport(input: ReportInput): DeterministicReport {
  const { scoring } = input;
  const participant = input.participantDisplay?.trim() || PARTICIPANT_FALLBACK;

  const presentFactors = (['P1', 'P2', 'P3', 'P4', 'P5'] as const).filter((p) => input.protective[p]);
  const protectiveFactors = presentFactors.map((p) => ({ id: p, label: PROTECTIVE_LABELS[p] }));

  const limitations: { code: string; message: string }[] = [
    ...DOMAIN_DISPLAY_ORDER.filter((d) => scoring.domains[d] === null).map((d) => ({
      code: `DOMAIN_NOT_AVAILABLE_${d}`,
      message: `${DOMAIN_LABELS[d]}: ${COPY.domainNull}.`,
    })),
    ...scoring.limitations.map((code) => ({ code, message: LIMITATION_MESSAGES[code] ?? code })),
  ];
  if (scoring.biological_state === null) {
    limitations.push({ code: 'BIOLOGICAL_STATE_NOT_AVAILABLE', message: `ROOTS Biological State™: ${COPY.domainNull}.` });
  }

  const bsClass = scoring.biological_state === null ? null : classify(scoring.biological_state);
  // C-03 v1.0.1 §4: render exactly the deterministic driver outputs C-02 returns — zero to three
  // entries, a co-primary pair as ONE entry. Never pad the list to three, never substitute a
  // ranked-but-ineligible domain to fill layout space.
  const driverLabels = scoring.drivers.map(driverName);

  const s = (number: number, source: SectionSource, paragraphs: string[], extra: Partial<ReportSection> = {}): ReportSection => ({
    number,
    title: SECTION_TITLES[number - 1],
    source,
    paragraphs,
    ...extra,
  });

  // Review point 23 — the "Why this appeared" values, all read from the deterministic trace.
  const availableDomains = DOMAIN_DISPLAY_ORDER.filter((d) => scoring.domains[d] !== null);
  // DRV-001 eligibility, in DRV-002 rank order, read from the engine's own trace so the
  // explainability text cannot drift from the rule that produced the drivers.
  const eligibleDomains = scoring.trace.drivers.eligible;

  const sections: ReportSection[] = [
    // 1 Cover
    s(1, 'template', [REPORT_TITLE], {
      items: [
        { label: 'Participant', value: participant },
        { label: 'Report ID', value: input.reportId },
        { label: 'Generated', value: input.generatedAt },
        { label: 'Report version', value: REPORT_TEMPLATE_VERSION },
        { label: 'Boundary', value: EDUCATIONAL_BADGE },
      ],
    }),

    // 2 Executive Summary — governed narrative; approved deterministic fallback
    s(2, 'deterministic_fallback', [
      driverLabels.length === 0
        ? `Your current pattern reflects a combination of reported biological signals. ${COPY.noDriver} These results are educational and describe your answers; they do not diagnose a condition.`
        : driverLabels.length === 1
          ? fill(COPY.executiveSummarySingle, { primary_driver: driverLabels[0] })
          : fill(COPY.executiveSummaryList, { driver_list: joinList(driverLabels) }),
    ]),

    // 3 Biological State
    s(3, 'deterministic', [
      scoring.biological_state === null
        ? `ROOTS Biological State™: ${COPY.domainNull}.`
        : fill(COPY.biologicalState, { biological_state: String(scoring.biological_state), domain_classification: bsClass ?? '' }),
      COPY.biologicalStateNote,
    ], {
      why:
        scoring.biological_state === null
          ? WHY.biologicalStateNull
          : fill(WHY.biologicalState, { available_list: availableDomains.map((d) => DOMAIN_LABELS[d]).join(', ') }),
    }),

    // 4 Opportunity
    s(4, 'deterministic', [
      scoring.opportunity === null
        ? `ROOTS Opportunity Score™: ${COPY.domainNull}.`
        : fill(COPY.opportunity, { opportunity_score: oneDecimal(scoring.opportunity) }),
      COPY.opportunityNote,
    ], { why: scoring.opportunity === null ? WHY.opportunityNull : WHY.opportunity }),

    // 5 Confidence — never conceal missing/null domains
    s(
      5,
      'deterministic',
      [
        fill(COPY.confidence, {
          confidence_label: scoring.classifications.confidence.label,
          confidence_score: String(scoring.confidence),
        }),
        CONFIDENCE_NOTE,
      ],
      {
      footnote: CONFIDENCE_COMPOSITE_NOTE,
      why: fill(WHY.confidence, {
        coverage_percent: String(scoring.trace.confidence.coverage_percent),
        answer_confidence: String(scoring.trace.confidence.answer_confidence),
      }),
      items: [
        { label: 'Overall coverage', value: `${scoring.trace.confidence.coverage_percent}%` },
        { label: 'Answer confidence', value: `${scoring.trace.confidence.answer_confidence}/100` },
        {
          label: 'Consistency',
          value: scoring.trace.confidence.mean_consistency === null ? COPY.domainNull : `${Math.round(scoring.trace.confidence.mean_consistency)}/100`,
        },
        {
          label: 'Areas without enough information',
          value: DOMAIN_DISPLAY_ORDER.filter((d) => scoring.domains[d] === null).map((d) => DOMAIN_LABELS[d]).join('; ') || 'None',
        },
      ],
      },
    ),

    // 6 Key Drivers — deterministic ranking; governed explanation uses fallback
    s(6, 'deterministic', [
      driverLabels.length === 0
        ? COPY.noDriver
        : ['Primary', 'Secondary', 'Tertiary']
            .slice(0, driverLabels.length)
            .map((rank, i) => `${rank}: ${driverLabels[i]}.`)
            .join(' '),
      DRIVER_NOTE,
    ], {
      why: driverLabels.length === 0
        ? WHY.driversNone
        : fill(WHY.drivers, { eligible_list: eligibleDomains.map((d) => DOMAIN_LABELS[d]).join(', ') }),
    }),

    // 7 Seven-domain breakdown — fixed order MR, HS, SR, CH, SL, IB, BS
    s(
      7,
      'deterministic',
      DOMAIN_DISPLAY_ORDER.map((d) =>
        scoring.domains[d] === null
          ? `${DOMAIN_LABELS[d]}: ${COPY.domainNull}.`
          : fill(COPY.domainLine, {
              domain_label: DOMAIN_LABELS[d],
              domain_score: String(scoring.domains[d]),
              domain_classification: scoring.classifications.domains[d]?.label ?? '',
            }),
      ),
      {
        lede: DOMAIN_DIRECTION_NOTE,
        bars: DOMAIN_DISPLAY_ORDER.map((d) => ({
          domain_id: d,
          label: DOMAIN_LABELS[d],
          score: scoring.domains[d],
          classification: scoring.classifications.domains[d]?.label ?? null,
          color_hex: scoring.classifications.domains[d]?.color_hex ?? null,
        })),
        items: DOMAIN_DISPLAY_ORDER.map((d) => ({
          label: DOMAIN_LABELS[d],
          note: `${DOMAIN_MEANINGS[d]}${scoring.classifications.domains[d] ? ` ${CLASSIFICATION_EXPLANATIONS[scoring.classifications.domains[d]!.label]}` : ''}`,
        })),
      },
    ),

    // 8 Biological Triad — C-03 v1.0.1 §5 supersedes the fixed three-item assumption: render
    // only verified deterministic inputs — available driver output(s) plus an actually present
    // protective factor — and fall back to a reduced or Not Available state rather than
    // inventing a missing element. Relationships stay possible, never causal.
    (() => {
      const topFactor = topProtectiveFactor(input.protective);
      const elements: { label: string; kind: 'driver' | 'protective' }[] = [
        // ROOTS direction, 25 September 2026: "Do not assume that a co-primary pair represents
        // two separate output entries." Each C-02 driver OUTPUT is one element here, so a
        // co-primary pair contributes a single element naming both domains.
        ...driverLabels.slice(0, 2).map((label) => ({ label, kind: 'driver' as const })),
        ...(topFactor ? [{ label: PROTECTIVE_LABELS[topFactor].toLowerCase(), kind: 'protective' as const }] : []),
      ];

      const paragraph =
        elements.length >= 3
          ? fill(COPY.triad, {
              primary_driver: elements[0].label,
              secondary_driver: elements[1].label,
              top_protective_factor: elements[2].label,
            })
          : elements.length === 2
            ? fill(COPY.triadTwo, { first: elements[0].label, second: elements[1].label })
            : elements.length === 1
              ? fill(COPY.triadOne, { first: elements[0].label })
              : COPY.triadNone;

      return s(8, 'rules', [paragraph, TRIAD_NOTE], {
        triad: elements.length ? elements.slice(0, 3) : [{ label: COPY.domainNull, kind: 'unavailable' }],
      });
    })(),

    // 9 Future Projection — governed narrative; approved fallback
    s(9, 'deterministic_fallback', [COPY.futureProjection]),

    // 10 90-Day Roadmap — approved micro-actions only, at most one per month here
    (() => {
      const months = roadmapDomains(scoring);
      return s(10, 'rules', [], {
        items: COPY.roadmapMonths.map((title, i) => {
          const d = months[i];
          if (i === 2) return { label: title, value: 'Continue the routine from Months 1-2 that has been easiest to repeat.' };
          return d ? { label: title, value: MICRO_ACTIONS[d].action, note: MICRO_ACTIONS[d].safety } : { label: title, value: COPY.actions };
        }),
      });
    })(),

    // 11 Nutrition Priorities
    s(11, 'rules', [COPY.nutrition], {
      items: [{ label: 'Safety', value: MICRO_ACTIONS.HS.safety }],
    }),

    // 12 Action Priorities — ranked eligible micro-actions
    (() => {
      const domains = actionDomains(scoring);
      return s(12, 'rules', [COPY.actions], {
        items: domains.map((d, i) => ({
          label: `${i + 1}. ${MICRO_ACTIONS[d].action}`,
          value: MICRO_ACTIONS[d].rationale,
          note: MICRO_ACTIONS[d].safety,
        })),
      });
    })(),

    // 13 What Is Going Well — only factors actually present
    s(13, 'deterministic', [protectiveFactors.length ? COPY.goingWell : COPY.noProtective], {
      items: protectiveFactors.map((f) => ({ label: f.label })),
    }),

    // 14 Specific Concerns — no alarming medical labels; question IDs stay in the trace
    (() => {
      const domains = concernDomains(scoring);
      return s(14, 'rules', [COPY.concerns], {
        items: domains.map((d) => ({ label: DOMAIN_LABELS[d], note: CLASSIFICATION_EXPLANATIONS.Dysregulated })),
      });
    })(),

    // 15 Suggested Laboratory Discussion — optional prompts only
    s(15, 'rules', [COPY.laboratory], {
      items: eligibleLabPrompts(scoring, input.answers).map((id) => ({
        label: LAB_LIBRARY[id].discussion,
        note: LAB_LIBRARY[id].mandatoryShown ? LAB_LIBRARY[id].mandatory : undefined,
      })),
    }),

    // 16 Participant Answers — the submitted snapshot, by 13 modules
    s(16, 'snapshot', [COPY.answers, `Questionnaire version ${input.questionnaireVersion}.`], {
      modules: MODULES.map((m) => ({
        title: m.module_title,
        answers: QUESTIONS.filter((q) => q.module_id === m.module_id).map((q) => ({
          question_id: q.question_id,
          number: q.question_order,
          text: q.question_text,
          answer: displayAnswer(q, input.answers[q.question_id]),
          kind: q.scoring_eligible ? ('scoring' as const) : ('context' as const),
          freeText: q.question_type === 'free_text',
        })),
      })),
    }),

    // 17 Biological Card
    s(
      17,
      'deterministic',
      [
        fill(COPY.biologicalCard, {
          biological_state: scoring.biological_state === null ? COPY.domainNull : String(scoring.biological_state),
          opportunity_score: scoring.opportunity === null ? COPY.domainNull : oneDecimal(scoring.opportunity),
          recovery_potential: scoring.recovery_potential === null ? COPY.domainNull : oneDecimal(scoring.recovery_potential),
          confidence_label: scoring.classifications.confidence.label,
        }),
      ],
      {
        items: [
          { label: 'Drivers', value: driverLabels.length ? driverLabels.join('; ') : COPY.noDriver },
          { label: 'Versions', value: `Questionnaire ${input.questionnaireVersion} · Scoring ${scoring.scoring_version} · Report ${REPORT_TEMPLATE_VERSION} · Narrative ${NARRATIVE_TEMPLATE_VERSION} · Disclaimer ${DISCLAIMER_VERSION}` },
        ],
      },
    ),

    // 18 Final Word — governed narrative; approved fallback
    s(18, 'deterministic_fallback', [COPY.finalWord]),

    /*
     * 19 Medical and AI Disclaimer — in full, never truncated.
     *
     * Review point 27: shown as four headed groups. `disclaimerGroups()` slices the approved
     * text and refuses to return unless the slices rejoin into it exactly, so the structure
     * cannot silently drop or alter a clause. `paragraphs` stays empty because the same words
     * would otherwise appear twice.
     */
    s(19, 'fixed', [], {
      items: disclaimerGroups().map((g) => ({ label: g.heading, note: g.text })),
    }),
  ];

  const report: DeterministicReport = {
    report_id: input.reportId,
    report_title: REPORT_TITLE,
    participant_display: participant,
    generated_at: input.generatedAt,
    questionnaire_version: input.questionnaireVersion,
    scoring_version: scoring.scoring_version,
    report_template_version: REPORT_TEMPLATE_VERSION,
    narrative_template_version: NARRATIVE_TEMPLATE_VERSION,
    disclaimer_version: DISCLAIMER_VERSION,
    domain_scores: Object.fromEntries(DOMAIN_DISPLAY_ORDER.map((d) => [d, scoring.domains[d]])) as Record<DomainId, number | null>,
    biological_state: scoring.biological_state,
    opportunity_score: scoring.opportunity,
    recovery_potential: scoring.recovery_potential,
    confidence: { score: scoring.confidence, label: scoring.classifications.confidence.label },
    drivers: scoring.drivers,
    protective_factors: protectiveFactors,
    limitations,
    sections,
    audit_trace_reference: input.auditTraceReference,
  };

  assertFinite(report);
  if (report.sections.length !== 19 || report.sections.some((sec, i) => sec.number !== i + 1)) {
    throw new Error('report must contain sections 1-19 in order');
  }
  return report;
}

/** Domain-band label for Biological State: the C-02 DOMAIN bands, which C-03 §4.3 reuses. */
export function classify(value: number): string {
  const band = [...CLASSIFICATIONS.DOMAIN].sort((a, b) => b.min - a.min).find((b) => value >= b.min);
  if (!band) throw new Error(`no classification band for ${value}`);
  return band.label;
}

/**
 * Records the narrative decision on a deterministic report, producing the canonical report that
 * is stored, hashed and rendered.
 *
 * Only the three C-03 governed-narrative sections can be affected — §4.2 Executive Summary,
 * §4.9 Future Projection and §4.18 Final Word. Every other section is returned untouched, so no
 * score, classification, driver, protective factor, limitation, participant answer or disclaimer
 * can be altered by the narrative layer even in principle (AI-01, AI-03). A report generated
 * with AI and the same report generated without it differ in exactly three `paragraphs` arrays.
 *
 * Accepted narrative is marked `governed_narrative` and carries the approved disclosure, so the
 * reader can tell AI-assisted wording from deterministic calculation (AI-08). Rejected or
 * disabled narrative leaves the approved deterministic copy in place and records why
 * (C-03 §7, acceptance check RPT-07).
 *
 * Pure: no I/O, no clock, no environment. The provenance it writes is supplied by the caller.
 */

import type { CanonicalReport, DeterministicReport, ReportSection } from '../report/build';
import type { NarrativeProvenance } from './provenance';
import type { Narrative } from './schema';

/** C-03 §4.2, §4.9 and §4.18 — the only sections whose source is governed narrative. */
export const NARRATIVE_SECTIONS = { executiveSummary: 2, futureProjection: 9, finalWord: 18 } as const;

/** C-03 §4.17 — the Biological Card, which prints the version set. */
const BIOLOGICAL_CARD_SECTION = 17;

/**
 * AI-08 disclosure, in the wording ROOTS supplied in the final report review (point 26), which
 * describes the architecture exactly: narrative wording may be assisted, results never are.
 */
export const AI_DISCLOSURE =
  'AI may assist with governed narrative wording from approved inputs; all authoritative scores, classifications and drivers are produced by the deterministic engine.';

export interface NarrativeDecision {
  narrative: Narrative | null;
  provenance: NarrativeProvenance;
}

/**
 * The Biological Card prints the version set, and `buildReport` necessarily writes it before the
 * narrative decision exists — so it carries the deterministic fallback version even when a
 * governed narrative was afterwards accepted. Left alone, a delivered report states
 * `deterministic-fallback` on §17 and `governed-narrative` in its footer, which is a direct
 * contradiction about whether AI was involved. Review point 1 and point 24 both require the
 * version set on the card to be correct, so the card is rewritten to match the decision.
 */
function withNarrativeVersion(sections: ReportSection[], version: string): ReportSection[] {
  return sections.map((section) => {
    if (section.number !== BIOLOGICAL_CARD_SECTION) return section;
    const items = (section.items ?? []).map((item) =>
      item.label === 'Versions' && item.value
        ? { ...item, value: item.value.replace(/Narrative [^·]+/, `Narrative ${version} `) }
        : item,
    );
    return { ...section, items };
  });
}

export function applyNarrative(report: DeterministicReport, decision: NarrativeDecision): CanonicalReport {
  const { narrative, provenance } = decision;

  if (!narrative) {
    return {
      ...report,
      narrative_template_version: provenance.fallback_version,
      sections: withNarrativeVersion(report.sections, provenance.fallback_version),
      narrative_provenance: provenance,
    };
  }

  const replacements: Record<number, string[]> = {
    [NARRATIVE_SECTIONS.executiveSummary]: narrative.executive_summary,
    [NARRATIVE_SECTIONS.futureProjection]: narrative.future_projection,
    [NARRATIVE_SECTIONS.finalWord]: [narrative.final_word],
  };

  const sections: ReportSection[] = report.sections.map((section) => {
    const paragraphs = replacements[section.number];
    if (!paragraphs) return section;
    return {
      ...section,
      source: 'governed_narrative',
      paragraphs,
      items: [...(section.items ?? []), { label: 'AI-assisted narrative', note: AI_DISCLOSURE }],
    };
  });

  const version = `${provenance.prompt_version}-governed-narrative`;
  return {
    ...report,
    narrative_template_version: version,
    sections: withNarrativeVersion(sections, version),
    narrative_provenance: provenance,
  };
}

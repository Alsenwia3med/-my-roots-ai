/**
 * The approved example report (C-05 PUB-04; C-03 §8 "Reference Sample — All 19 Sections").
 *
 * C-05 PUB-04 requires "all 19 sections using approved sample data", and names C-03 as the
 * authority for example-report content. C-03 §8 supplies exactly that: one line of reference
 * content per section. Those lines are transcribed here and are not rewritten, extended or
 * supplemented with invented findings.
 *
 * What this replaces: the page previously showed six invented domains — Metabolic Wellness,
 * Hormonal Balance, Sleep Quality, Cellular Health, Stress Resilience, Immune Function — while
 * claiming "7 key domains", and offered "personalized recommendations", "actionable wellness
 * strategies" and "comparative wellness scores". None of those is a ROOTS-AI domain or an
 * approved claim (ROOTS review point 6).
 *
 * Versions. C-03 §8's sample prints "v1.0.0" and "Rules v1.0.0". The v1.0.1 correction §6
 * supersedes that: "Any displayed questionnaire/scoring/rules version must reflect C-01 v1.0.1 /
 * C-02 v1.0.1 as applicable. Report-template version is C-03 v1.0.1." The numerical example is
 * retained as §6 also directs; only the version labels follow the correction.
 *
 * The values below are fictional and are labelled as such on the page (C-04 /example-report:
 * "The example does not represent a real person or a clinical result").
 */

import { MODULES } from '../assessment/questionBank';
import { DOMAIN_DISPLAY_ORDER, DOMAIN_LABELS, SECTION_TITLES } from '../report/c03-content';
import type { DomainId } from '../scoring/c02-ruleset';

export interface ExampleSection {
  /** 1-19, the fixed C-03 order. */
  number: number;
  title: string;
  /** C-03 §8 reference content for this section. */
  content: string;
  /** Rendered as a labelled value rather than prose, where the section is a figure. */
  figure?: { value: string; unit?: string; label?: string };
  /** The seven-domain breakdown (section 7 only). */
  bars?: { domain_id: DomainId; label: string; score: number }[];
  /** The Triad elements (section 8 only). */
  triad?: { label: string; kind: 'driver' | 'protective' }[];
  /** Module titles for the answers snapshot (section 16 only). */
  modules?: string[];
}

/** C-03 §8 — the sample's own identifiers and figures. */
export const EXAMPLE = {
  participant: 'Sample Participant',
  reportId: 'RPT-SAMPLE-001',
  generated: '21 July 2026',
  /** Per the v1.0.1 correction §6, not the v1.0.0 label the legacy sample prints. */
  questionnaireVersion: '1.0.1',
  scoringVersion: '1.0.1',
  reportTemplateVersion: '1.0.1',
  biologicalState: 61,
  stateClassification: 'Strained',
  opportunity: '69.5',
  recovery: '63.0',
  confidence: 84,
  confidenceLabel: 'High',
  domains: { MR: 62, HS: 48, SR: 68, CH: 55, SL: 75, IB: 58, BS: 61 } as Record<DomainId, number>,
  drivers: ['Stress Load™ 75', 'Sleep Recovery Index™ 68', 'Metabolic Resistance™ 62'],
} as const;

const bars = DOMAIN_DISPLAY_ORDER.map((id) => ({ domain_id: id, label: DOMAIN_LABELS[id], score: EXAMPLE.domains[id] }));

export const EXAMPLE_SECTIONS: ExampleSection[] = [
  {
    number: 1,
    title: SECTION_TITLES[0],
    content: `${EXAMPLE.participant} • Report ${EXAMPLE.reportId} • ${EXAMPLE.generated} • v${EXAMPLE.reportTemplateVersion} • Educational — Not a Diagnosis`,
  },
  {
    number: 2,
    title: SECTION_TITLES[1],
    content:
      'Your answers suggest a multi-factor pattern led by Stress Load, Sleep Recovery and Metabolic Resistance. Current strengths include readiness for one small change and a supportive environment. Confidence is High because the assessment was complete and internally consistent.',
  },
  {
    number: 3,
    title: SECTION_TITLES[2],
    content: 'This is a questionnaire summary, not a medical risk probability.',
    figure: { value: String(EXAMPLE.biologicalState), unit: '/100', label: EXAMPLE.stateClassification },
  },
  {
    number: 4,
    title: SECTION_TITLES[3],
    content: 'A proprietary indicator of modifiable capacity suggested by the current pattern.',
    figure: { value: EXAMPLE.opportunity, unit: '/100' },
  },
  {
    number: 5,
    title: SECTION_TITLES[4],
    content: 'Complete answers, high self-confidence and consistent domain responses.',
    figure: { value: String(EXAMPLE.confidence), unit: '/100', label: EXAMPLE.confidenceLabel },
  },
  {
    number: 6,
    title: SECTION_TITLES[5],
    content: 'Stress Load 75; Sleep Recovery 68; Metabolic Resistance 62.',
  },
  {
    number: 7,
    title: SECTION_TITLES[6],
    content: 'MR 62; HS 48; SR 68; CH 55; SL 75; IB 58; BS 61.',
    bars,
  },
  {
    number: 8,
    title: SECTION_TITLES[7],
    content: 'Stress Load + Sleep Recovery + consistent meal timing as the top protective factor.',
    triad: [
      { label: 'Stress Load™', kind: 'driver' },
      { label: 'Sleep Recovery Index™', kind: 'driver' },
      { label: 'Consistent meal timing', kind: 'protective' },
    ],
  },
  {
    number: 9,
    title: SECTION_TITLES[8],
    content:
      'If unchanged, stress and sleep signals may continue to influence energy and eating patterns; this is not a prognosis.',
  },
  {
    number: 10,
    title: SECTION_TITLES[9],
    content: 'Month 1: consistent wake time. Month 2: three post-meal walks weekly. Month 3: reinforce the most sustainable routine.',
  },
  {
    number: 11,
    title: SECTION_TITLES[10],
    content: 'Use regular meals; include protein and fibre in one main meal; keep hydration consistent.',
  },
  {
    number: 12,
    title: SECTION_TITLES[11],
    content: '1) fixed wake-time window; 2) ten-minute walks; 3) two-minute daily pause; 4) plan one balanced meal.',
  },
  {
    number: 13,
    title: SECTION_TITLES[12],
    content: 'High readiness, supportive home environment and some regular meal timing.',
  },
  {
    number: 14,
    title: SECTION_TITLES[13],
    content: 'Persistent fatigue, sleep disruption or unusual thirst should be discussed with a qualified professional.',
  },
  {
    number: 15,
    title: SECTION_TITLES[14],
    content:
      'Ask whether glucose regulation, thyroid or other evaluation is appropriate for your history; ROOTS-AI™ does not order or interpret tests.',
  },
  {
    number: 16,
    title: SECTION_TITLES[15],
    // C-03 §8 for this section is an instruction rather than sample prose: "Display the
    // immutable 13-module response snapshot." The example shows the 13 modules a real report
    // organises answers by; it invents no answers to put in them.
    content: 'A real report shows every answer exactly as submitted, organised by the thirteen modules below.',
    modules: MODULES.map((m) => m.module_title),
  },
  {
    number: 17,
    title: SECTION_TITLES[16],
    content: `State ${EXAMPLE.biologicalState} • Opportunity ${EXAMPLE.opportunity} • Recovery ${EXAMPLE.recovery} • Confidence ${EXAMPLE.confidenceLabel} • Rules v${EXAMPLE.scoringVersion}.`,
  },
  {
    number: 18,
    title: SECTION_TITLES[17],
    content: 'Your answers are a starting point, not a verdict. Begin with one realistic action and observe what changes.',
  },
  {
    number: 19,
    title: SECTION_TITLES[18],
    // C-03 §8: "Display the full fixed disclaimer from Section 4.19." The page renders COPY.disclaimer.
    content: '',
  },
];

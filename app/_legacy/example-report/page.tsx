import type { Metadata } from "next";
import Link from "next/link";
import { DOMAIN_LABELS } from "@/lib/canonical/source";
import { REPORT_SECTION_TITLES } from "@/lib/canonical/reportContent";

export const metadata: Metadata = {
  title: "Example Biological Report",
  description: "Explore the 19-section ROOTS-AI report structure using fictional sample data.",
};

const sampleDomains = [
  ["MR", 62, "Strained", "Self-reported resistance to expected weight change and activity-related metabolic context."],
  ["HS", 48, "Compensating", "Hunger, craving, fullness and post-meal response patterns."],
  ["SR", 68, "Strained", "Sleep duration, continuity and perceived restoration."],
  ["CH", 55, "Strained", "Alignment of light, screen, meal and sleep timing."],
  ["SL", 75, "Dysregulated", "Perceived tension, cognitive activation and stress-linked eating."],
  ["IB", 58, "Strained", "Non-specific symptom burden; not a laboratory or clinical inflammation measure."],
  ["BS", 61, "Strained", "Perceived energy, appetite drive and resistance signals."],
] as const;

const sectionDescriptions = [
  "Report identity, versions and educational boundary.", "A concise summary of the available pattern and limitations.", "The questionnaire-level Biological State and its classification.", "A proprietary educational indicator of modifiable capacity suggested by the pattern.", "Coverage, answer confidence and consistency notes.", "The exact deterministic driver output, with no invented ranking.", "The seven domain scores in fixed canonical order.", "Verified driver and protective-factor context where available.", "Conditional language about what may remain influential if patterns continue.", "A bounded 90-day roadmap built from eligible micro-actions.", "Food-structure context without calorie or therapeutic prescriptions.", "Small, repeatable actions with rationale and safety qualifiers.", "Protective factors actually present in the answers.", "Signals that may deserve a qualified professional conversation.", "Optional clinician discussion prompts; tests are never ordered or interpreted here.", "The immutable response snapshot organised by module.", "A compact card with state, opportunity, recovery and confidence.", "A grounded closing message that keeps the participant in control.", "The full medical and AI limitation statement.",
];

export default function ExampleReportPage() {
  return <main className="marketing-page inner-page example-report-page">
    <section className="example-report-hero"><div><p className="marketing-kicker">ROOTS / EXAMPLE REPORT</p><h1>Example Biological Intelligence Report™</h1><p>This fictional preview shows how a completed assessment becomes one connected, governed report. It is not your result and cannot be used for diagnosis.</p></div><div className="example-report-badge"><span>ILLUSTRATIVE SAMPLE</span><strong>RPT-SAMPLE-001</strong><small>21 July 2026 · v1.0.1</small></div></section>
    <div className="example-report-notice" role="note"><strong>Educational — Not a Diagnosis.</strong><span>Scores describe available self-reported questionnaire patterns, not medical risk probabilities or clinical outcomes.</span></div>
    <section className="example-metrics" aria-label="Sample report summary"><div><small>Biological State</small><strong>61<em>/100</em></strong><b>Strained</b></div><div><small>Opportunity</small><strong>69.5<em>/100</em></strong><b>Modifiable capacity</b></div><div><small>Confidence</small><strong>84<em>/100</em></strong><b>High</b></div><div><small>Recovery</small><strong>63.0<em>/100</em></strong><b>Reference sample</b></div></section>
    <section className="example-report-section"><div className="example-section-heading"><div><p className="marketing-kicker">DETERMINISTIC OUTPUT</p><h2>Seven connected domains</h2></div><p>Every value has a text equivalent. Missing information is shown as missing, never replaced or guessed.</p></div><div className="example-domain-list">{sampleDomains.map(([id, score, classification, meaning]) => <article key={id}><div className="example-domain-top"><span><strong>{id}</strong> {DOMAIN_LABELS[id]}</span><b>{score}/100 · {classification}</b></div><div className="example-score-track" aria-hidden="true"><span style={{ width: `${score}%` }} /></div><p>{meaning}</p></article>)}</div></section>
    <section className="example-report-section example-drivers"><div><p className="marketing-kicker">KEY DRIVERS</p><h2>Deterministic driver outputs</h2><p className="route-lede">The highest-ranked drivers in this assessment are Stress Load 75; Sleep Recovery Index™ 68; Metabolic Resistance™ 62.</p></div><div className="example-driver-callout"><strong>Read as context, not cause.</strong><p>Driver language describes what the approved questionnaire rules surface. It does not establish why a pattern occurred or what will happen next.</p></div></section>
    <section className="example-report-section"><div className="example-section-heading"><div><p className="marketing-kicker">REPORT ARCHITECTURE</p><h2>All 19 governed sections</h2></div><p>The participant report keeps the calculation spine, explanatory content and limitations together.</p></div><div className="example-section-list">{REPORT_SECTION_TITLES.map((title, index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{sectionDescriptions[index]}</p></div></article>)}</div></section>
    <section className="example-report-cta"><div><p className="marketing-kicker">YOUR TURN</p><h2>Want to understand your own pattern?</h2><p>Complete the structured assessment to generate a private, versioned report from your own answers.</p></div><div className="form-actions"><Link href="/assessment" className="primary-button">Start your assessment</Link><Link href="/how-it-works" className="secondary-button">See how it works</Link></div></section>
  </main>;
}

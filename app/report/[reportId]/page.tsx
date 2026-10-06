"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { CanonicalReportRecord } from "@/lib/db";
import { DOMAIN_LABELS, DOMAIN_TIE_ORDER } from "@/lib/canonical/source";
import { AI_DISCLOSURE } from "@/lib/canonical/reportContent";

/**
 * Authorized interactive web report.
 *
 * M3 requirement 5: this page renders from the SAME stored canonical report
 * object as the PDF. It does NOT recalculate scores. The previous implementation
 * read answers from client-side storage and re-ran calculateScores in the browser,
 * which meant the displayed values were not the authoritative stored result and
 * could be altered by editing browser state. That path is removed.
 */

type ViewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "unauthorized" }
  | { status: "ready"; record: CanonicalReportRecord };

export default function ReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  const [state, setState] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/assessment/sessions/${reportId}/report`, { credentials: "same-origin" })
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 403) {
          setState({ status: "unauthorized" });
          return;
        }
        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          setState({ status: "error", message: detail.error ?? "The report could not be loaded." });
          return;
        }
        setState({ status: "ready", record: (await response.json()) as CanonicalReportRecord });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "The report could not be loaded." });
      });
    return () => { cancelled = true; };
  }, [reportId]);

  if (state.status === "loading") {
    return <main className="report-route route-shell route-shell-wide">
      <p className="eyebrow">ROOTS / REPORT</p>
      <h1>Preparing your report</h1>
      <div role="status" aria-live="polite"><p>Loading the report from the stored record. No score is shown until it is available.</p></div>
    </main>;
  }

  if (state.status === "unauthorized") {
    return <main className="report-route route-shell route-shell-wide">
      <p className="eyebrow">ROOTS / REPORT</p>
      <h1>This report is not available</h1>
      <p className="route-lede">This report belongs to a different session. Reports are only visible to the session that created them.</p>
      <Link href="/assessment" className="primary-button">Start your assessment</Link>
    </main>;
  }

  if (state.status === "error") {
    return <main className="report-route route-shell route-shell-wide">
      <p className="eyebrow">ROOTS / REPORT</p>
      <h1>Report unavailable</h1>
      <div className="error-state" role="alert"><span className="error-mark" aria-hidden="true">!</span><p>{state.message}</p></div>
      <Link href="/assessment" className="primary-button">Start your assessment</Link>
    </main>;
  }

  const { report } = state.record;
  const { scoring, provenance } = report;

  return <main className="report-route route-shell route-shell-wide">
    <header className="report-route-header"><div><p className="eyebrow">ROOTS / REPORT</p><h1>Your ROOTS Biological Intelligence Report™</h1><p className="route-lede">This report summarizes your submitted answers using deterministic scoring rules and governed explanatory language.</p></div><a className="secondary-button" href={`/api/assessment/sessions/${report.assessmentId}/report/pdf`}>Download report document</a></header>
    <div className="report-metadata"><span>Report ID {report.id}</span><span>{provenance.reportVersion}</span><span>Educational — Not a Diagnosis</span></div>
    <section className="report-metrics" aria-label="Deterministic report summary"><div><small>Biological State</small><strong>{scoring.biologicalState ?? "Not available"}</strong><b>{scoring.biologicalStateLabel ?? "Not available"}</b></div><div><small>Opportunity</small><strong>{scoring.opportunity === null ? "N/A" : scoring.opportunity.toFixed(1)}</strong></div><div><small>Recovery Potential</small><strong>{scoring.recoveryPotential === null ? "N/A" : scoring.recoveryPotential.toFixed(1)}</strong></div><div><small>Scored domains</small><strong>{scoring.scoredDomainCount} / 7</strong></div></section>

    <section aria-label="Text equivalents for the report values"><h2>Report values in text</h2><ul>{Object.entries(report.numericEquivalents).map(([key, text]) => <li key={key}>{text}</li>)}</ul></section>

    <section aria-label="Seven-domain breakdown"><h2>Seven-domain breakdown</h2><div className="report-domain-list">{DOMAIN_TIE_ORDER.map((id) => { const value = scoring.domains[id]; return <div key={id}><span>{DOMAIN_LABELS[id]}</span><strong>{value === null ? "Not enough information" : `${value}/100`}</strong></div>; })}</div></section>

    <section aria-label="Drivers"><h2>Key Drivers</h2><p className="report-detail">{report.numericEquivalents.drivers}</p></section>

    <div className="report-sections">{report.sections.map((section) => <article className="report-section-card" id={`report-section-${section.index}`} key={section.index}><span className="report-section-number">{String(section.index).padStart(2, "0")}</span><div><h2>{section.title}</h2>{section.narrative ? <p>{section.narrative}</p> : <p className="report-reduced">{section.reduced ? "This section is in an explicit reduced state. No substitute content has been inserted." : "No narrative is available for this section."}</p>}{section.reduced && section.reducedReason ? <small>{section.reducedReason}</small> : null}</div></article>)}</div>

    <footer className="report-boundary">
      <p>{provenance.ai ? (provenance.ai.usedFallback ? `This report uses the approved deterministic narrative library rather than AI-generated text. ${AI_DISCLOSURE}` : AI_DISCLOSURE) : `Narrative generation is disabled for this report. ${AI_DISCLOSURE}`} Educational — Not a Diagnosis.</p>
      <p>Content hash (deterministic spine): <code>{report.contentHash}</code></p>
    </footer>
 </main>;
}

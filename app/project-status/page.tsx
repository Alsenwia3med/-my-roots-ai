import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Project Status",
  description: "ROOTS-AI implementation status for M1, M2 and M3.",
};

type Milestone = {
  id: "M1" | "M2" | "M3";
  name: string;
  status: string;
  tone: "implemented" | "partial" | "open";
  summary: string;
  implemented: string[];
  evidence: Array<{ label: string; href: string }>;
  open: string[];
};

const milestones: Milestone[] = [
  {
    id: "M1",
    name: "Foundation & Acceptance Traceability",
    status: "Implemented · production evidence partial",
    tone: "partial",
    summary: "The application foundation, assessment shell, session isolation and M1 traceability package are present in the workspace.",
    implemented: ["73-question, 13-module assessment shell", "HTTP-only secure session, autosave and resume flow", "Cross-user access isolation and negative-test coverage", "M1 requirement-to-implementation traceability matrix"],
    evidence: [
      { label: "M1 traceability matrix", href: "https://github.com/souhail555/roots-ai-learning/blob/master/docs/m1/M1_REQUIREMENT_TRACEABILITY_MATRIX.md" },
      { label: "M1 documentation folder", href: "https://github.com/souhail555/roots-ai-learning/tree/master/docs/m1" },
    ],
    open: ["Production environment, Supabase/RLS and staging evidence remain external completion gates."],
  },
  {
    id: "M2",
    name: "Deterministic Assessment & Scoring",
    status: "Implemented · release verification required",
    tone: "implemented",
    summary: "The controlled assessment, validation, progress, deterministic seven-domain scoring, driver rules and version identity are implemented without AI calculation authority.",
    implemented: ["C-01/C-02 canonical structure and answer validation", "Deterministic scoring, eligibility, ranking and co-primary behavior", "30/30 Golden Tests and 31/31 security tests recorded", "Canonical and Golden verification commands wired into the project"],
    evidence: [
      { label: "M2 completion package", href: "https://github.com/souhail555/roots-ai-learning/blob/master/docs/m2/M2_COMPLETION_PACKAGE.md" },
      { label: "M2 documentation folder", href: "https://github.com/souhail555/roots-ai-learning/tree/master/docs/m2" },
    ],
    open: ["Final production deployment and environment-specific acceptance evidence must be confirmed separately."],
  },
  {
    id: "M3",
    name: "Governed Report, PDF & AI Boundary",
    status: "Implemented · external gates open",
    tone: "open",
    summary: "The 19-section governed report object, same-source web/PDF paths, deterministic fallback and AI validation boundary are implemented in the current release candidate.",
    implemented: ["Canonical 19-section report object with content integrity hash", "Authorized web report and PDF routes reading the same stored record", "Governed AI projection, validation, retry, timeout and fallback", "Consolidated M3 decision log separating implemented / source-verified / approved / open items"],
    evidence: [
      { label: "M3 decision log (consolidated)", href: "https://github.com/souhail555/roots-ai-learning/blob/master/docs/m3/M3_DECISION_LOG.md" },
      { label: "M3 implementation status", href: "https://github.com/souhail555/roots-ai-learning/blob/master/docs/m3/M3_IMPLEMENTATION_STATUS.md" },
      { label: "M3 six-item decision matrix", href: "https://github.com/souhail555/roots-ai-learning/blob/master/docs/m3/M3_SIX_ITEM_DECISION_MATRIX.md" },
      { label: "M3 point-21 content matrix", href: "https://github.com/souhail555/roots-ai-learning/blob/master/docs/m3/M3_POINT21_CONTENT_MATRIX.md" },
      { label: "M3 deployment runbook", href: "https://github.com/souhail555/roots-ai-learning/blob/master/docs/m3/M3_DEPLOYMENT_RUNBOOK.md" },
      { label: "M3 documentation folder", href: "https://github.com/souhail555/roots-ai-learning/tree/master/docs/m3" },
    ],
    open: ["Production release-candidate reference (D-01), Google OAuth end-to-end test (D-02), PDF footer version ruling (D-03), OPS-03 consent record approval (D-04), PUB-01 Figma (D-05), C-03 deferred strings (D-06) and the contrast-token ruling (D-07) all remain open. See the decision log, Part E."],
  },
];

export default function ProjectStatusPage() {
  return <main className="marketing-page inner-page project-status-page">
    <section className="page-heading project-status-heading">
      <p className="marketing-kicker">ROOTS / PROJECT STATUS</p>
      <h1>M1. M2. M3. One View.</h1>
      <p>See the implemented milestone packages, their verification evidence and the production gates that still require external approval.</p>
    </section>

    <section className="project-status-intro" aria-label="Status boundary">
      <strong>Implementation evidence, not a formal acceptance certificate.</strong>
      <span>The deterministic scientific engine remains authoritative. This page does not claim medical, legal or regulatory certification.</span>
    </section>

    <section className="milestone-grid" aria-label="ROOTS-AI milestones">
      {milestones.map((milestone) => <article className={`milestone-card milestone-${milestone.tone}`} key={milestone.id}>
        <div className="milestone-card-head"><span className="milestone-id">{milestone.id}</span><span className={`milestone-status ${milestone.tone}`}>{milestone.status}</span></div>
        <h2>{milestone.name}</h2>
        <p className="milestone-summary">{milestone.summary}</p>
        <div className="milestone-block"><h3>Implemented / present</h3><ul>{milestone.implemented.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="milestone-block"><h3>Evidence</h3><div className="milestone-links">{milestone.evidence.map((item) => <a href={item.href} key={item.href} target="_blank" rel="noreferrer">{item.label} ↗</a>)}</div></div>
        <div className="milestone-open"><h3>Open gates</h3><ul>{milestone.open.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </article>)}
    </section>

    <section className="project-status-footer-note"><h2>Verification commands</h2><p>Run <code>npm run test:canonical</code>, <code>npm run test:golden</code>, <code>npm run test:report</code>, <code>npm run test:ai</code>, <code>npm run test:security</code> and <code>npm run test:e2e</code> to reproduce the retained implementation evidence.</p><div className="form-actions"><Link className="primary-button" href="/assessment">Start assessment</Link><Link className="secondary-button" href="/example-report">View example report</Link></div></section>
  </main>;
}


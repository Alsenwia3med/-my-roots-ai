import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How ROOTS-AI™ Works",
  description: "See how deterministic scoring and governed AI-assisted explanations create your report.",
};

const steps = [
  "Complete the 73-question assessment.",
  "Validation normalizes approved responses and preserves N/A.",
  "Deterministic rules calculate seven domains and derived indicators.",
  "C-02 v1.0.1 deterministic rules select driver outputs, confidence and eligible content; no website or AI layer may independently recalculate or replace them.",
  "Governed AI may express only C-02/C-03-approved explanation objects in clear language; it cannot change scores, classifications, drivers, null states or report structure.",
  "The web and PDF reports render from the same immutable report record.",
];

export default function HowItWorksPage() {
  return (
    <main className="marketing-page inner-page method-page">
      <section className="page-heading">
        <p className="marketing-kicker">ROOTS / HOW IT WORKS</p>
        <h1>From Answers to Biological Intelligence</h1>
        <p>ROOTS-AI™ follows a controlled sequence so that interpretation never replaces the underlying data.</p>
      </section>

      <section className="method-sequence">
        <div className="pub-shell">
          <p className="method-sequence-label">Six steps</p>
          <h2 className="method-sequence-heading">The controlled sequence</h2>
          <ol className="method-sequence-list">
            {steps.map((step, index) => (
              <li key={step}>
                <span className="method-sequence-number">{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="info-section-grid method-ai-grid">
        <article className="method-ai-do">
          <h2>What AI does</h2>
          <p>An AI language model may assist only in expressing approved information clearly.</p>
        </article>
        <article className="method-ai-does-not">
          <h2>What AI does not do</h2>
          <p>The model is not permitted to calculate or change scores, classifications, drivers or null states; diagnose disease; prescribe treatment; interpret laboratory results; or invent participant facts.</p>
        </article>
      </section>

      <section className="info-section-grid method-privacy-grid">
        <article>
          <h2>Privacy</h2>
          <p>Private by design — controlled access, versioning and audit.</p>
        </article>
      </section>

      <div className="center-actions">
        <Link href="/assessment" className="primary-button">Start Your Assessment</Link>
        <Link href="/example-report" className="secondary-button">View Example Report</Link>
      </div>
    </main>
  );
}

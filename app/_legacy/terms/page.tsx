import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Terms of Service" };

const sections: Array<[string, string]> = [
  ["Agreement and eligibility", "By accessing ROOTS-AI™, you agree to these Terms and the Privacy Notice. You must be at least 18 years old for the production launch unless a separately approved minor workflow applies. Do not use the service if you cannot lawfully agree."],
  ["Educational service", "ROOTS-AI™ provides educational wellness information from self-reported answers. It is not a medical device, healthcare provider, diagnostic service, clinical assessment, prognosis or emergency service."],
  ["No medical reliance", "Do not use ROOTS-AI™ to diagnose, treat or prevent disease, make medication decisions, delay professional care or respond to an emergency. Seek qualified professional advice for medical concerns."],
  ["Your information", "Provide information you are authorized to submit and that reasonably reflects your experience. You are responsible for reviewing your submitted answers and protecting access to your email and Magic Link."],
  ["Reports and scores", "Scores are proprietary questionnaire indicators. They are not clinically validated probabilities of disease, future outcomes or treatment response. Reports may contain AI-assisted wording governed by deterministic outputs and fixed safety rules."],
  ["Acceptable use", "Do not bypass security, access another person’s data, scrape the service, introduce malware, reverse engineer confidential scoring logic, misuse reports for employment or insurance decisions, or represent output as a diagnosis."],
  ["Intellectual property", "ROOTS-AI™ software, content, scoring methods, prompts, designs and trademarks belong to ROOTS AI HEALTH SYSTEMS, Inc. or its licensors. Personal use of your own report is permitted; no other licence is granted."],
  ["Availability and beta", "The service may change, pause or contain beta limitations. We may correct errors, suspend unsafe activity and preserve historical report versions. Future capabilities marked Coming Soon are not part of the current service."],
  ["Disclaimers", "To the extent permitted by law, the service is provided without a guarantee of uninterrupted availability, fitness for a clinical purpose or a particular health or weight outcome. Nothing excludes rights that cannot lawfully be excluded."],
  ["Limitation", "To the extent permitted by law, ROOTS-AI™ is not liable for decisions made by treating educational output as medical advice, indirect loss or loss caused by unauthorized account access outside our reasonable control. Applicable consumer rights remain unaffected."],
  ["Suspension and termination", "You may stop using the service. We may suspend access for security, unlawful use or material breach. Data handling after termination follows the Privacy Notice and retention schedule."],
  ["Governing framework", "The governing-law and forum text for production is a jurisdiction-controlled deployment variable and must be legally approved for each launch market before that market is enabled. Until that approved jurisdiction-specific text is configured, this clause must not be presented as a final governing-law selection. Mandatory consumer and data-protection rights continue to apply."],
  ["Contact and changes", "Questions may be submitted through the Contact page. The current version and effective date appear on this page. Continued use after a notified change constitutes acceptance where permitted by law."],
  ["Production approval", "Final production deployment requires jurisdiction-specific legal review and approval, including the governing-law/forum block, before each launch market is enabled."],
];

export default function TermsPage() {
  return <LegalPage eyebrow="ROOTS / TERMS" title="Terms of Service" intro="These terms describe the conditions for using the ROOTS-AI™ educational assessment and reporting service." sections={sections.map(([title, text]) => ({ title, text }))} relatedLinks={[{ label: "Privacy Notice", href: "/privacy" }, { label: "Medical Disclaimer", href: "/medical-disclaimer" }, { label: "AI Disclaimer", href: "/ai-disclaimer" }]} />;
}

import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "AI Disclaimer" };

export default function AiDisclaimerPage() {
  return <LegalPage
    eyebrow="ROOTS / LEGAL"
    title="AI Disclaimer"
    variant="article"
    callout="The model is not permitted to calculate or change scores, classifications, drivers or null states; diagnose disease; prescribe treatment; interpret laboratory results; or invent participant facts."
    relatedHeading="Related notices"
    showIntro={false}
    sections={[{
      title: "",
      text: "ROOTS-AI™ uses the approved C-02 v1.0.1 deterministic rules to calculate questionnaire scores, classifications, driver outputs, data-quality indicators and eligible content. C-03 v1.0.1 governs report structure, null states and approved explanation objects. An AI language model may assist only in expressing approved information clearly. The model is not permitted to calculate or change scores, classifications, drivers or null states; diagnose disease; prescribe treatment; interpret laboratory results; or invent participant facts. AI-assisted text can be incomplete or imperfect; fixed validation, logging and fallback rules are applied. Review the underlying answers and limitations, and consult a qualified professional for medical decisions.",
    }]}
    relatedLinks={[{ label: "Medical Disclaimer", href: "/medical-disclaimer" }, { label: "Privacy", href: "/privacy" }]}
  />;
}

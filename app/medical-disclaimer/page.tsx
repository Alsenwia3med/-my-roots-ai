import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Medical Disclaimer" };

export default function MedicalDisclaimerPage() {
  return <LegalPage
    eyebrow="ROOTS / LEGAL"
    title="Medical Disclaimer"
    variant="article"
    intro="ROOTS-AI™ provides educational wellness information based primarily on self-reported answers. It is not a medical device, doctor, healthcare provider, diagnostic test, clinical risk assessment, prognosis or treatment service."
    sections={[{
      title: "",
      text: "ROOTS-AI™ provides educational wellness information based primarily on self-reported answers. It is not a medical device, doctor, healthcare provider, diagnostic test, clinical risk assessment, prognosis or treatment service. It does not establish a clinician-patient relationship and does not replace medical history, examination, laboratory testing or professional judgment. Do not start, stop or change medication, supplements, diet, exercise or treatment because of a ROOTS-AI™ report without appropriate professional advice. Questionnaire scores are proprietary indicators and are not validated probabilities of disease or future outcomes. Persistent, severe, sudden or worsening symptoms require appropriate professional evaluation. If you believe you may be in immediate danger, contact local emergency services.",
    }, {
      title: "In an emergency",
      text: "If you believe you may be in immediate danger, contact local emergency services.",
    }]}
    relatedHeading="Related notices"
    relatedLinks={[{ label: "Terms of Service", href: "/terms" }, { label: "AI Disclaimer", href: "/ai-disclaimer" }]}
  />;
}

import type { Metadata } from "next";
import InfoPage from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Join the ROOTS-AI™ Free Beta",
  description: "The ROOTS-AI™ free beta explores whether a structured, non-diagnostic assessment helps people understand self-reported patterns.",
};

export default function PilotPage() {
  return <InfoPage
    eyebrow="ROOTS / FREE BETA"
    intro="The beta explores whether a structured, non-diagnostic assessment can help people understand self-reported patterns involving weight resistance, energy, sleep, stress and appetite."
    groups={[
      { title: "What participation includes", items: [
        { title: "The assessment.", text: "Answer 73 questions across 13 short modules. Most people finish in about 10–12 minutes. You can save, pause and resume securely." },
        { title: "No payment.", text: "No payment is required for the approved beta cohort." },
        { title: "Educational, not medical care.", text: "The report is educational and is not medical care." },
      ] },
      { title: "Privacy and consent", items: [
        { title: "Voluntary.", text: "Participation is voluntary and may be withdrawn according to the Privacy Notice." },
        { title: "Separate research consent.", text: "Beta feedback may be used to improve usability; research use requires separate explicit consent." },
      ] },
    ]}
    sections={[{ title: "Eligibility", text: "Eligibility: adults aged 18 or older unless a separately approved local workflow applies." }]}
  />;
}

import type { Metadata } from "next";
import InfoPage from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "ROOTS-AI™ Research",
  description: "Ethical pilots, separate research consent and minimized data use.",
};

export default function ResearchPage() {
  return <InfoPage
    eyebrow="ROOTS / RESEARCH"
    title="Building Biological Intelligence Responsibly"
    intro="ROOTS-AI™ is designed to support ethical pilot studies and de-identified research under separate consent, data minimization and documented governance."
    groups={[
      { title: "Principles", items: [
        { title: "Separate consent.", text: "Service consent and research consent are separate." },
        { title: "Minimized data.", text: "Pseudonymized data is not described as anonymous unless the methodology supports that claim." },
      ] },
      { title: "Pilot information", items: [
        { title: "Limitations.", text: "Pilot findings will be reported with limitations; questionnaire scores are not clinical endpoints unless separately validated." },
      ] },
    ]}
    sections={[{ title: "Boundary", text: "Research export excludes direct identifiers and report narratives." }]}
  />;
}

import type { Metadata } from "next";
import InfoPage from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "A Transparent Educational Report for Better Conversations",
  description: "How participants and professionals can use a governed educational biological report.",
};

export default function HealthcareProfessionalsPage() {
  return <InfoPage
    eyebrow="ROOTS / FOR PROFESSIONALS"
    intro="ROOTS-AI™ helps participants organize self-reported patterns before discussing persistent concerns with a qualified professional. It does not replace clinical history, examination, diagnosis or care."
    groups={[
      { title: "Use cases", items: [
        { title: "See the answers.", text: "See the exact answers behind each score." },
        { title: "Review confidence.", text: "Review data completeness and confidence." },
      ] },
      { title: "What the report shows", items: [
        { title: "Deterministic vs. AI.", text: "Distinguish deterministic calculation from AI-assisted wording." },
        { title: "Optional prompts.", text: "Use suggested laboratory discussions only as optional conversation prompts." },
      ] },
    ]}
    sections={[{ title: "Evidence boundary", text: "Questionnaire scores are proprietary indicators and are not validated probabilities of disease or future outcomes." }]}
  />;
}

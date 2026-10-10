import type { Metadata } from "next";
import InfoPage from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "About ROOTS-AI™",
  description: "Medicine Before Symptoms™ — structured biological intelligence with visible limitations.",
};

export default function AboutPage() {
  return <InfoPage
    eyebrow="ROOTS / ABOUT"
    title="Medicine Before Symptoms™"
    intro="ROOTS-AI™ was created around a simple idea: biology often adapts long before a diagnosis is made. Our role is not to label disease, but to help people see patterns earlier, ask better questions and choose realistic next steps."
    groups={[{ title: "Mission and method", items: [
      { title: "Mission:", text: "make complex biological patterns understandable without turning an educational tool into a diagnosis." },
      { title: "Method:", text: "structured data, deterministic rules, governed language and visible limitations." },
    ] }]}
    sections={[
      { title: "Framework", text: "Seven biological domains — one connected view." },
      { title: "Company", text: "ROOTS AI HEALTH SYSTEMS, Inc., Delaware, USA." },
      { title: "Safety", text: "Educational, not diagnostic — designed to support informed conversations and realistic next steps." },
    ]}
  />;
}

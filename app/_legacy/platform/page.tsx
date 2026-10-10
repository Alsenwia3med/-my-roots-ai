import type { Metadata } from "next";
import InfoPage from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "ROOTS-AI™ Platform",
  description: "Assessment and governed reporting now; deeper biological layers coming later.",
};

const available = [
  { title: "Assessment and governed report engine.", text: "Available now in Phase 1: the structured assessment and the governed report engine." },
] as const;

const upcoming = [
  { title: "Laboratory data integration.", text: "Coming Soon — laboratory data integration." },
  { title: "DNA and epigenetic insights.", text: "Coming Soon — DNA and epigenetic insights." },
  { title: "Microbiome analysis.", text: "Coming Soon — microbiome analysis." },
  { title: "Wearable integrations.", text: "Coming Soon — wearable integrations." },
  { title: "ROOTS Biological Twin™.", text: "Coming Soon — the ROOTS Biological Twin™." },
] as const;

export default function PlatformPage() {
  return <InfoPage
    eyebrow="ROOTS / PLATFORM"
    title="One Foundation. Deeper Layers Over Time."
    intro="Phase 1 delivers the assessment and governed report engine. Future layers will expand biological context only after separate validation, governance and implementation."
    groups={[
      { title: "Available now", items: available },
      { title: "Coming soon", items: upcoming },
    ]}
    sections={[{ title: "One connected system", text: "Seven biological domains — one connected view." }]}
  />;
}

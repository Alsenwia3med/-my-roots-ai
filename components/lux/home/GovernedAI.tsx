"use client";

import { useRef, type CSSProperties } from "react";
import { Microscope, CircleHelp, UserRoundCheck, BrainCircuit, type LucideIcon } from "lucide-react";
import { IconTile } from "../Icon";

type Principle = { n: string; title: string; text: string };

/* Copy is the homepage's own, unchanged. */
const PRINCIPLES: Principle[] = [
  {
    n: "01",
    title: "Evidence Has the First Word",
    text: "Before AI explains, underlying information must be considered within its scientific context. Plausibility is not proof. Association is not causation.",
  },
  {
    n: "02",
    title: "Uncertainty Is Information",
    text: "Missing evidence should not become an invented conclusion. A system that recognizes what it cannot establish is more useful than one that pretends to know everything.",
  },
  {
    n: "03",
    title: "Every Insight Needs a Foundation",
    text: "Meaningful interpretations should be traceable to information, evidence, and governed logic supporting them.",
  },
  {
    n: "04",
    title: "Boundaries Are Part of Intelligence",
    text: "AI assistance must operate within defined scientific, safety, and clinical limits.",
  },
  {
    n: "05",
    title: "Humans Remain the Authority",
    text: "AI can help people understand complex information. It cannot replace the responsibility, context, and judgment of qualified healthcare professionals.",
  },
];

const TENET_ICONS: LucideIcon[] = [Microscope, CircleHelp, UserRoundCheck];
const TENETS = ["Evidence before explanation.", "Uncertainty without disguise.", "Human authority without compromise."];

const d = (i: number) => ({ "--d": `${i * 90}ms` }) as CSSProperties;

/** Homepage · Governed AI Intelligence — five compact cards; the one you reach for grows and its edge lights up. */
export default function GovernedAI() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="lx lxg"
      aria-labelledby="lxg-title"
      onPointerMove={(e) => {
        const s = sectionRef.current;
        if (!s) return;
        const r = s.getBoundingClientRect();
        s.style.setProperty("--sx", `${e.clientX - r.left}px`);
        s.style.setProperty("--sy", `${e.clientY - r.top}px`);
      }}
    >
      <div className="lx-wrap">
        <header className="lxs-head">
          <div data-reveal="">
            <p className="lx-kicker">Governed AI Intelligence</p>
            <h2 id="lxg-title" className="lx-h2">
              <span className="lx-grad">Powerful AI. Governed by Science.</span>
            </h2>
          </div>
          <div className="lxg-lede" data-reveal="" style={d(1)}>
            <p className="lx-lede">
              <strong>Not every AI-generated answer deserves to become a health decision.</strong>{" "}
              <span className="lx-nowrap">ROOTS-AI™</span> combines structured biological intelligence with evidence-aware
              reasoning, traceable decisions, and defined safety boundaries.
            </p>
            <ul className="lxg-triad">
              <li>
                <IconTile icon={BrainCircuit} size={30} />
                <span>AI supports understanding.</span>
              </li>
              <li>
                <IconTile icon={Microscope} size={30} />
                <span>Evidence sets the boundaries.</span>
              </li>
              <li>
                <IconTile icon={UserRoundCheck} size={30} />
                <span>Humans retain authority.</span>
              </li>
            </ul>
          </div>
        </header>

        <div className="lxg-rowlabel" data-reveal="">
          <p className="lx-kicker lx-kicker--plain">FIVE PRINCIPLES. NO SHORTCUTS.</p>
          <span aria-hidden="true" />
        </div>

        <ol className="lxg-pillars" data-reveal="">
          {PRINCIPLES.map((p) => (
            <li key={p.n} className="lxg-pillar">
              <span className="lxg-pn">{p.n}</span>
              <h3 className="lxg-ph">{p.title}</h3>
              <p className="lxg-pp">{p.text}</p>
            </li>
          ))}
        </ol>

        <div className="lxg-frame" data-reveal="">
          <span className="lxg-frame-orb" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div className="lxg-frame-grid">
            <h3 className="lxg-frame-title">
              <span>We Are Not Building AI to Replace Clinical Judgment.</span>{" "}
              <span>We Are Building Intelligence That Respects It.</span>
            </h3>
            <p className="lxg-frame-lead">The Future Needs More Than Powerful AI. It Needs Accountable Intelligence.</p>
          </div>
          <ul className="lxg-tenets">
            {TENETS.map((t, i) => {
              const Glyph = TENET_ICONS[i];
              return (
                <li key={t}>
                  <Glyph size={20} strokeWidth={2} aria-hidden="true" />
                  <span>{t}</span>
                </li>
              );
            })}
          </ul>
          <p className="lxg-sign">ROOTS-AI™ | Medicine Before Symptoms™</p>
        </div>
      </div>
    </section>
  );
}

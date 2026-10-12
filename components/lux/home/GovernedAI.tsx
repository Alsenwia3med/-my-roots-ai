import type { CSSProperties } from "react";
import { Microscope, CircleHelp, Waypoints, ShieldCheck, UserRoundCheck, type LucideIcon } from "lucide-react";
import { IconTile } from "../Icon";

type Principle = { n: string; title: string; text: string; icon: LucideIcon };

/* Copy is the homepage's own, unchanged; only the glyphs are new. */
const PRINCIPLES: Principle[] = [
  {
    n: "01",
    title: "Evidence Has the First Word",
    text: "Before AI explains, underlying information must be considered within its scientific context. Plausibility is not proof. Association is not causation.",
    icon: Microscope,
  },
  {
    n: "02",
    title: "Uncertainty Is Information",
    text: "Missing evidence should not become an invented conclusion. A system that recognizes what it cannot establish is more useful than one that pretends to know everything.",
    icon: CircleHelp,
  },
  {
    n: "03",
    title: "Every Insight Needs a Foundation",
    text: "Meaningful interpretations should be traceable to information, evidence, and governed logic supporting them.",
    icon: Waypoints,
  },
  {
    n: "04",
    title: "Boundaries Are Part of Intelligence",
    text: "AI assistance must operate within defined scientific, safety, and clinical limits.",
    icon: ShieldCheck,
  },
  {
    n: "05",
    title: "Humans Remain the Authority",
    text: "AI can help people understand complex information. It cannot replace the responsibility, context, and judgment of qualified healthcare professionals.",
    icon: UserRoundCheck,
  },
];

const TENETS = ["Evidence before explanation.", "Uncertainty without disguise.", "Human authority without compromise."];

const d = (i: number) => ({ "--d": `${i * 90}ms` }) as CSSProperties;

/** Homepage · Governed AI Intelligence — five principles and the human-authority statement. */
export default function GovernedAI() {
  return (
    <section className="lx lxg" aria-labelledby="lxg-title">
      <div className="lx-wrap">
        <header className="lxs-head">
          <div data-reveal="">
            <p className="lx-kicker">Governed AI Intelligence</p>
            <h2 id="lxg-title" className="lx-h2">
              <span className="lx-grad">Powerful AI. Governed by Science.</span>
            </h2>
          </div>
          <p className="lx-lede lxs-lede" data-reveal="" style={d(1)}>
            <strong>Not every AI-generated answer deserves to become a health decision.</strong>{" "}
            <span className="lx-nowrap">ROOTS-AI™</span> combines structured biological intelligence with evidence-aware
            reasoning, traceable decisions, and defined safety boundaries. AI supports understanding. Evidence sets the
            boundaries. Humans retain authority.
          </p>
        </header>

        <div className="lxg-rowlabel" data-reveal="">
          <p className="lx-kicker lx-kicker--plain">FIVE PRINCIPLES. NO SHORTCUTS.</p>
          <span aria-hidden="true" />
        </div>

        <ol className="lxg-principles">
          {PRINCIPLES.map((p, i) => (
            <li key={p.n} className="lx-card lxg-card" data-tilt="6" data-reveal="" style={d(i)}>
              <div className="lxg-card-top">
                <IconTile icon={p.icon} />
                <span className="lxg-num">{p.n}</span>
              </div>
              <h3 className="lx-h3">{p.title}</h3>
              <p className="lx-text">{p.text}</p>
              <span className="lxg-card-glow" aria-hidden="true" />
            </li>
          ))}
        </ol>

        <div className="lx-deep lxg-frame lx-on-deep" data-reveal="scale">
          <span className="lxg-frame-line" aria-hidden="true" />
          <div className="lxg-frame-grid">
            <h3 className="lxg-frame-title">
              <span>We Are Not Building AI to Replace Clinical Judgment.</span>{" "}
              <span>We Are Building Intelligence That Respects It.</span>
            </h3>
            <div>
              <p className="lxg-frame-lead">The Future Needs More Than Powerful AI. It Needs Accountable Intelligence.</p>
              <ul className="lxg-tenets">
                {TENETS.map((t, i) => (
                  <li key={t} style={d(i + 2)} data-reveal="">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="lxg-sign">ROOTS-AI™ | Medicine Before Symptoms™</p>
        </div>
      </div>
    </section>
  );
}

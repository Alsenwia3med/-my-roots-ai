import type { CSSProperties } from "react";
import {
  BrainCircuit,
  ClipboardList,
  Combine,
  Hospital,
  Pill,
  Stethoscope,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { IconTile } from "../Icon";

type Stage = { n: string; title: string; text: string; icon: LucideIcon };

/* Copy is the homepage's own, unchanged; only the glyphs are new. */
const STAGES: Stage[] = [
  {
    n: "01",
    title: "Mini Version Assessment Intelligence",
    text: "The foundation of ROOTS-AI™. Structured biological assessments designed to help individuals better understand patterns across interconnected areas of health, supported by evidence-informed, non-diagnostic insights.",
    icon: ClipboardList,
  },
  {
    n: "02",
    title: "Human Systems + Biological Measurement Foundation",
    text: "Moving beyond a single assessment toward understanding biological change over time. Connecting personal health information, biological measurements, and longitudinal patterns.",
    icon: Activity,
  },
  {
    n: "03",
    title: "Human System Reconciliation™ v1",
    text: "Bringing different dimensions of human biology into a more connected perspective. Integration of advanced biological information, molecular insights, and a governed wellness ecosystem.",
    icon: Combine,
  },
  {
    n: "04",
    title: "Therapeutic & Multimorbidity Intelligence",
    text: "Exploring relationships between multiple health conditions, therapeutic approaches, and individual responses while preserving professional clinical judgment.",
    icon: Pill,
  },
  {
    n: "05",
    title: "Cross-Specialty & Clinical Continuity",
    text: "Connecting relevant health information across medical specialties for greater continuity, collaboration, and multidisciplinary care.",
    icon: Stethoscope,
  },
  {
    n: "06",
    title: "Hospital-Wide Human System Intelligence",
    text: "Extending connected health intelligence across care settings for coordinated information and responsible institutional decision-making.",
    icon: Hospital,
  },
  {
    n: "07",
    title: "Advanced Human System Intelligence",
    text: "Advanced biological modeling and predictive intelligence, supporting earlier understanding and more informed healthcare decisions.",
    icon: BrainCircuit,
  },
];

const d = (i: number) => ({ "--d": `${(i % 3) * 110}ms` }) as CSSProperties;

/* keeps the brand name on one line wherever the copy wraps */
const BRAND = "ROOTS-AI™";
const withBrand = (text: string) =>
  text.split(BRAND).flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <span key={i} className="lx-nowrap">
            {BRAND}
          </span>,
          part,
        ],
  );

/** Homepage · The Seven Stages of ROOTS-AI™ — a deep cinematic panel with a lit path through the stages. */
export default function Roadmap() {
  return (
    <section className="lx lxrm" aria-labelledby="lxrm-title">
      <div className="lx-deep lxrm-panel lx-on-deep">
        <div className="lx-wrap">
          <header className="lxs-head">
            <div data-reveal="">
              <p className="lx-kicker">The Seven Stages of ROOTS-AI™</p>
              <h2 id="lxrm-title" className="lx-h2">
                <span className="lx-grad-light">Seven Stages. One Connected Vision of Human Health.</span>
              </h2>
            </div>
            <p className="lx-lede lxs-lede" data-reveal="" style={{ "--d": "100ms" } as CSSProperties}>
              From Understanding Biology Before Disease to Advanced Human Systems Intelligence. Human health is not a
              collection of isolated systems. It is a continuous interaction between biology, environment, behavior, and
              time.
            </p>
          </header>

          <ol className="lxrm-stages" data-progress="">
            <span className="lxrm-path" aria-hidden="true">
              <span />
            </span>
            {STAGES.map((s, i) => (
              <li
                key={s.n}
                className={`lx-card lx-card--deep lxrm-stage${i === STAGES.length - 1 ? " lxrm-stage--wide" : ""}`}
                data-tilt="6"
                data-reveal=""
                style={d(i)}
              >
                <div className="lxrm-step">
                  <IconTile icon={s.icon} tone="glass" />
                  <span className="lxrm-label">STAGE {s.n}</span>
                  <span className="lxrm-rule" aria-hidden="true" />
                  <span className="lxrm-ghost" aria-hidden="true">
                    {s.n}
                  </span>
                </div>
                <h3 className="lx-h3">{s.title}</h3>
                <p className="lx-text">{withBrand(s.text)}</p>
              </li>
            ))}
          </ol>

          <div className="lxrm-close" data-reveal="">
            <h3 className="lxrm-close-title">One Principle Across Every Stage: Governance Is Built Into the Foundation.</h3>
            <p className="lxrm-close-text">
              <span>Assessment Is the Entry Point.</span> <span>Human Systems Intelligence Is the Destination.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

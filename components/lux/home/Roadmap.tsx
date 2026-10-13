import { Fragment, type CSSProperties } from "react";
import {
  BrainCircuit,
  ClipboardList,
  Combine,
  Hospital,
  Pill,
  Stethoscope,
  Activity,
  Lock,
  LockOpen,
  type LucideIcon,
} from "lucide-react";
import { IconTile } from "../Icon";
import RoadmapClose from "./RoadmapClose";

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

/**
 * Homepage · The Seven Stages of ROOTS-AI™ — seven boxes, in order. Stage 01 is open and lit;
 * stages 02–07 are locked blueprints that unlock under the pointer; the last is the destination.
 */
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

          <ol className="st-grid">
            {STAGES.map((st, i) => (
              <li
                key={st.n}
                className={`st ${i === 0 ? "st--live" : "st--next"}${i === STAGES.length - 1 ? " st--end" : ""} st-${i + 1}`}
                data-reveal=""
                style={{ "--d": `${(i % 3) * 90}ms` } as CSSProperties}
                tabIndex={0}
              >
                <span className="st-sheen" aria-hidden="true" />
                <span className="st-ghost" aria-hidden="true">
                  {st.n}
                </span>
                <div className="st-top">
                  <IconTile icon={st.icon} tone="glass" size={i === 0 || i === STAGES.length - 1 ? 46 : 40} />
                  <span className="st-label">STAGE {st.n}</span>
                  <span className="st-rule" aria-hidden="true" />
                  {i === 0 ? (
                    <span className="st-live" aria-hidden="true" />
                  ) : (
                    <span className="st-lock" aria-hidden="true">
                      <Lock className="st-lock-c" strokeWidth={2} />
                      <LockOpen className="st-lock-o" strokeWidth={2} />
                    </span>
                  )}
                </div>
                <h3 className="st-h3">{st.title}</h3>
                <p className="st-p">{withBrand(st.text)}</p>
                <div className="st-prog" aria-hidden="true">
                  {STAGES.map((p, k) => (
                    <Fragment key={p.n}>
                      <i className={`${k === 0 ? "done" : ""}${k === i ? " here" : ""}`} />
                    </Fragment>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <RoadmapClose />
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import Scene3D from "./Scene3D";
import { Biosignal, HudLens } from "./Instruments";
import type { SceneVariant } from "./three/scenes";

export interface HeroCta {
  label: string;
  href: string;
}

/**
 * The opening section every inner page shares: white canvas, kicker, gradient title, intro and
 * calls to action on the left; the page's own 3D object on the right.
 */
export default function PageHero({
  kicker,
  title,
  intro,
  ctas = [],
  scene,
  children,
}: {
  kicker: string;
  title: string;
  intro?: ReactNode;
  ctas?: readonly HeroCta[];
  scene: SceneVariant;
  children?: ReactNode;
}) {
  return (
    <section className="lxp-hero">
      <div className="lxp-hero-grid lx-wrap">
        <div className="lxp-hero-copy">
          <p className="lx-kicker" data-reveal="" style={{ ["--d" as string]: "0ms" }}>
            {kicker}
          </p>
          <h1 className="lx-h1 lxp-title" data-reveal="" style={{ ["--d" as string]: "90ms" }}>
            <span className="lx-grad">{title}</span>
          </h1>
          {intro ? (
            typeof intro === "string" ? (
              <p className="lx-lede" data-reveal="" style={{ ["--d" as string]: "180ms" }}>
                {intro}
              </p>
            ) : (
              <div className="lx-lede lxp-lede-rich" data-reveal="" style={{ ["--d" as string]: "180ms" }}>
                {intro}
              </div>
            )
          ) : null}
          {children ? (
            <div className="lxp-hero-extra" data-reveal="" style={{ ["--d" as string]: "240ms" }}>
              {children}
            </div>
          ) : null}
          {ctas.length ? (
            <div className="lx-actions lxp-hero-actions" data-reveal="" style={{ ["--d" as string]: "280ms" }}>
              {ctas.map((cta, i) => (
                <Link
                  key={cta.href + cta.label}
                  href={cta.href}
                  className={`lx-btn ${i === 0 ? "lx-btn--primary" : "lx-btn--secondary"}`}
                  data-magnetic=""
                >
                  <span>{cta.label}</span>
                  {i === 0 ? <ArrowRight className="lx-arrow" size={17} strokeWidth={2} aria-hidden="true" /> : null}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <div className="lxp-hero-visual" data-reveal="scale" style={{ ["--d" as string]: "120ms" }}>
          <span className="lxp-aura" aria-hidden="true" />
          <HudLens />
          <Scene3D variant={scene} />
        </div>
      </div>
      <Biosignal className="lxp-signal" />
    </section>
  );
}

"use client";

import { useCallback, useRef } from "react";
import Scene3D from "../Scene3D";
import type { Anchor } from "../three/scenes";

/* The same seven domain chips the previous console showed, now riding the 3D satellites. */
const CHIPS = [
  { code: "MR", name: "Metabolic" },
  { code: "HS", name: "Hunger" },
  { code: "SR", name: "Sleep" },
  { code: "CH", name: "Circadian" },
  { code: "SL", name: "Stress" },
  { code: "IB", name: "Inflammation" },
  { code: "BS", name: "Safety" },
];

/**
 * Homepage hero object: a living biological core in real 3D. Every label the previous console
 * carried is kept — the readout sits on the nucleus, the seven domain chips follow their
 * orbiting satellites, and the three glass cards float around the object.
 */
export default function HeroCore() {
  const chipRefs = useRef<Array<HTMLDivElement | null>>([]);
  const readoutRef = useRef<HTMLDivElement>(null);

  const onAnchors = useCallback((anchors: Anchor[]) => {
    const centre = anchors[CHIPS.length];
    if (centre && readoutRef.current) {
      readoutRef.current.style.transform = `translate3d(${centre.x.toFixed(1)}px, ${centre.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    }
    anchors.slice(0, CHIPS.length).forEach((a, i) => {
      const el = chipRefs.current[i];
      if (!el) return;
      const near = Math.min(1, Math.max(0, a.depth));
      el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0) translate(-50%, -150%) scale(${(0.86 + near * 0.18).toFixed(3)})`;
      el.style.opacity = (0.55 + near * 0.45).toFixed(3);
      el.style.zIndex = String(Math.round(near * 10) + 2);
    });
  }, []);

  return (
    <div className="lxhc">
      <Scene3D variant="core" className="lxhc-scene" onAnchors={onAnchors}>
        <div className="lxhc-chips" aria-hidden="true">
          {CHIPS.map((c, i) => (
            <div
              key={c.code}
              className={`lxhc-chip${i === 0 ? " on" : ""}`}
              ref={(el) => {
                chipRefs.current[i] = el;
              }}
            >
              <span className="lxhc-chip-code">{c.code}</span>
              <span className="lxhc-chip-name">{c.name}</span>
            </div>
          ))}
        </div>
      </Scene3D>

      <div className="lxhc-top">
        <span className="lxhc-label">Interactive 7-domain orbital</span>
        <span className="lxhc-pill">
          <span className="lxhc-dot" aria-hidden="true" />
          <span>Governed v1.0</span>
        </span>
      </div>

      <div className="lxhc-readout" ref={readoutRef}>
        <div className="lxhc-state">
          <span>BIOLOGICAL</span>
          <span>STATE</span>
        </div>
        <div className="lxhc-score">
          <span className="lxhc-num">61</span>
          <span className="lxhc-of">/ 100</span>
        </div>
        <div className="lxhc-class">STRAINED</div>
      </div>

      <div className="lxhc-card lxhc-card--rules" data-tilt="6">
        <span className="lxhc-engine" aria-hidden="true">
          <span />
        </span>
        <span className="lxhc-card-title">Deterministic Rules Engine</span>
      </div>

      <div className="lxhc-card lxhc-card--mr" data-tilt="6">
        <div className="lxhc-mr-head">
          <span className="lxhc-code">MR</span>
          <span className="lxhc-mr-title">Metabolic Resistance™</span>
        </div>
        <p>Self-reported resistance to expected weight change and activity-related metabolic context.</p>
      </div>

      <div className="lxhc-card lxhc-card--stats" data-tilt="6">
        <div>
          <div className="lxhc-big">7</div>
          <div className="lxhc-small">Connected Domains</div>
          <div className="lxhc-units" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} style={{ animationDelay: `${i * 90}ms` }} />
            ))}
          </div>
        </div>
        <div className="lxhc-split">
          <div className="lxhc-big">21</div>
          <div className="lxhc-small">Governed Tokens</div>
          <div className="lxhc-units lxhc-units--grid" aria-hidden="true">
            {Array.from({ length: 21 }, (_, i) => (
              <span key={i} style={{ animationDelay: `${i * 40}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

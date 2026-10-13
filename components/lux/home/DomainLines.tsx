"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Line = { x1: number; y1: number; x2: number; y2: number };

/**
 * Hairlines from the core to each domain, for the wide layout where the domains sit in a grid.
 * They run centre to centre and sit beneath the core and the cards, so only the stretch between
 * the two shows — and they stay joined to a card however far it drifts.
 */
export default function DomainLines() {
  const ref = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState<{ w: number; h: number; lines: Line[] }>({ w: 0, h: 0, lines: [] });

  useEffect(() => {
    const svg = ref.current;
    const stage = svg?.parentElement;
    if (!svg || !stage) return;
    const measure = () => {
      const core = stage.querySelector<HTMLElement>(".core");
      if (!core || getComputedStyle(stage).display !== "grid") {
        setBox({ w: 0, h: 0, lines: [] });
        return;
      }
      const cx = core.offsetLeft + core.offsetWidth / 2;
      const cy = core.offsetTop + core.offsetHeight / 2;
      const lines = Array.from(stage.querySelectorAll<HTMLElement>(".dc")).map((el) => ({
        x1: cx,
        y1: cy,
        x2: el.offsetLeft + el.offsetWidth / 2,
        y2: el.offsetTop + el.offsetHeight / 2,
      }));
      setBox({ w: stage.clientWidth, h: stage.clientHeight, lines });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  return (
    <svg ref={ref} className="dlines" width={box.w} height={box.h} viewBox={`0 0 ${box.w || 1} ${box.h || 1}`} aria-hidden="true">
      {box.lines.map((l, i) => (
        <line key={i} className="dline" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} style={{ "--i": i } as CSSProperties} />
      ))}
    </svg>
  );
}

"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Line = { x1: number; y1: number; x2: number; y2: number };

/* the order the domains are born in: the right column first, top to bottom, then the one below, then the left column from the bottom up */
const ORDER = [6, 5, 4, 3, 0, 1, 2];

/**
 * Hairlines from the core to each domain, for the wide layout where the domains sit in a grid.
 * They run centre to centre and sit beneath the core and the cards, so only the stretch between
 * the two shows — and they stay joined to a card however far it drifts.
 */
export default function DomainLines() {
  const ref = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState<{ w: number; h: number; lines: Line[] }>({ w: 0, h: 0, lines: [] });

  /* the field is "in" while it is on screen: the domains come out of the core when it arrives and
     slip back into it when it leaves, every time */
  useEffect(() => {
    const stage = ref.current?.parentElement;
    if (!stage) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || typeof IntersectionObserver === "undefined") {
      stage.setAttribute("data-in", "");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.18) stage.setAttribute("data-in", "");
        else if (entry.intersectionRatio < 0.04) stage.removeAttribute("data-in");
      },
      { threshold: [0, 0.04, 0.18, 0.4] },
    );
    io.observe(stage);
    return () => {
      io.disconnect();
      stage.removeAttribute("data-in");
    };
  }, []);

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
      /* each domain is born at the core: its birth path starts at the core's centre */
      stage.querySelectorAll<HTMLElement>(".dc").forEach((el) => {
        el.style.setProperty("--fx", `${cx - (el.offsetLeft + el.offsetWidth / 2)}px`);
        el.style.setProperty("--fy", `${cy - (el.offsetTop + el.offsetHeight / 2)}px`);
      });
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
        <line key={i} className="dline" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} style={{ "--i": i, "--ord": ORDER[i] ?? i } as CSSProperties} />
      ))}
    </svg>
  );
}

"use client";

import { useEffect, useState } from "react";

/* the same curve the bar grows on: cubic-bezier(.6, 0, .2, 1) */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const dx = sx(t) - x;
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(dx) < 1e-4 || !d) break;
      t -= dx / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}
const ease = bezier(0.6, 0, 0.2, 1);

/** A number that starts at zero and runs up to its value when `play` turns true, in step with its bar. */
export default function CountStat({ to, play, delay = 300, duration = 1700 }: { to: number; play: boolean; delay?: number; duration?: number }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!play) {
      setN(0);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / duration));
      setN(Math.round(to * ease(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, to, delay, duration]);

  return <>{n}</>;
}

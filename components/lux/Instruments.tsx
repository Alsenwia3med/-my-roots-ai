/**
 * Purely graphic instruments that give every page the feel of a precise, intelligent clinical
 * platform. None of them carries words — they frame the content, they never add to it.
 */

/** A diagnostic lens around the 3D object: tick ring, sweeping arcs, a slow scanning beam. */
export function HudLens() {
  const ticks = Array.from({ length: 72 }, (_, i) => i);
  return (
    <svg className="lx-hud" viewBox="0 0 400 400" aria-hidden="true">
      <defs>
        <linearGradient id="lx-hud-arc" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#19a7b8" stopOpacity="0" />
          <stop offset="60%" stopColor="#19a7b8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#8fe6ea" stopOpacity="1" />
        </linearGradient>
      </defs>
      <g className="lx-hud-ticks">
        {ticks.map((i) => {
          const a = (i / ticks.length) * Math.PI * 2;
          const long = i % 6 === 0;
          const r1 = long ? 182 : 186;
          const r2 = 192;
          return (
            <line
              key={i}
              x1={200 + Math.cos(a) * r1}
              y1={200 + Math.sin(a) * r1}
              x2={200 + Math.cos(a) * r2}
              y2={200 + Math.sin(a) * r2}
              strokeWidth={long ? 1.4 : 0.8}
            />
          );
        })}
      </g>
      <circle className="lx-hud-ring" cx="200" cy="200" r="170" />
      <circle className="lx-hud-ring lx-hud-ring--dash" cx="200" cy="200" r="150" />
      <g className="lx-hud-spin">
        <circle className="lx-hud-arc" cx="200" cy="200" r="170" pathLength="100" strokeDasharray="16 84" />
      </g>
      <g className="lx-hud-spin lx-hud-spin--back">
        <circle className="lx-hud-arc lx-hud-arc--soft" cx="200" cy="200" r="150" pathLength="100" strokeDasharray="9 41" />
      </g>
      <g className="lx-hud-notches">
        <path d="M200 4v12M200 384v12M4 200h12M384 200h12" />
      </g>
    </svg>
  );
}

/** A living biosignal: a fine line with a heartbeat travelling along it, used between sections. */
export function Biosignal({ className = "" }: { className?: string }) {
  const beat = "l14 0 6 -16 7 30 7 -40 6 26 5 0";
  let d = "M0 40";
  for (let x = 0; x < 1200; x += 240) d += ` h${x === 0 ? 120 : 186} ${beat}`;
  return (
    <div className={`lx-signal ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lx-signal-g" x1="0" x2="1">
            <stop offset="0%" stopColor="#19a7b8" stopOpacity="0" />
            <stop offset="20%" stopColor="#19a7b8" stopOpacity="0.55" />
            <stop offset="80%" stopColor="#19a7b8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#19a7b8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="lx-signal-base" d={d} />
        <path className="lx-signal-pulse" d={d} pathLength="100" />
      </svg>
    </div>
  );
}

/** A tiny decorative trend line for the corner of a card. */
export function Spark({ seed = 0 }: { seed?: number }) {
  const pts = Array.from({ length: 9 }, (_, i) => {
    const y = 18 - Math.round(((Math.sin(i * 1.3 + seed) + 1) / 2) * 12 + (i / 8) * 4);
    return `${i * 9},${y}`;
  }).join(" ");
  return (
    <svg className="lx-spark" viewBox="0 0 72 22" aria-hidden="true">
      <polyline points={pts} />
    </svg>
  );
}

# ROOTS-AI footer concepts: handoff for another AI

## Context
- Next.js 16 (app router, Turbopack), React, TypeScript, plain CSS. Icons: lucide-react (not needed here).
- Brand: white background, teal palette (#055564, #19a7b8, #8fe6ea), fonts via CSS vars `--lx-sans` / `--lx-mono`.
- Footer data comes from `HOME_FOOTER` in `components/lux/chrome-data.ts` (4 columns, one disclaimer note, copyright). Do not change the wording.
- Current live footer: `components/lux/LuxFooter.tsx`, mounted in `components/SiteChrome.tsx`.

## Required layout (all 6 concepts)
- Left: logo + the disclaimer note (about 4 lines). Right: the 4 link columns. Last: copyright, centred.
- No CTA button and no arrow icons.
- Links: a thin gradient underline draws under the text on hover.
- Everything is static at rest; animation happens only under the cursor (prefers-reduced-motion respected).

## The 6 concepts
1. Atelier: outline wordmark that fills with light under the cursor; other columns dim when one is hovered.
2. Salon: framed cells, cursor glow and a dot grid that only appears near the cursor.
3. Constellation: still canvas network; nodes part and link up around the cursor, then settle.
4. Horizon: static glowing horizon; ripples spread from the cursor path; numbered columns.
5. Prism: frosted panels tilt toward the cursor with a moving highlight.
6. Pearl: pearl sheen and a lit top hairline follow the cursor; numbered columns open on hover.

## Files
- `components/lux/FooterFlagship.tsx` (client component, exports FooterAtelier, FooterSalon, FooterConstellation, FooterHorizon, FooterPrism, FooterPearl)
- `app/(site)/footer-lab/footer-flagship.css`
- `app/(site)/footer-lab/page.tsx` (preview page at /footer-lab)

To use one in the site: import its component in `components/SiteChrome.tsx` in place of `<LuxFooter data={HOME_FOOTER} />`, and import `footer-flagship.css` globally (move it next to the component or into `components/lux/styles/`).

---

## components/lux/FooterFlagship.tsx
```tsx
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { HOME_FOOTER } from "./chrome-data";

/**
 * Footer concepts, "quiet luxury" pass (presentation only). Copy comes from HOME_FOOTER; no new wording.
 * Everything is still at rest and comes alive only under the cursor.
 * Layout: logo + statement on the left, link columns beside it, copyright centred last.
 */
const { columns, notes, copyright } = HOME_FOOTER;
const WORD = "ROOTS-AI";

/** Outline wordmark at rest; a second, filled copy is revealed through a soft circle that follows the cursor. */
function Wordmark({ cut = false }: { cut?: boolean }) {
  return (
    <div className={`ff-word${cut ? " ff-word--cut" : ""}`} aria-hidden="true">
      <span className="ff-word-line">{WORD}</span>
      <span className="ff-word-fill">{WORD}</span>
    </div>
  );
}

function Shell({
  id,
  decor,
  children,
  ripple = false,
  tilt = false,
}: {
  id: string;
  decor?: ReactNode;
  children?: ReactNode;
  ripple?: boolean;
  tilt?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const logo = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let lastRipple = 0;
    const clamp = (n: number) => Math.max(-1, Math.min(1, n));
    const move = (ev: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--px", `${ev.clientX - r.left}px`);
        el.style.setProperty("--py", `${ev.clientY - r.top}px`);
        el.style.setProperty("--pn", "1");
        el.querySelectorAll<HTMLElement>(".fvg-col").forEach((c) => {
          const cr = c.getBoundingClientRect();
          const inside = ev.clientX >= cr.left && ev.clientX <= cr.right && ev.clientY >= cr.top && ev.clientY <= cr.bottom;
          c.style.setProperty("--mx", `${ev.clientX - cr.left}px`);
          c.style.setProperty("--my", `${ev.clientY - cr.top}px`);
          if (tilt) {
            c.style.setProperty("--rx", inside ? `${(0.5 - (ev.clientY - cr.top) / cr.height) * 9}deg` : "0deg");
            c.style.setProperty("--ry", inside ? `${((ev.clientX - cr.left) / cr.width - 0.5) * 9}deg` : "0deg");
          }
        });
        el.querySelectorAll<HTMLElement>(".ff-word").forEach((w) => {
          const wr = w.getBoundingClientRect();
          w.style.setProperty("--wx", `${ev.clientX - wr.left}px`);
          w.style.setProperty("--wy", `${ev.clientY - wr.top}px`);
        });
        const l = logo.current;
        if (l) {
          const lr = l.getBoundingClientRect();
          const dx = clamp((ev.clientX - (lr.left + lr.width / 2)) / 280);
          const dy = clamp((ev.clientY - (lr.top + lr.height / 2)) / 280);
          l.style.transform = `perspective(600px) rotateY(${dx * 14}deg) rotateX(${-dy * 14}deg)`;
        }
        if (ripple && ev.timeStamp - lastRipple > 140) {
          lastRipple = ev.timeStamp;
          const s = document.createElement("span");
          s.className = "ff-ripple";
          s.style.left = `${ev.clientX - r.left}px`;
          s.style.top = `${ev.clientY - r.top}px`;
          s.addEventListener("animationend", () => s.remove());
          el.appendChild(s);
        }
      });
    };
    const leave = () => {
      el.style.setProperty("--pn", "0");
      if (logo.current) logo.current.style.transform = "";
      el.querySelectorAll<HTMLElement>(".fvg-col").forEach((c) => {
        c.style.setProperty("--rx", "0deg");
        c.style.setProperty("--ry", "0deg");
      });
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [ripple, tilt]);

  return (
    <footer ref={root} className={`ff ${id}`}>
      {decor}
      <div className="ff-wrap">
        <div className="fvm">
          <div className="fvl">
            <Link ref={logo} href="/" aria-label="ROOTS-AI home" className="ff-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/roots-logo.svg" alt="ROOTS-AI Biological Intelligence" height={84} style={{ height: 84, width: "auto" }} />
            </Link>
            <p className="fvl-note">{notes[0]}</p>
          </div>
          <nav className="fvg" aria-label="Footer">
            {columns.map((c, i) => (
              <div key={c.title} className="fvg-col" style={{ "--n": i + 1 } as CSSProperties}>
                <h3>{c.title}</h3>
                <ul>
                  {c.links.map(([label, href]) => (
                    <li key={label}>
                      <Link className="ff-link" href={href}>
                        <span>{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        {children}
        <div className="fvc">{copyright}</div>
      </div>
    </footer>
  );
}

/* 1 - ATELIER: hairline columns, the outline wordmark fills with light where the cursor passes */
export function FooterAtelier() {
  return (
    <Shell id="ff1">
      <Wordmark cut />
    </Shell>
  );
}

/* 2 - SALON: framed cells that glow under the cursor over a dot grid that only appears near it */
export function FooterSalon() {
  return (
    <Shell
      id="ff2"
      decor={
        <>
          <span className="ff2-dots" aria-hidden="true" />
          <span className="ff2-halo" aria-hidden="true" />
        </>
      }
    />
  );
}

/* 3 - CONSTELLATION: a still network; nodes part and link up around the cursor, then settle */
function Constellation() {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = cv.current;
    const host = canvas?.closest("footer") as HTMLElement | null;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    const mouse = { x: -999, y: -999 };
    type N = { hx: number; hy: number; x: number; y: number; r: number };
    let nodes: N[] = [];
    let edges: [number, number][] = [];
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const R = 150;
    const L = 120;
    const build = () => {
      const step = w < 700 ? 64 : 84;
      nodes = [];
      for (let y = step / 2; y < h; y += step)
        for (let x = step / 2; x < w; x += step) {
          const hx = x + (rnd() - 0.5) * step * 0.7;
          const hy = y + (rnd() - 0.5) * step * 0.7;
          nodes.push({ hx, hy, x: hx, y: hy, r: 0.9 + rnd() * 1.4 });
        }
      edges = [];
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++)
          if (Math.hypot(nodes[i].hx - nodes[j].hx, nodes[i].hy - nodes[j].hy) < L) edges.push([i, j]);
    };
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s = 7;
      build();
    };
    const frame = () => {
      let moving = false;
      for (const n of nodes) {
        let tx = n.hx;
        let ty = n.hy;
        const dx = n.hx - mouse.x;
        const dy = n.hy - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < R && d > 0.1) {
          const push = (1 - d / R) * 34;
          tx += (dx / d) * push;
          ty += (dy / d) * push;
        }
        n.x += (tx - n.x) * 0.14;
        n.y += (ty - n.y) * 0.14;
        if (Math.abs(tx - n.x) + Math.abs(ty - n.y) > 0.15) moving = true;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (const [i, j] of edges) {
        const a = nodes[i];
        const b = nodes[j];
        const md = Math.hypot((a.x + b.x) / 2 - mouse.x, (a.y + b.y) / 2 - mouse.y);
        const boost = md < R * 1.5 ? (1 - md / (R * 1.5)) * 0.55 : 0;
        ctx.strokeStyle = `rgba(25,167,184,${0.1 + boost})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const n of nodes) {
        const md = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        const t = md < R ? 1 - md / R : 0;
        ctx.fillStyle = `rgba(${Math.round(25 - 20 * t)},${Math.round(167 - 82 * t)},${Math.round(184 - 84 * t)},${0.4 + t * 0.55})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + t * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (moving || mouse.x > -900) raf = requestAnimationFrame(frame);
      else running = false;
    };
    const wake = () => {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    fit();
    frame();
    running = false;
    const ro = new ResizeObserver(() => {
      fit();
      frame();
      running = false;
    });
    ro.observe(host);
    const mv = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      wake();
    };
    const lv = () => {
      mouse.x = mouse.y = -999;
      wake();
    };
    host.addEventListener("pointermove", mv);
    host.addEventListener("pointerleave", lv);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", mv);
      host.removeEventListener("pointerleave", lv);
    };
  }, []);
  return <canvas ref={cv} className="ff3-canvas" aria-hidden="true" />;
}

export function FooterConstellation() {
  return <Shell id="ff3" decor={<Constellation />} />;
}

/* 4 - HORIZON: a still glowing horizon; ripples spread from wherever the cursor travels */
export function FooterHorizon() {
  return (
    <Shell
      ripple
      id="ff4"
      decor={
        <div className="ff4-horizon" aria-hidden="true">
          <i className="glow" />
          <i className="arc" />
        </div>
      }
    />
  );
}

/* 5 - PRISM: frosted panels lean toward the cursor with a moving specular highlight */
export function FooterPrism() {
  return (
    <Shell
      tilt
      id="ff5"
      decor={<span className="ff5-wash" aria-hidden="true" />}
    />
  );
}

/* 6 - PEARL: a pearl-white sheen and a lit hairline follow the cursor; numbered columns open up on hover */
export function FooterPearl() {
  return (
    <Shell
      id="ff6"
      decor={
        <>
          <span className="ff6-sheen" aria-hidden="true" />
          <span className="ff6-edge" aria-hidden="true" />
        </>
      }
    />
  );
}
```

## app/(site)/footer-lab/footer-flagship.css
```css
/* Footer concepts, quiet-luxury pass. White ground, ROOTS teal. Still at rest; alive only under the cursor. */

.fvlab { background: #fff; }
.fvlab-head { padding: clamp(110px, 12vw, 150px) var(--lx-pad-x, 24px) 32px; text-align: center; }
.fvlab-head h1 { margin: 0 0 8px; font-size: clamp(28px, 4vw, 44px); font-weight: 300; letter-spacing: -0.02em; color: var(--lx-ink, #06323b); }
.fvlab-head p { margin: 0; color: var(--lx-soft, #5b7c83); }
.fvlab-item { margin-top: 56px; }
.fvlab-label { display: flex; gap: 16px; align-items: baseline; justify-content: center; flex-wrap: wrap; padding: 0 20px 14px; font-family: var(--lx-mono); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--lx-teal, #055564); }
.fvlab-label span { text-transform: none; letter-spacing: 0; font-family: var(--lx-sans); font-size: 14px; color: var(--lx-soft, #5b7c83); }

/* ---------- shared ---------- */
.ff {
  --c-teal: #055564; --c-teal2: #0a7385; --c-cyan: #19a7b8; --c-neon: #8fe6ea;
  --c-ink: #06323b; --c-body: #2c5963; --c-soft: #5b7c83; --c-line: rgba(5, 85, 100, .13);
  --spring: cubic-bezier(.3, 1.35, .4, 1); --ease: cubic-bezier(.22, .8, .22, 1);
  --px: 50%; --py: 50%; --pn: 0;
  position: relative; isolation: isolate; overflow: hidden; background: #fff; color: var(--c-ink);
  font-family: var(--lx-sans, system-ui, sans-serif); border-top: 1px solid var(--c-line);
}
.ff *, .ff *::before, .ff *::after { box-sizing: border-box; }
.ff-wrap { position: relative; max-width: 1320px; margin: 0 auto; padding: clamp(56px, 6vw, 92px) clamp(20px, 4.4vw, 64px) 0; }

.fvm { display: grid; grid-template-columns: minmax(0, 470px) minmax(0, 1fr); gap: 36px clamp(36px, 6vw, 108px); align-items: start; }
.fvl-note { margin: 22px 0 0; font-size: 12.5px; font-weight: 300; line-height: 1.9; letter-spacing: .01em; color: var(--c-soft); }
.ff-logo { display: inline-flex; transition: transform .45s var(--ease), filter .6s; will-change: transform; }
.ff-logo:hover { filter: drop-shadow(0 18px 24px rgba(5, 85, 100, .26)); }
.ff-logo img { display: block; }
.ff-logo:focus-visible, .ff-link:focus-visible { outline: 2px solid var(--c-cyan); outline-offset: 3px; border-radius: 6px; }

.fvg { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0 clamp(14px, 2vw, 32px); }
.fvg-col { position: relative; padding-top: 6px; transition: opacity .5s var(--ease); }
.fvg h3 { position: relative; margin: 0 0 14px; padding-bottom: 14px; font-family: var(--lx-mono); font-size: 11px; font-weight: 500; letter-spacing: .2em; text-transform: uppercase; color: var(--c-teal); transition: letter-spacing .7s var(--ease); }
.fvg h3::after { content: ""; position: absolute; left: 0; bottom: 0; height: 1px; width: 22px; background: var(--c-cyan); transition: width .8s var(--ease); }
.fvg-col:hover h3::after { width: 64px; }
.fvg ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; }
.ff-link { display: inline-flex; align-items: center; min-height: 34px; padding-block: 4px; color: var(--c-body); font-size: 14px; font-weight: 300; letter-spacing: .01em; line-height: 1.35; text-decoration: none; transition: color .4s, transform .6s var(--ease); }
.ff-link span { position: relative; display: inline-block; padding-bottom: 3px; }
.ff-link span::after { content: ""; position: absolute; left: 0; bottom: 0; height: 1px; width: 0; background: linear-gradient(90deg, var(--c-cyan), rgba(143, 230, 234, 0)); transition: width .7s var(--ease); }
.ff-link:hover { color: var(--c-ink); transform: translateX(4px); }
.ff-link:hover span::after, .ff-link:focus-visible span::after { width: 55%; }

.fvc { position: relative; z-index: 1; padding: 26px 0 32px; text-align: center; font-family: var(--lx-mono); font-size: 11px; letter-spacing: .08em; color: var(--c-soft); }
.fvc::before { content: ""; display: block; width: 34px; height: 1px; margin: 0 auto 14px; background: var(--c-cyan); opacity: .7; }

/* wordmark: thin outline at rest, filled through a soft circle that follows the cursor */
.ff-word { position: relative; display: grid; justify-items: center; margin: clamp(24px, 3vw, 48px) 0 0; font-size: clamp(48px, 13vw, 188px); font-weight: 200; letter-spacing: -.045em; line-height: .86; white-space: nowrap; user-select: none; pointer-events: none; --wx: 50%; --wy: 50%; }
.ff-word > span { grid-area: 1 / 1; }
.ff-word-line { color: transparent; -webkit-text-stroke: 1px rgba(5, 85, 100, .22); }
.ff-word-fill { background: linear-gradient(100deg, #032a33, #055564 45%, #19a7b8); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-mask-image: radial-gradient(230px circle at var(--wx) var(--wy), #000, transparent 72%); mask-image: radial-gradient(230px circle at var(--wx) var(--wy), #000, transparent 72%); opacity: var(--pn); transition: opacity .6s var(--ease); }
.ff-word--cut { margin-bottom: calc(clamp(48px, 13vw, 188px) * -.14); -webkit-mask-image: linear-gradient(180deg, #000 55%, transparent 100%); mask-image: linear-gradient(180deg, #000 55%, transparent 100%); }

/* ---------- 1 ATELIER ---------- */
.ff1 .fvg:hover .fvg-col:not(:hover) { opacity: .42; }
.ff1 .fvg-col:hover h3 { letter-spacing: .28em; }
.ff1 .fvm { padding-bottom: 36px; border-bottom: 1px solid var(--c-line); }
.ff1 .fvc { background: linear-gradient(0deg, #fff 35%, rgba(255, 255, 255, 0)); padding-top: 30px; }

/* ---------- 2 SALON ---------- */
.ff2-dots { position: absolute; inset: 0; z-index: -2; background-image: radial-gradient(rgba(5, 85, 100, .22) 1px, transparent 1px); background-size: 24px 24px; opacity: var(--pn); -webkit-mask-image: radial-gradient(250px circle at var(--px) var(--py), #000, transparent 70%); mask-image: radial-gradient(250px circle at var(--px) var(--py), #000, transparent 70%); transition: opacity .6s; }
.ff2-halo { position: absolute; inset: 0; z-index: -1; background: radial-gradient(380px circle at var(--px) var(--py), rgba(143, 230, 234, .3), transparent 70%); opacity: var(--pn); transition: opacity .6s; }
.ff2 .fvg { border: 1px solid var(--c-line); border-radius: 24px; background: rgba(255, 255, 255, .65); overflow: hidden; gap: 0; }
.ff2 .fvg-col { padding: 26px 26px 18px; border-left: 1px solid var(--c-line); }
.ff2 .fvg-col:first-child { border-left: 0; }
.ff2 .fvg-col::before { content: ""; position: absolute; inset: 0; background: radial-gradient(260px circle at var(--mx, -999px) var(--my, -999px), rgba(25, 167, 184, .17), transparent 70%); opacity: 0; transition: opacity .5s; pointer-events: none; }
.ff2 .fvg-col:hover::before { opacity: 1; }
.ff2 .fvc { padding-top: 40px; }

/* ---------- 3 CONSTELLATION ---------- */
.ff3-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; -webkit-mask-image: linear-gradient(180deg, transparent, #000 25%); mask-image: linear-gradient(180deg, transparent, #000 25%); }
.ff3 .fvc { padding-top: 60px; }

/* ---------- 4 HORIZON ---------- */
.ff4-horizon { position: absolute; left: 50%; bottom: 0; translate: -50% 0; width: min(1500px, 140%); aspect-ratio: 2 / 1; max-height: 380px; z-index: -1; pointer-events: none; overflow: hidden; -webkit-mask-image: linear-gradient(0deg, #000 55%, transparent 100%); mask-image: linear-gradient(0deg, #000 55%, transparent 100%); }
.ff4-horizon i { position: absolute; left: 50%; top: 100%; border-radius: 50%; translate: -50% -50%; }
.ff4-horizon .glow { width: 80%; aspect-ratio: 1; background: radial-gradient(circle, rgba(143, 230, 234, .5) 0%, rgba(25, 167, 184, .12) 45%, transparent 68%); }
.ff4-horizon .arc { width: 78%; aspect-ratio: 1; background: radial-gradient(circle, transparent 69.4%, rgba(25, 167, 184, .6) 69.9%, rgba(143, 230, 234, .22) 71%, transparent 74%); }
.ff-ripple { position: absolute; z-index: -1; width: 24px; height: 24px; margin: -12px 0 0 -12px; border-radius: 50%; border: 1px solid rgba(25, 167, 184, .55); background: radial-gradient(circle, rgba(143, 230, 234, .18), transparent 70%); pointer-events: none; animation: ripple 1.8s var(--ease) forwards; }
@keyframes ripple { to { transform: scale(16); opacity: 0; } }
.ff4 .fvg { counter-reset: col; }
.ff4 .fvg-col { counter-increment: col; }
.ff4 .fvg-col h3::before { content: "0" counter(col); display: block; margin-bottom: 10px; font-family: var(--lx-sans); font-size: 28px; font-weight: 200; letter-spacing: -.02em; background: linear-gradient(160deg, var(--c-cyan), var(--c-teal)); -webkit-background-clip: text; background-clip: text; color: transparent; transition: transform .6s var(--spring); transform-origin: left; }
.ff4 .fvg-col:hover h3::before { transform: translateX(6px) scale(1.08); }
.ff4 .fvc { padding-top: 130px; color: var(--c-teal); }

/* ---------- 5 PRISM ---------- */
.ff5-wash { position: absolute; inset: 0; z-index: -1; background: radial-gradient(70% 90% at 12% 0%, #eefafa, transparent 70%), radial-gradient(60% 80% at 100% 100%, #f1fbfa, transparent 70%); }
.ff5 .fvg { gap: 18px; }
.ff5 .fvg-col { --rx: 0deg; --ry: 0deg; padding: 28px 24px 18px; border-radius: 22px; background: rgba(255, 255, 255, .7); backdrop-filter: blur(14px); box-shadow: 0 0 0 1px var(--c-line), 0 24px 44px -34px rgba(5, 85, 100, .4); transform: perspective(800px) rotateX(var(--rx)) rotateY(var(--ry)); transition: transform .35s var(--ease), box-shadow .6s; overflow: hidden; }
.ff5 .fvg-col:hover { box-shadow: 0 0 0 1px rgba(25, 167, 184, .45), 0 44px 60px -34px rgba(5, 85, 100, .5); }
.ff5 .fvg-col::before { content: ""; position: absolute; inset: 0; background: radial-gradient(200px circle at var(--mx, -999px) var(--my, -999px), rgba(255, 255, 255, .95), rgba(143, 230, 234, .22) 45%, transparent 70%); opacity: 0; transition: opacity .4s; pointer-events: none; }
.ff5 .fvg-col:hover::before { opacity: 1; }
.ff5 .fvg-col > * { position: relative; }
.ff5 .fvc { padding-top: 44px; }

/* ---------- 6 PEARL ---------- */
.ff6-sheen { position: absolute; inset: 0; z-index: -1; background: radial-gradient(520px circle at var(--px) var(--py), rgba(231, 249, 250, .95), rgba(255, 255, 255, 0) 70%); opacity: var(--pn); transition: opacity .8s; }
.ff6-edge { position: absolute; left: 0; right: 0; top: 0; height: 1px; background: radial-gradient(360px 1px at var(--px) 0, var(--c-cyan), transparent); opacity: var(--pn); transition: opacity .6s; }
.ff6 .fvg { counter-reset: col; }
.ff6 .fvg-col { counter-increment: col; border-top: 1px solid var(--c-line); padding-top: 22px; }
.ff6 .fvg-col::before { content: "0" counter(col); position: absolute; top: -9px; left: 0; padding-right: 10px; background: #fff; font-family: var(--lx-mono); font-size: 10px; letter-spacing: .14em; color: var(--c-soft); transition: color .5s, transform .6s var(--ease); }
.ff6 .fvg-col:hover::before { color: var(--c-cyan); transform: translateX(6px); }
.ff6 .fvg-col::after { content: ""; position: absolute; top: -1px; left: 0; height: 1px; width: 0; background: var(--c-cyan); transition: width .9s var(--ease); }
.ff6 .fvg-col:hover::after { width: 100%; }
.ff6 .fvg-col:hover h3 { letter-spacing: .3em; }
.ff6 .fvc { padding-top: 48px; }

/* ---------- responsive ---------- */
@media (max-width: 1080px) {
  .fvm { grid-template-columns: 1fr; }
  .fvl-note { max-width: 640px; }
}
@media (max-width: 720px) {
  .fvg { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 20px; }
  .ff2 .fvg-col:nth-child(3) { border-left: 0; }
  .ff2 .fvg-col:nth-child(n + 3) { border-top: 1px solid var(--c-line); }
}
@media (max-width: 420px) { .fvg { grid-template-columns: 1fr; } .ff2 .fvg-col { border-left: 0; border-top: 1px solid var(--c-line); } .ff2 .fvg-col:first-child { border-top: 0; } }
@media (prefers-reduced-motion: reduce) {
  .ff *, .ff *::before, .ff *::after { animation: none !important; transition: none !important; }
  .ff-ripple { display: none; }
}
```

## app/(site)/footer-lab/page.tsx
```tsx
import type { Metadata } from "next";
import "./footer-flagship.css";
import {
  FooterAtelier,
  FooterSalon,
  FooterConstellation,
  FooterHorizon,
  FooterPrism,
  FooterPearl,
} from "@/components/lux/FooterFlagship";

export const metadata: Metadata = { title: "Footer concepts — ROOTS-AI™", robots: { index: false } };

const ITEMS = [
  ["01 · Atelier", "ساكن تماماً، والاسم الضخم المفرّغ يمتلئ بالضوء مكان مرور الماوس، والأعمدة الأخرى تخفت", FooterAtelier],
  ["02 · Salon", "إطار بخلايا ناعمة، وإضاءة وشبكة نقاط تظهر تحت الماوس فقط", FooterSalon],
  ["03 · Constellation", "شبكة ثابتة، عند مرور الماوس تتباعد العقد وتتصل ببعضها ثم ترجع", FooterConstellation],
  ["04 · Horizon", "أفق متوهج ثابت، وحلقات تنتشر من أي مكان يمر فيه الماوس", FooterHorizon],
  ["05 · Prism", "ألواح زجاجية تميل نحو الماوس مع لمعة تتحرك على سطحها", FooterPrism],
  ["06 · Pearl", "لمعة لؤلؤية وخط علوي مضيء يتبعان الماوس، وأعمدة مرقّمة تنفتح عند المرور", FooterPearl],
] as const;

export default function FooterLab() {
  return (
    <main id="main" className="fvlab">
      <header className="fvlab-head">
        <h1>Footer Concepts</h1>
        <p dir="rtl">كلها ساكنة، وتتحرك فقط عند مرور الماوس. حرّك الماوس فوق كل فوتر.</p>
      </header>
      {ITEMS.map(([name, desc, Comp]) => (
        <section key={name} className="fvlab-item">
          <div className="fvlab-label">
            <strong>{name}</strong>
            <span dir="rtl">{desc}</span>
          </div>
          <Comp />
        </section>
      ))}
    </main>
  );
}
```

'use client';

/**
 * The living layer of the flagship designs. All of it is presentation: it reads pointer and
 * scroll position, never page content, and it stands down entirely under reduced motion.
 *
 *   Ambient      a soft light that follows the visitor, a ring that blooms over anything
 *                clickable, a hairline reading-progress bar, and the --px / --py / --mz-scroll
 *                variables every parallax layer reads
 *   ScrollyWrap  watches which chapter is in view and turns the observatory to its node
 *   DotNav       the chapter dots of Lumière
 *   ParticleField a quiet drift of points that bend away from the pointer
 *   Switcher     flips one page between the designs
 */

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { VARIANTS, type VariantId } from './types';

const fine = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ Ambient */

export function Ambient({ cursor = true, tone = 'teal' }: { cursor?: boolean; tone?: 'teal' | 'champagne' }) {
  const glow = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const still = reduced();
    const pointer = fine();
    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let gx = tx;
    let gy = ty;
    let rx = tx;
    let ry = ty;
    let seen = false;

    const scroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      root.style.setProperty('--mz-scroll', (h > 0 ? window.scrollY / h : 0).toFixed(4));
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      root.style.setProperty('--px', (tx / window.innerWidth - 0.5).toFixed(3));
      root.style.setProperty('--py', (ty / window.innerHeight - 0.5).toFixed(3));
      if (!seen) {
        seen = true;
        glow.current?.setAttribute('data-on', 'true');
        ring.current?.setAttribute('data-on', 'true');
      }
      const hot = (e.target as Element | null)?.closest('a, button, input, textarea, label, [data-tilt]');
      ring.current?.setAttribute('data-hot', hot ? 'true' : 'false');
    };
    const frame = () => {
      gx += (tx - gx) * 0.1;
      gy += (ty - gy) * 0.1;
      rx += (tx - rx) * 0.28;
      ry += (ty - ry) * 0.28;
      if (glow.current) glow.current.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      raf = requestAnimationFrame(frame);
    };

    scroll();
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    if (!still && pointer) {
      window.addEventListener('pointermove', move, { passive: true });
      if (cursor) raf = requestAnimationFrame(frame);
    }
    return () => {
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', scroll);
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
      ['--px', '--py', '--mz-scroll'].forEach((k) => root.style.removeProperty(k));
    };
  }, [cursor]);

  return (
    <>
      <div className="mz-bar" aria-hidden="true">
        <i />
      </div>
      <div className="mz-grain" aria-hidden="true" />
      {cursor ? (
        <>
          <div ref={glow} className="mz-glow" data-tone={tone} aria-hidden="true" />
          <div ref={ring} className="mz-ring" aria-hidden="true" />
        </>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ Scrolly (Constellation) */

export function ScrollyWrap({ count, children }: { count: number; children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(1);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const panels = Array.from(el.querySelectorAll<HTMLElement>('[data-panel]'));
    if (!panels.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(Number((hit.target as HTMLElement).dataset.panel));
      },
      { rootMargin: '-30% 0px -45% 0px', threshold: [0, 0.2, 0.5, 1] },
    );
    panels.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, []);

  const node = ((active - 1) % 7) + 1;
  return (
    <div
      ref={host}
      className="cs-scrolly"
      data-active={active}
      data-node={node}
      style={{ ['--turn' as string]: `${-((active - 1) * (360 / 7)).toFixed(2)}deg`, ['--count' as string]: count } as CSSProperties}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Dot navigation (Lumière) */

export function DotNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);
  if (items.length < 3) return null;
  return (
    <nav className="lm-dots" aria-label="Sections">
      <ol>
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`} aria-current={active === it.id ? 'true' : undefined} aria-label={it.label}>
              <span className="lm-dot" aria-hidden="true" />
              <span className="lm-dot-label">{it.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ Particle field (Lumière) */

export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || reduced()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let alive = true;
    const mouse = { x: -9999, y: -9999 };
    type P = { x: number; y: number; vx: number; vy: number; r: number };
    let pts: P[] = [];
    const seed = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(28, Math.min(70, Math.round((w * h) / 24000)));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18, r: 0.8 + Math.random() * 1.6 }));
    };
    const draw = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 22000) {
          const f = (1 - d2 / 22000) * 0.9;
          p.vx += (dx / (Math.sqrt(d2) + 1)) * f * 0.06;
          p.vy += (dy / (Math.sqrt(d2) + 1)) * f * 0.06;
        }
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx + 0.02;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = dx * dx + dy * dy;
          if (d < 14000) {
            ctx.strokeStyle = `rgba(25,167,184,${(0.16 * (1 - d / 14000)).toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = 'rgba(10,115,133,0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(draw);
    };
    seed();
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', seed);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', seed);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return <canvas ref={ref} className="lm-particles" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ switcher */

export function Switcher({ slug, current, label }: { slug: string; current: VariantId; label: string }) {
  return (
    <div className="dz-switch" role="navigation" aria-label="Design options">
      <Link className="dz-switch-all" href="/design">
        All pages
      </Link>
      <span className="dz-switch-title">{label}</span>
      <div className="dz-switch-opts">
        {VARIANTS.map((v) => (
          <Link
            key={v.id}
            href={`/design/${slug}?v=${v.id}`}
            className="dz-switch-opt"
            aria-current={current === v.id ? 'true' : undefined}
            title={`${v.name} — ${v.mood}`}
            scroll={false}
          >
            <b>{v.id}</b>
            <span>{v.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Marks the page as part of the design exploration (not the published site). */
export function ExplorationFlag() {
  useEffect(() => {
    document.documentElement.setAttribute('data-design-exploration', 'true');
    return () => document.documentElement.removeAttribute('data-design-exploration');
  }, []);
  return null;
}

'use client';

/**
 * The two interactive pieces of the design exploration:
 *   RailNav   the sticky chapter list of variant 1, which follows the reader down the page;
 *   Switcher  the floating bar that flips one page between the four designs.
 * Both are presentation only.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { VARIANTS, type VariantId } from './types';

export interface RailItem {
  id: string;
  label: string;
  num: string;
}

export function RailNav({ items }: { items: RailItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    const onScroll = () => {
      const first = els[0].getBoundingClientRect().top + window.scrollY;
      const last = els[els.length - 1].getBoundingClientRect().bottom + window.scrollY;
      const y = window.scrollY + window.innerHeight * 0.35;
      setProgress(Math.min(1, Math.max(0, (y - first) / Math.max(1, last - first))));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items]);

  return (
    <nav className="dz-rail-nav" aria-label="Chapters" style={{ ['--p' as string]: progress.toFixed(4) }}>
      <span className="dz-rail-track" aria-hidden="true">
        <span />
      </span>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={active === item.id ? 'true' : undefined}>
              <span className="dz-rail-num" aria-hidden="true">
                {item.num}
              </span>
              <span className="dz-rail-label">{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

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

/** Marks the page as being in the design exploration (not part of the published site). */
export function ExplorationFlag() {
  useEffect(() => {
    document.documentElement.setAttribute('data-design-exploration', 'true');
    return () => document.documentElement.removeAttribute('data-design-exploration');
  }, []);
  return null;
}

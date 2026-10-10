'use client';

/**
 * Inner-pages motion (presentation only): a calm, staggered fade-in on scroll. Nothing else —
 * no tilt, no parallax. Setup waits for hydration (including Suspense boundaries) so server-rendered
 * nodes are never touched early. Used by SiteChrome, so the locked homepage never loads it.
 */

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const REVEAL = [
  '.pz', '.pz-sequence > li', '.info-section-grid > article',
  '.legal-contents', '.legal-article', '.legal-callout', '.legal-cta', '.legal-related',
  '.contact-form', '.contact-confirmation',
  '.example-section', '.example-contents', '.example-note', '.example-footer-boundary',
  '.blog-featured', '.blog-grid > *', '.blog-boundary', '.blog-empty', '.article-header', '.article-prose',
  '.center-actions',
  '[class*="__card"]', '[class*="__question"]', '[class*="__moduleItem"]',
].join(',');

function setup(cleanups: Array<() => void>) {
  const root = document.documentElement;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const targets = Array.from(document.querySelectorAll<HTMLElement>(REVEAL.split(',').map((s) => `.lux-body main ${s}`).join(',')));
  root.classList.add('lx-js');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).classList.add('lx-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
  );
  const seen = new Map<Element, number>();
  targets.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.95 && r.bottom > 0) return; // already on screen: stay put
    const parent = el.parentElement as Element;
    const n = seen.get(parent) ?? 0;
    seen.set(parent, n + 1);
    el.setAttribute('data-lx', '');
    el.style.setProperty('--lx-d', `${Math.min(n, 4) * 70}ms`);
    io.observe(el);
  });
  const failOpen = window.setTimeout(() => targets.forEach((el) => el.classList.add('lx-in')), 4000);
  cleanups.push(() => { io.disconnect(); window.clearTimeout(failOpen); });
}

export default function LuxuryEffects() {
  const pathname = usePathname();
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const timer = window.setTimeout(() => setup(cleanups), 700);
    return () => { window.clearTimeout(timer); cleanups.forEach((fn) => fn()); };
  }, [pathname]);
  return null;
}

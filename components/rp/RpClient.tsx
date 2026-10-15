'use client';

/**
 * Client behaviour shared by the redesigned public pages: scroll reveals, count-ups, pointer glow,
 * tilt and magnetic buttons (RpRoot), and the "Read more" intro (Copy). Presentation only.
 */

import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Copy({ intro, more }: { intro: string; more: string[] }) {
  const [open, setOpen] = useState(false);
  const all = [intro, ...more];
  const quote = all.length > 1 ? all[all.length - 1] : null;
  const body = quote ? all.slice(0, -1) : all;
  const vis = body.slice(0, 2);
  const extra = body.slice(2);
  return (
    <div className="copy">
      {vis.map((t, i) => <p key={`v${i}`}>{t}</p>)}
      {extra.length ? (
        <>
          <div className={`xm ${open ? 'open' : ''}`}>
            <div>{extra.map((t, i) => <p key={`x${i}`}>{t}</p>)}</div>
          </div>
          <button type="button" className={`rm ${open ? 'open' : ''}`} aria-label={open ? 'Show less' : 'Show more'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <ChevronDown size="1em" strokeWidth={1.7} aria-hidden="true" className="ic" />
          </button>
        </>
      ) : null}
      {quote ? <p className="quote">{quote}</p> : null}
    </div>
  );
}

export function RpRoot({ slug, children }: { slug: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanup: Array<() => void> = [];

    // Anything already on screen is marked seen before the hidden state applies, so there is no flash.
    const reveal = Array.from(root.querySelectorAll<HTMLElement>('.rv,.rvg,.zo'));
    reveal.forEach((n) => {
      const r = n.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.95 && r.bottom > 0) n.classList.add('seen');
    });
    root.classList.add('rp-ready');
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' },
    );
    reveal.forEach((n) => { if (!n.classList.contains('seen')) io.observe(n); });
    cleanup.push(() => io.disconnect());

    root.querySelectorAll<HTMLElement>('[data-count]').forEach((n) => {
      const to = Number(n.dataset.count);
      if (reduce || !Number.isFinite(to)) return;
      n.textContent = '0';
      const co = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        co.disconnect();
        const t0 = performance.now();
        const f = (t: number) => { const k = Math.min(1, (t - t0) / 1400); n.textContent = String(Math.round(to * (1 - (1 - k) ** 3))); if (k < 1) requestAnimationFrame(f); };
        requestAnimationFrame(f);
      }));
      co.observe(n);
      cleanup.push(() => co.disconnect());
    });

    const onMove = (e: PointerEvent) => {
      const g = (e.target as Element).closest<HTMLElement>('[data-glow]');
      if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', `${e.clientX - r.left}px`);
      g.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    root.addEventListener('pointermove', onMove);
    cleanup.push(() => root.removeEventListener('pointermove', onMove));

    if (!reduce) {
      root.querySelectorAll<HTMLElement>('[data-tilt]').forEach((n) => {
        const move = (e: PointerEvent) => { const r = n.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5; const y = (e.clientY - r.top) / r.height - 0.5; n.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-3px)`; };
        const leave = () => { n.style.transform = ''; };
        n.addEventListener('pointermove', move); n.addEventListener('pointerleave', leave);
        cleanup.push(() => { n.removeEventListener('pointermove', move); n.removeEventListener('pointerleave', leave); });
      });
      root.querySelectorAll<HTMLElement>('.btn').forEach((b) => {
        const move = (e: PointerEvent) => { const r = b.getBoundingClientRect(); b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.12}px ${(e.clientY - r.top - r.height / 2) * 0.2 - 2}px`; };
        const leave = () => { b.style.translate = ''; };
        b.addEventListener('pointermove', move); b.addEventListener('pointerleave', leave);
        cleanup.push(() => { b.removeEventListener('pointermove', move); b.removeEventListener('pointerleave', leave); });
      });
      const blobs = Array.from(root.querySelectorAll<HTMLElement>('.hero .blob'));
      if (blobs.length) {
        const onScroll = () => blobs.forEach((b, i) => { b.style.marginTop = `${window.scrollY * (i % 2 ? -0.06 : 0.08)}px`; });
        window.addEventListener('scroll', onScroll, { passive: true });
        cleanup.push(() => window.removeEventListener('scroll', onScroll));
      }
    }

    return () => { cleanup.forEach((f) => f()); root.classList.remove('rp-ready'); };
  }, []);

  return <div ref={ref} className={`rp rp-${slug}`}><main id="main">{children}</main></div>;
}

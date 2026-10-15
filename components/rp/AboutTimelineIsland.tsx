'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** The timeline spine: it fills as the reader scrolls and lights each node as it is passed. */
export function TimelineShell({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = box.current;
    const f = fill.current;
    if (!el || !f) return;
    const nodes = Array.from(el.querySelectorAll<HTMLElement>('.tln'));
    const update = () => {
      const r = el.getBoundingClientRect();
      const y = window.innerHeight * 0.55;
      f.style.height = `${Math.max(0, Math.min(r.height, y - r.top))}px`;
      nodes.forEach((n) => n.classList.toggle('on', n.getBoundingClientRect().top < y));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);

  return (
    <div className="tlx" ref={box}>
      <i className="tlf" ref={fill} aria-hidden="true" />
      {children}
    </div>
  );
}

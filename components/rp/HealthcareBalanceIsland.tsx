'use client';

import { useEffect, useRef } from 'react';
import { Ic } from './shared';

/** A balance beam that starts tipped toward context and settles level as the reader works down the page. */
export function Beam() {
  const beam = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const b = beam.current;
    const grid = wrap.current?.closest('.rp')?.querySelector<HTMLElement>('.bgrid');
    if (!b || !grid) return;
    const update = () => {
      const r = grid.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.6 - r.top) / (r.height * 0.8)));
      b.style.setProperty('--a', `${(-9 + p * 9).toFixed(2)}deg`);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className="hbal" aria-hidden="true" ref={wrap}>
      <div className="bpivot" />
      <div className="bbeam" ref={beam}>
        <span className="pan l tint"><Ic n="file" /></span>
        <span className="pan r dp"><Ic n="users" /></span>
      </div>
    </div>
  );
}

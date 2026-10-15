'use client';

import { useEffect, useRef, useState } from 'react';

/** The sticky contents list. It follows the reader and lights the section being read. */
export function ReportNav({ sections }: { sections: { number: number; title: string }[] }) {
  const [cur, setCur] = useState(1);
  const fill = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(`section-${s.number}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setCur(Number(e.target.id.replace('section-', ''))); }),
      { rootMargin: '-30% 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  useEffect(() => {
    if (fill.current) fill.current.style.height = `${(cur / sections.length) * 100}%`;
  }, [cur, sections.length]);

  return (
    <nav aria-label="Report sections" className="rnav">
      <p>{sections.length} sections</p>
      <div className="rtrack"><i ref={fill} /></div>
      <ol>
        {sections.map((s) => (
          <li key={s.number} className={s.number === cur ? 'on' : s.number < cur ? 'past' : ''}>
            <a href={`#section-${s.number}`}>
              <span aria-hidden="true">{String(s.number).padStart(2, '0')}</span>
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

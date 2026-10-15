'use client';

import { useEffect, useRef, useState } from 'react';

interface Stage { num: string; h: string; sub: string; text: string }

/** Seven rising steps. Hover or click one to read the stage; they cycle until the reader takes over. */
export function Stairs({ stages, tags }: { stages: Stage[]; tags: string[] }) {
  const [cur, setCur] = useState(0);
  const hold = useRef(false);
  const n = stages.length;

  useEffect(() => {
    const t = setInterval(() => {
      if (!hold.current && document.visibilityState === 'visible') setCur((c) => (c + 1) % n);
    }, 5500);
    return () => clearInterval(t);
  }, [n]);

  const pick = (i: number) => { hold.current = true; setCur(i); };
  const z = stages[cur];

  return (
    <>
      <div className="stairs rvg" onPointerEnter={() => { hold.current = true; }}>
        {stages.map((s, i) => (
          <button
            key={s.num}
            type="button"
            className={`stair dp rvi ${i === cur ? 'on' : ''}`}
            style={{ ['--i' as string]: i, ['--h' as string]: `${140 + i * 32}px` }}
            data-glow=""
            aria-pressed={i === cur}
            onClick={() => pick(i)}
            onPointerEnter={() => pick(i)}
          >
            <span className="sn">{s.num}</span>
            <span className="sb"><b>{s.h}</b></span>
          </button>
        ))}
      </div>
      <div className="pdet dp r28" data-glow="" aria-live="polite">
        <div className="pdn swap" key={cur}>
          <div className="pdl">
            <span className="kick w">{cur ? tags[1] : tags[0]}</span>
            <div className="pdb gw">{z.num}</div>
          </div>
          <div className="pdr">
            <h3 className="h2">{z.h}</h3>
            <p className="pds">{z.sub}</p>
            <p>{z.text}</p>
          </div>
        </div>
      </div>
    </>
  );
}

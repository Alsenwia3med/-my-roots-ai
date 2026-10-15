'use client';

import { useState } from 'react';
import { Ic, type IconName } from './shared';

const ICONS: IconName[] = ['lock', 'eye', 'info', 'shield'];

/** Principle cards. They turn over on hover or focus, and on tap for touch screens. */
export function FlipCards({ blocks }: { blocks: { label: string; paragraphs: string[] }[] }) {
  const [flipped, setFlipped] = useState<number | null>(null);
  return (
    <div className="rsflip rvg">
      {blocks.map((b, i) => (
        <button
          key={b.label}
          type="button"
          className={`fc rvi ${flipped === i ? 'flipped' : ''}`}
          style={{ ['--i' as string]: i }}
          aria-label={b.label}
          aria-pressed={flipped === i}
          onClick={() => setFlipped((f) => (f === i ? null : i))}
        >
          <span className="fin">
            <span className="ff dp"><i><Ic n={ICONS[i % 4]} /></i><b>{b.label}</b></span>
            <span className="fb tint">{b.paragraphs.map((t) => <p key={t}>{t}</p>)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

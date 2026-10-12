/**
 * Shared layout for the C-04 public pages (C-05 PUB-02 … PUB-11).
 *
 * The pages carry no copy: headline, intro, zones, bullets and calls to action all come from
 * lib/content/c04-pages.ts, which is checked against the controlled C-04 PDF by
 * `npm run check:c04`. A page file only says which content it renders.
 *
 * Lux presentation: a white opening section with the page's own 3D object, then each zone
 * presented according to what it is — a sequence as a lit timeline, a boundary as a statement,
 * capabilities with an explicit availability status, supporting points as icon cards.
 */

import Link from 'next/link';
import { ArrowRight, Ban, Check, Lock, Quote, type LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { PageContent, PageZone } from '@/lib/content/c04-pages';
import { IconTile, LogoTile, TONES } from '@/components/lux/Icon';
import { Spark } from '@/components/lux/Instruments';
import { iconFor } from '@/components/lux/iconMap';
import PageHero from '@/components/lux/PageHero';
import type { SceneVariant } from '@/components/lux/three/scenes';

const SCENES: Record<string, SceneVariant> = {
  '/about': 'helix',
  '/how-it-works': 'flow',
  '/platform': 'layers',
  '/research': 'lattice',
  '/healthcare-professionals': 'panels',
  '/pilot': 'beacon',
};

const delay = (i: number) => ({ '--d': `${Math.min(i, 8) * 80}ms` }) as CSSProperties;

function Sequence({ zone }: { zone: PageZone }) {
  return (
    <ol className="lxz-sequence" data-progress="">
      <span className="lxz-sequence-rail" aria-hidden="true">
        <span />
        <i className="lxz-sequence-pulse" />
      </span>
      {zone.items.map((item, i) => (
        <li key={item} className="lxz-step" data-reveal="" style={delay(i)}>
          <span className="lxz-step-num" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="lx-card lxz-step-card" data-tilt="4">
            <IconTile icon={iconFor(item)} tone={TONES[i % TONES.length]} size="sm" />
            {/* The governed step text already begins with its own number; the numeral above is
                presentation, so the duplicate prefix is dropped from the reading order. */}
            <p className="lx-text">{item.replace(/^\d+\.\s*/, '')}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Statement({ zone }: { zone: PageZone }) {
  const tone = zone.tone ?? 'neutral';
  const fallback: LucideIcon = tone === 'limit' ? Ban : tone === 'affirm' ? Check : Quote;
  return (
    <div className="lxz-statement" data-tone={tone}>
      {zone.items.map((item) => (
        <div
          key={item}
          className={`lx-card lxz-statement-card${tone === 'limit' ? ' lx-card--deep lx-on-deep' : ''}`}
          data-tilt="3"
          data-reveal=""
        >
          {item.startsWith('Company:') ? (
            <LogoTile />
          ) : (
            <IconTile icon={iconFor(item, fallback)} tone={tone === 'limit' ? 'glass' : tone === 'affirm' ? 'mint' : 'teal'} />
          )}
          <p className="lxz-statement-text">{item}</p>
        </div>
      ))}
    </div>
  );
}

function Status({ zone }: { zone: PageZone }) {
  return (
    <ul className="lxz-status" data-stagger="90">
      {zone.items.map((item, i) => {
        // C-04 §1: future capabilities are labelled "Coming Soon" and never presented as
        // available. The label is part of the governed sentence, so it is read from it.
        const [label, ...rest] = item.split(': ');
        const available = label === 'Available';
        return (
          <li
            key={item}
            className="lx-card lxz-capability"
            data-available={available}
            data-tilt={available ? '3' : '4'}
            data-reveal=""
            style={delay(i)}
          >
            <span className="lxz-cap-icon">
              <IconTile icon={iconFor(item)} tone={available ? 'teal' : 'light'} size={available ? 'lg' : 'md'} />
              {available ? null : (
                <span className="lxz-lock" aria-hidden="true">
                  <Lock size={10} strokeWidth={2.4} />
                </span>
              )}
            </span>
            <span className="lxz-cap-body">
              <span className="lxz-pill">
                {available ? <span className="lxz-live" aria-hidden="true" /> : null}
                {label}
              </span>
              <span className="lxz-capability-name">{rest.join(': ')}</span>
            </span>
            {available ? (
              <span className="lxz-cap-signal" aria-hidden="true">
                <Spark seed={2} />
              </span>
            ) : (
              <span className="lxz-build" aria-hidden="true">
                <span />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Points({ zone }: { zone: PageZone }) {
  return (
    <ul className="lxz-points" data-count={zone.items.length} data-stagger="90">
      {zone.items.map((item, i) => (
        <li key={item} className="lx-card lxz-point" data-tilt="5" data-reveal="" style={delay(i)}>
          <IconTile icon={iconFor(item)} tone={TONES[i % TONES.length]} />
          <p className="lx-text">{item}</p>
        </li>
      ))}
    </ul>
  );
}

function Zone({ zone, index }: { zone: PageZone; index: number }) {
  const kind = zone.kind ?? 'points';

  return (
    // The kind travels as data, not as a class, so the zone and its contents never both pick
    // up the same treatment.
    <section className="lxz" data-kind={kind} data-span={zone.span ?? 12} data-tone={zone.tone}>
      {zone.eyebrow || zone.heading ? (
        <header className="lxz-head" data-reveal="">
          <span className="lxz-index" aria-hidden="true">
            <span>{String(index + 1).padStart(2, '0')}</span>
          </span>
          {zone.eyebrow ? <p className="lx-kicker">{zone.eyebrow}</p> : null}
          {zone.heading ? <h2 className="lxz-title">{zone.heading}</h2> : null}
        </header>
      ) : null}

      {kind === 'sequence' ? <Sequence zone={zone} /> : null}
      {kind === 'statement' ? <Statement zone={zone} /> : null}
      {kind === 'status' ? <Status zone={zone} /> : null}
      {kind === 'points' ? <Points zone={zone} /> : null}
    </section>
  );
}

export default function PublicPage({ page, kicker, children }: { page: PageContent; kicker: string; children?: React.ReactNode }) {
  const zones = page.zones ?? (page.bullets.length ? [{ heading: '', items: page.bullets } as PageZone] : []);

  return (
    <div className="lx lxp">
      <main id="main">
        <PageHero kicker={kicker} title={page.headline} intro={page.intro} scene={SCENES[page.route] ?? 'orb'} />

        <div className="lxp-body lx-wrap">
          <div className="lxp-zones">
            {zones.map((zone, i) => (
              <Zone key={zone.heading || `zone-${i}`} zone={zone} index={i} />
            ))}
          </div>
          {children}
        </div>

        {page.ctas.length ? (
          <section className="lxp-close lx-wrap" aria-label="Next steps">
            <div className="lxp-close-panel" data-reveal="scale">
              <span className="lxp-close-orbit" aria-hidden="true" />
              <span className="lxp-close-orbit lxp-close-orbit--2" aria-hidden="true" />
              <div className="lx-actions lxp-close-actions">
                {page.ctas.map((cta, i) => (
                  <Link
                    className={`lx-btn ${i === 0 ? 'lx-btn--primary' : 'lx-btn--secondary'}`}
                    href={cta.href}
                    key={cta.href}
                    data-magnetic=""
                  >
                    <span>{cta.label}</span>
                    {i === 0 ? <ArrowRight className="lx-arrow" size={17} strokeWidth={2} aria-hidden="true" /> : null}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

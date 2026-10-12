/**
 * Shared layout for the C-04 public pages (C-05 PUB-02 … PUB-11).
 *
 * The pages carry no copy: headline, intro, zones, bullets and calls to action all come from
 * lib/content/c04-pages.ts, which is checked against the controlled C-04 PDF by
 * `npm run check:c04`. A page file only says which content it renders.
 *
 * Lux presentation ("dossier"): a calm white opening with the page's own 3D object, then the
 * page's zones set as one composed clinical sheet — each zone a row with a numbered label on the
 * left and its content on the right, separated by hairlines rather than boxed. Every kind of zone
 * has its own form: a sequence is a lit stepper, a capability list is a pipeline that is honest
 * about availability, a statement is a single weighted line, supporting points are a quiet list.
 */

import Link from 'next/link';
import { ArrowRight, Ban, Check, Lock, Quote, type LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import type { PageContent, PageZone } from '@/lib/content/c04-pages';
import { IconTile, LogoTile, TONES } from '@/components/lux/Icon';
import { iconFor } from '@/components/lux/iconMap';
import { Biosignal, HudLens, Spark } from '@/components/lux/Instruments';
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

const delay = (i: number) => ({ '--d': `${Math.min(i, 8) * 70}ms` }) as CSSProperties;
const pad = (n: number) => String(n).padStart(2, '0');

/* ------------------------------------------------------------------ zone bodies */

function Steps({ zone }: { zone: PageZone }) {
  return (
    <ol className="lxd-steps" data-progress="">
      <span className="lxd-steps-rail" aria-hidden="true">
        <span />
        <i />
      </span>
      {zone.items.map((item, i) => (
        <li key={item} className="lxd-step" data-reveal="" data-press="" style={delay(i)}>
          <span className="lxd-step-node" aria-hidden="true">
            {pad(i + 1)}
          </span>
          <IconTile icon={iconFor(item)} tone={TONES[i % TONES.length]} size="sm" />
          {/* The governed step text already begins with its own number; the numeral beside it is
              presentation, so the duplicate prefix is dropped from the reading order. */}
          <p className="lxd-step-text">{item.replace(/^\d+\.\s*/, '')}</p>
        </li>
      ))}
    </ol>
  );
}

function List({ zone }: { zone: PageZone }) {
  return (
    <ul className="lxd-list" data-count={zone.items.length}>
      {zone.items.map((item, i) => (
        <li key={item} className="lxd-item" data-reveal="" data-press="" style={delay(i)}>
          <IconTile icon={iconFor(item)} tone={TONES[i % TONES.length]} size="sm" />
          <p>{item}</p>
        </li>
      ))}
    </ul>
  );
}

function Statement({ zone }: { zone: PageZone }) {
  const tone = zone.tone ?? 'neutral';
  const fallback: LucideIcon = tone === 'limit' ? Ban : tone === 'affirm' ? Check : Quote;
  return (
    <div className="lxd-statements">
      {zone.items.map((item) => (
        <div key={item} className="lxd-statement" data-tone={tone} data-reveal="" data-press="">
          {item.startsWith('Company:') ? (
            <LogoTile size="sm" />
          ) : (
            <IconTile
              icon={iconFor(item, fallback)}
              tone={tone === 'limit' ? 'glass' : tone === 'affirm' ? 'mint' : 'teal'}
              size="sm"
            />
          )}
          <p>{item}</p>
        </div>
      ))}
    </div>
  );
}

function Capabilities({ zone }: { zone: PageZone }) {
  const parsed = zone.items.map((item) => {
    // C-04 §1: future capabilities are labelled "Coming Soon" and never presented as
    // available. The label is part of the governed sentence, so it is read from it.
    const [label, ...rest] = item.split(': ');
    return { item, label, name: rest.join(': '), available: label === 'Available' };
  });
  const live = parsed.filter((p) => p.available);
  const soon = parsed.filter((p) => !p.available);

  return (
    <div className="lxd-caps">
      {live.map((p) => (
        <div key={p.item} className="lxd-live" data-reveal="" data-press="">
          <span className="lxd-live-glow" aria-hidden="true" />
          <IconTile icon={iconFor(p.item)} tone="teal" />
          <div className="lxd-live-copy">
            <span className="lxd-pill lxd-pill--live">
              <span className="lxd-dot" aria-hidden="true" />
              {p.label}
            </span>
            <span className="lxd-live-name">{p.name}</span>
          </div>
          <span className="lxd-live-chart" aria-hidden="true">
            <Spark seed={2} />
          </span>
        </div>
      ))}
      {soon.length ? (
        <ol className="lxd-pipeline" data-count={soon.length}>
          <span className="lxd-pipeline-track" aria-hidden="true">
            <span />
          </span>
          {soon.map((p, i) => (
            <li key={p.item} className="lxd-soon" data-reveal="" data-press="" style={delay(i)}>
              <span className="lxd-soon-node" aria-hidden="true" />
              <span className="lxd-soon-icon">
                <IconTile icon={iconFor(p.item)} tone="light" size="sm" />
                <span className="lxd-lock" aria-hidden="true">
                  <Lock size={9} strokeWidth={2.6} />
                </span>
              </span>
              <span className="lxd-soon-name">{p.name}</span>
              <span className="lxd-pill lxd-pill--soon">
                <span className="lxd-hourglass" aria-hidden="true" />
                {p.label}
              </span>
              <span className="lxd-build" aria-hidden="true">
                <span />
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function ZoneBody({ zone }: { zone: PageZone }) {
  switch (zone.kind ?? 'points') {
    case 'sequence':
      return <Steps zone={zone} />;
    case 'statement':
      return <Statement zone={zone} />;
    case 'status':
      return <Capabilities zone={zone} />;
    default:
      return <List zone={zone} />;
  }
}

function Zone({ zone, index }: { zone: PageZone; index: number }) {
  return (
    <section className="lxd-zone" data-kind={zone.kind ?? 'points'} data-tone={zone.tone}>
      {zone.eyebrow || zone.heading ? (
        <header className="lxd-head" data-reveal="">
          <span className="lxd-index" aria-hidden="true">
            {pad(index + 1)}
          </span>
          <div className="lxd-head-copy">
            {zone.eyebrow ? <p className="lxd-eyebrow">{zone.eyebrow}</p> : null}
            {zone.heading ? <h2 className="lxd-title">{zone.heading}</h2> : null}
          </div>
        </header>
      ) : null}
      <div className="lxd-body">
        <ZoneBody zone={zone} />
      </div>
    </section>
  );
}

/** Zones authored as halves sit side by side in one row of the sheet. */
function rows(zones: PageZone[]) {
  const out: Array<{ zones: Array<{ zone: PageZone; index: number }> }> = [];
  zones.forEach((zone, index) => {
    const last = out[out.length - 1];
    const half = (zone.span ?? 12) <= 6;
    if (half && last && last.zones.length === 1 && (last.zones[0].zone.span ?? 12) <= 6) {
      last.zones.push({ zone, index });
    } else {
      out.push({ zones: [{ zone, index }] });
    }
  });
  return out;
}

export default function PublicPage({ page, kicker, children }: { page: PageContent; kicker: string; children?: ReactNode }) {
  const zones = page.zones ?? (page.bullets.length ? [{ heading: '', items: page.bullets } as PageZone] : []);

  return (
    <div className="lx lxp lxd-page">
      <main id="main">
        <PageHero kicker={kicker} title={page.headline} intro={page.intro} scene={SCENES[page.route] ?? 'orb'} />

        <div className="lxd lx-wrap">
          <div className="lxd-sheet">
            <span className="lxd-sheet-edge" aria-hidden="true" />
            {rows(zones).map((row, r) => (
              <div className="lxd-row" data-split={row.zones.length > 1 ? 'true' : undefined} key={r}>
                {row.zones.map(({ zone, index }) => (
                  <Zone key={zone.heading || `zone-${index}`} zone={zone} index={index} />
                ))}
              </div>
            ))}
          </div>
          {children}
        </div>

        {page.ctas.length ? (
          <section className="lxd-cta lx-wrap" aria-label="Next steps">
            <div className="lxd-cta-panel" data-reveal="scale">
              <span className="lxd-cta-aurora" aria-hidden="true" />
              <span className="lxd-cta-rings" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="lxd-cta-horizon" aria-hidden="true" />
              <HudLens />
              <Biosignal className="lxd-cta-signal" />
              <div className="lxd-cta-actions">
                {page.ctas.map((cta, i) => (
                  <Link
                    className={`lx-btn ${i === 0 ? 'lx-btn--glow' : 'lx-btn--ghost'}`}
                    href={cta.href}
                    key={cta.href}
                    data-magnetic=""
                  >
                    <span>{cta.label}</span>
                    <ArrowRight className="lx-arrow" size={16} strokeWidth={2} aria-hidden="true" />
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

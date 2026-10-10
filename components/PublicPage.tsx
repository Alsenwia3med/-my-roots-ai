/**
 * Shared layout for the C-04 public pages (C-05 PUB-02 … PUB-11).
 *
 * The pages carry no copy: headline, intro, zones, bullets and calls to action all come from
 * lib/content/c04-pages.ts, which is checked against the controlled C-04 PDF by
 * `npm run check:c04`. A page file only says which content it renders.
 *
 * C-05 gives the structure — "Desktop follows 12-column grid; mobile zones stack in listed
 * order; no horizontal body scrolling" — and File 14 gives the visual target. Two of its rules
 * shape this component:
 *
 *   §6  "Depth: subtle layering, elevation and visual grouping; avoid excessive outlined boxes."
 *   §6.1 a design that is "visually generic, overly safe, repetitive" with "repeated generic
 *        cards" does not pass the Golden Screen gate.
 *
 * So a zone is presented according to what it is. A sequence reads as a paced flow with its own
 * numerals; a boundary reads as a statement with a semantic accent; capabilities carry an
 * explicit availability status; supporting points are separated by rule rather than boxed. The
 * page is composed from those, not from one card repeated down the screen.
 */

import Link from 'next/link';
import type { PageContent, PageZone } from '@/lib/content/c04-pages';

function Zone({ zone }: { zone: PageZone }) {
  const kind = zone.kind ?? 'points';

  return (
    // The kind travels as data, not as a class: `pz-statement` on the section as well as on the
    // block inside it would style both, giving a bordered box inside a bordered box.
    <section className="pz" data-kind={kind} data-span={zone.span ?? 12} data-tone={zone.tone}>
      {zone.eyebrow ? <p className="pz-eyebrow">{zone.eyebrow}</p> : null}
      {zone.heading ? <h2>{zone.heading}</h2> : null}

      {kind === 'sequence' ? (
        <ol className="pz-sequence">
          {zone.items.map((item, i) => (
            <li key={item}>
              <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              {/* The governed step text already begins with its own number; the numeral above is
                  presentation, so the duplicate prefix is dropped from the reading order. */}
              <p>{item.replace(/^\d+\.\s*/, '')}</p>
            </li>
          ))}
        </ol>
      ) : null}

      {kind === 'statement' ? (
        <div className="pz-statement">
          {zone.items.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      ) : null}

      {kind === 'status' ? (
        <ul className="pz-status">
          {zone.items.map((item) => {
            // C-04 §1: future capabilities are labelled "Coming Soon" and never presented as
            // available. The label is part of the governed sentence, so it is read from it.
            const [label, ...rest] = item.split(': ');
            const available = label === 'Available';
            return (
              <li data-available={available} key={item}>
                <span className="pz-pill">{label}</span>
                <span className="pz-capability">{rest.join(': ')}</span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {kind === 'points' ? (
        <ul className="pz-points">
          {zone.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default function PublicPage({ page, kicker, children }: { page: PageContent; kicker: string; children?: React.ReactNode }) {
  const zones = page.zones ?? (page.bullets.length ? [{ heading: '', items: page.bullets } as PageZone] : []);

  return (
    <div className="clone-page">
      <main id="main" className="marketing-page inner-page public-page">
        <section className="page-heading">
          <p className="marketing-kicker">{kicker}</p>
          <h1>{page.headline}</h1>
          <p>{page.intro}</p>
        </section>

        <div className="public-body">
          {zones.map((zone, i) => (
            <Zone key={zone.heading || `zone-${i}`} zone={zone} />
          ))}
          {children}
        </div>

        <div className="center-actions">
          {page.ctas.map((cta, i) => (
            <Link className={i === 0 ? 'primary-button' : 'secondary-button'} href={cta.href} key={cta.href}>
              {cta.label}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

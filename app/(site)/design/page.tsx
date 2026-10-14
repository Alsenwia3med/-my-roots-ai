// DESIGN EXPLORATION ONLY — the gallery of every page and its three flagship designs.

import Link from 'next/link';
import { DOCS } from '@/components/design/adapt';
import { VARIANTS } from '@/components/design/types';

const GROUPS = ['Pages', 'Forms and viewers', 'Legal'] as const;

export default function DesignGallery() {
  return (
    <div className="lx dz-gallery">
      <section className="dz-gallery-hero lx-wrap">
        <p className="mz-kicker" style={{ color: '#86672d' }}>
          Design options
        </p>
        <h1 className="dz-gallery-title">
          Three designs for <em>every page</em>
        </h1>
        <ul className="dz-gallery-legend">
          {VARIANTS.map((v) => (
            <li key={v.id}>
              <b>{v.id}</b>
              <strong>{v.name}</strong>
              <small>{v.mood}</small>
            </li>
          ))}
        </ul>
      </section>
      <div className="dz-gallery-body lx-wrap">
        {GROUPS.map((group) => (
          <section key={group}>
            <h2 className="dz-gallery-group">{group}</h2>
            <div className="dz-gallery-grid">
              {DOCS.filter((d) => d.group === group).map((d) => (
                <article className="lx-card dz-gallery-card" key={d.slug} data-reveal="" data-tilt="3">
                  <h3>{d.label}</h3>
                  <p className="dz-gallery-path">/{d.slug}</p>
                  <div className="dz-gallery-opts">
                    {VARIANTS.map((v) => (
                      <Link key={v.id} href={`/design/${d.slug}?v=${v.id}`} title={`${v.name} — ${v.mood}`}>
                        <b>{v.id}</b>
                        {v.name}
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

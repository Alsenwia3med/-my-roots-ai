/**
 * Research — "Manifesto". Each section is a statement set large beside an outline numeral; the
 * four principles are cards that turn over. Copy: lib/content/website-v121.ts.
 */

import type { PageContent } from '@/lib/content/c04-pages';
import Scene3D from '@/components/lux/Scene3D';
import { HeroL, Outro, normalize, pad } from './shared';
import { RpRoot } from './RpClient';
import { FlipCards } from './ResearchManifestoIsland';
import './rp.css';
import './rp-research.css';

export default function ResearchManifesto({ page, kicker }: { page: PageContent; kicker: string }) {
  const N = normalize(page);
  const last = N.zones.length - 1;
  return (
    <RpRoot slug="research">
      <HeroL
        page={page}
        kicker={kicker}
        right={
          <div className="rs3d" aria-hidden="true">
            <Scene3D variant="lattice">
              <div className="rs-lattice">
                <i className="rs-orbit rs-orbit-a" />
                <i className="rs-orbit rs-orbit-b" />
                <i className="rs-orbit rs-orbit-c" />
                <div className="rs-globe">
                  <svg viewBox="0 0 240 240">
                    <g className="rs-links">
                      <path d="M48 72 91 46 137 57 179 82 195 125 165 171 119 194 75 170 45 128 48 72ZM48 72l71 122 60-112M91 46l28 148 18-137M179 82 75 170M45 128l150-3M48 72l117 99M91 46 195 125M137 57 75 170" />
                    </g>
                    <g className="rs-nodes">
                      <circle cx="48" cy="72" r="5" /><circle cx="91" cy="46" r="4" />
                      <circle cx="137" cy="57" r="5" /><circle cx="179" cy="82" r="4" />
                      <circle cx="195" cy="125" r="5" /><circle cx="165" cy="171" r="4" />
                      <circle cx="119" cy="194" r="5" /><circle cx="75" cy="170" r="4" />
                      <circle cx="45" cy="128" r="5" /><circle cx="119" cy="118" r="7" />
                    </g>
                  </svg>
                  <i className="rs-glint" />
                </div>
                <i className="rs-particle rs-particle-a" />
                <i className="rs-particle rs-particle-b" />
                <i className="rs-particle rs-particle-c" />
              </div>
            </Scene3D>
          </div>
        }
      />
      {N.zones.map((z, i) => {
        if (z.blocks.length) {
          return (
            <section className="sec rsb" key={z.i}>
              <div className="wrap">
                <div className="rsrow">
                  <div className="rsidx">{pad(i)}</div>
                  <div className="rsmain">
                    <h2 className="h2 rv"><span className="uline">{z.h}</span></h2>
                    {z.sub ? <p className="lede rv" style={{ margin: '8px 0 18px' }}>{z.sub}</p> : null}
                  </div>
                </div>
                <FlipCards blocks={z.blocks} />
                {z.lead ? <p className="rslead2 rv">{z.lead}</p> : null}
              </div>
            </section>
          );
        }
        if (i === last) {
          return (
            <section className="sec" key={z.i}>
              <div className="wrap">
                <div className="rsend dp r28 rv" data-glow="">
                  <span className="kick w">{pad(i)}</span>
                  <h2 className="h2" style={{ margin: '10px 0 14px' }}>{z.h}</h2>
                  <p className="rsbig gw">{z.paras[0]}</p>
                  <div className="rscols">{z.paras.slice(1).map((t) => <p key={t}>{t}</p>)}</div>
                </div>
              </div>
            </section>
          );
        }
        return (
          <section className="sec rsb" key={z.i}>
            <div className="wrap rsrow">
              <div className="rsidx rv">{pad(i)}</div>
              <div className="rsmain">
                <h2 className="h2 rv"><span className="uline">{z.h}</span></h2>
                <p className="rsbig rv">{z.paras[0]}</p>
                <div className="rscols rv">{z.paras.slice(1).map((t) => <p key={t}>{t}</p>)}</div>
              </div>
            </div>
          </section>
        );
      })}
      <Outro page={page} />
    </RpRoot>
  );
}

/**
 * About — "Timeline". The story runs down a central line that fills as you read, with cards on
 * alternating sides. Copy: lib/content/website-v121.ts.
 */

import type { PageContent } from '@/lib/content/c04-pages';
import Scene3D from '@/components/lux/Scene3D';
import { HeroL, Outro, normalize, pad } from './shared';
import { RpRoot } from './RpClient';
import { TimelineShell } from './AboutTimelineIsland';
import './rp.css';
import './rp-about.css';

const isNot = (t: string) => /^(And )?not every/i.test(t);

export default function AboutTimeline({ page, kicker }: { page: PageContent; kicker: string }) {
  const N = normalize(page);
  const last = N.zones.length - 1;
  return (
    <RpRoot slug="about">
      <HeroL
        page={page}
        kicker={kicker}
        cls="about-hero"
        right={
          <div className="about-visual" aria-hidden="true">
            <Scene3D variant="helix">
              <div className="about-helix">
                <i className="about-ring about-ring-a" />
                <i className="about-ring about-ring-b" />
                <div className="about-globe">
                  <svg viewBox="0 0 240 300">
                    <path className="about-strand strand-a" d="M64 18C202 60 38 94 176 132S42 205 178 282" />
                    <path className="about-strand strand-b" d="M176 18C38 60 202 94 64 132S198 205 62 282" />
                    <path className="about-rungs" d="M83 34 157 34M62 58 178 58M53 82 187 82M62 106 178 106M81 130 159 130M94 154 146 154M81 178 159 178M62 202 178 202M54 226 186 226M64 250 176 250M86 274 154 274" />
                    <circle className="about-core" cx="120" cy="150" r="10" />
                  </svg>
                  <span className="about-mark">ROOTS<span>-AI</span></span>
                </div>
                <i className="about-particle about-particle-a" />
                <i className="about-particle about-particle-b" />
                <i className="about-particle about-particle-c" />
              </div>
            </Scene3D>
          </div>
        }
      />
      <section className="sec" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <TimelineShell>
            {N.zones.map((z, i) => {
              const dark = z.blocks.length > 0 || i === 0 || i === last;
              return (
                <div key={z.i} className={`tli ${i % 2 ? 'r' : 'l'} rv`}>
                  <span className="tln"><b>{pad(i)}</b></span>
                  <article className={`tlc ${dark ? 'dp' : 'tint'} r22`} data-glow="">
                    {z.eb ? <span className={`kick ${dark ? 'w' : ''}`}>{z.eb}</span> : null}
                    <h2 className="h2" style={{ margin: '6px 0 10px' }}>{z.h}</h2>
                    {z.blocks.length ? (
                      <div className="tlchips">
                        {z.blocks.map((b) => (
                          <details key={b.label}>
                            <summary>{b.label}</summary>
                            {b.paragraphs.map((t) => <p key={t}>{t}</p>)}
                          </details>
                        ))}
                      </div>
                    ) : i === last ? (
                      <div className="abclose">
                        {z.paras.map((t, k) => <p key={k} className={isNot(t) ? 'stz' : undefined}>{t}</p>)}
                      </div>
                    ) : (
                      <div className="zb">{z.paras.map((t, k) => <p key={k}>{t}</p>)}</div>
                    )}
                  </article>
                </div>
              );
            })}
          </TimelineShell>
        </div>
      </section>
      <Outro page={page} />
    </RpRoot>
  );
}

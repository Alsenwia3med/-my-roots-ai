/**
 * Platform — "Ascent". Seven rising steps for the seven stages of evolution, then the
 * boundaries and the initial/future split. Copy: lib/content/website-v121.ts.
 */

import type { PageContent } from '@/lib/content/c04-pages';
import { Body, HeroL, Ic, Outro, SHead, normalize } from './shared';
import { RpRoot } from './RpClient';
import { Stairs } from './PlatformAscentIsland';
import './rp.css';
import './rp-platform.css';

export default function PlatformAscent({ page, kicker }: { page: PageContent; kicker: string }) {
  const N = normalize(page);
  const g = N.groups.find((x) => x.type === 'steps')!;
  const stages = g.zones;
  const head = g.head!;
  const bound = N.zones.find((z) => z.tone === 'limit')!;
  const bl = N.zones.find((z) => z.blocks.length)!;
  const [initial, future] = bl.blocks;
  const tags = [initial.label, future.label];

  return (
    <RpRoot slug="platform">
      <HeroL
        page={page}
        kicker={kicker}
        right={
          <div className="plbars" aria-hidden="true">
            {stages.map((z, k) => (
              <i key={z.i} style={{ ['--h' as string]: `${22 + k * 13}%`, ['--d' as string]: `${k * 0.12}s` }}><b>{z.num}</b></i>
            ))}
          </div>
        }
      />
      <section className="sec">
        <div className="wrap">
          <SHead title={head.h} sub={head.sub} />
          <Stairs tags={tags} stages={stages.map((z) => ({ num: z.num ?? '', h: z.h, sub: z.sub, text: z.paras[0] ?? '' }))} />
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          <div className="plb tint rv" data-glow="">
            <span className="plbi"><Ic n="lock" /></span>
            <div>
              <h2 className="h2" style={{ margin: '0 0 10px' }}>{bound.h}</h2>
              <Body z={bound} />
            </div>
          </div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap plsplit rvg">
          <div className="dp r22 pad rvi" style={{ ['--i' as string]: 0 }} data-glow="">
            <h3 className="h2" style={{ margin: '0 0 10px' }}>{initial.label}</h3>
            {initial.paragraphs.map((t) => <p key={t} className="plp">{t}</p>)}
          </div>
          <div className="plarr" aria-hidden="true"><div className="rail" /><span className="pk" /><i><Ic n="arrow" /></i></div>
          <div className="tint r22 pad rvi" style={{ ['--i' as string]: 1 }} data-glow="">
            <h3 className="h2" style={{ margin: '0 0 10px' }}>{future.label}</h3>
            {future.paragraphs.map((t) => <p key={t} className="plp l">{t}</p>)}
          </div>
        </div>
      </section>
      <Outro page={page} />
    </RpRoot>
  );
}

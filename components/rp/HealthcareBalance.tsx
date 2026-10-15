/**
 * Healthcare Professionals — "Balance". Context on one side, clinical judgment on the other,
 * with a beam that settles level as the page is read. Copy: lib/content/website-v121.ts.
 */

import type { PageContent } from '@/lib/content/c04-pages';
import { Body, HeroL, Ic, Outro, normalize, type IconName } from './shared';
import { RpRoot } from './RpClient';
import { Beam } from './HealthcareBalanceIsland';
import './rp.css';
import './rp-healthcare.css';

const BI: IconName[] = ['clip', 'file', 'shield', 'info', 'spark', 'eye'];

export default function HealthcareBalance({ page, kicker }: { page: PageContent; kicker: string }) {
  const N = normalize(page);
  const [ctx, review, rules, limit, dialogue] = N.zones;
  return (
    <RpRoot slug="healthcare">
      <HeroL page={page} kicker={kicker} right={<Beam />} />
      <section className="sec" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="bgrid">
            <div className="bcol">
              <div className="bh tint r16"><span className="kick">{ctx.eb}</span></div>
              <article className="bc rv"><h2 className="h2">{ctx.h}</h2><Body z={ctx} /></article>
              <article className="bc rv">
                <span className="kick">{review.eb}</span>
                <h2 className="h2" style={{ margin: '6px 0 12px' }}>{review.h}</h2>
                <ul className="blist">
                  {review.blocks.map((b, i) => (
                    <li key={b.label} className="tint r16 lift">
                      <i><Ic n={BI[i % 6]} /></i>
                      <div><b>{b.label}</b><p>{b.paragraphs[0]}</p></div>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="bc rv">
                <span className="kick">{rules.eb}</span>
                <h2 className="h2" style={{ margin: '6px 0 12px' }}>{rules.h}</h2>
                <Body z={rules} />
              </article>
            </div>
            <div className="bspine" aria-hidden="true"><i /><b><Ic n="link" /></b></div>
            <div className="bcol">
              <div className="bh dp r16"><span className="kick w">{limit.eb}</span></div>
              <article className="bc dp r22 pad rv" data-glow="">
                <h2 className="h2" style={{ marginBottom: 12 }}>{limit.h}</h2>
                <Body z={limit} dark />
              </article>
              <article className="bc dp r22 pad rv" data-glow="">
                <h2 className="h2" style={{ marginBottom: 12 }}>{dialogue.h}</h2>
                <Body z={dialogue} dark />
              </article>
            </div>
          </div>
        </div>
      </section>
      <Outro page={page} />
    </RpRoot>
  );
}

/**
 * Pilot — "Boarding Pass". The Free Beta is shown as a pass, with what the participant receives
 * as ticket stubs. Copy: lib/content/website-v121.ts.
 */

import Link from 'next/link';
import type { PageContent } from '@/lib/content/c04-pages';
import { Body, HeroL, Ic, Outro, SHead, normalize, pad } from './shared';
import { RpRoot } from './RpClient';
import './rp.css';
import './rp-pilot.css';

export default function PilotPass({ page, kicker }: { page: PageContent; kicker: string }) {
  const N = normalize(page);
  const [explore, receive, eligible, privacy, limit, shape] = N.zones;
  const facts = (page.outro?.text ?? '').split(/\s·\s/);
  const join = page.ctas[0];

  const pass = (
    <div className="pass dp r22 fl" data-glow="">
      <div className="pt"><span className="kick w">ROOTS-AI™</span><b className="gw">Free Beta</b></div>
      <div className="pm">
        <div><span>{facts[0]}</span></div>
        <div><span>{facts[1]}</span></div>
        <div className="w"><span>{facts[2]}</span></div>
      </div>
      <div className="perf" aria-hidden="true" />
      <div className="pb">
        <div className="bc2" aria-hidden="true">
          {Array.from({ length: 34 }, (_, k) => <i key={k} style={{ height: `${40 + ((k * 37) % 60)}%`, width: k % 5 === 0 ? 4 : 2 }} />)}
        </div>
        {join ? <Link className="btn bw" href={join.href}>{join.label}<Ic n="arrow" className="arr" /></Link> : null}
      </div>
    </div>
  );

  return (
    <RpRoot slug="pilot">
      <HeroL page={page} kicker={kicker} right={pass} />
      <section className="sec" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <SHead kicker={explore.eb} title={explore.h} />
          <div className="two2 rv">
            <div className="zb">{explore.paras.slice(0, 2).map((t) => <p key={t}>{t}</p>)}</div>
            <p className="pq gt">{explore.paras[2]}</p>
          </div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          <SHead title={receive.h} />
          <div className="stubs rvg">
            {receive.blocks.map((b, i) => (
              <article key={b.label} className={`stub ${i % 2 ? 'tint' : 'dp'} rvi lift`} style={{ ['--i' as string]: i }} data-glow="">
                <span className="sno">{pad(i)}</span>
                <h3>{b.label}</h3>
                {b.paragraphs.map((t) => <p key={t}>{t}</p>)}
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap two3">
          <div className="rv">
            <h2 className="h2" style={{ margin: '0 0 14px' }}>{eligible.h}</h2>
            <ul className="eli">
              {eligible.paras.map((t, i) => (
                <li key={t} className="rv" style={{ transitionDelay: `${i * 120}ms` }}><span><Ic n="check" /></span>{t}</li>
              ))}
            </ul>
          </div>
          <div className="rv">
            <h2 className="h2" style={{ margin: '0 0 14px' }}>{privacy.h}</h2>
            <div className="zb">{privacy.paras.map((t) => <p key={t}>{t}</p>)}</div>
          </div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          <div className="torn rv">
            <h2 className="h2" style={{ marginBottom: 10 }}>{limit.h}</h2>
            <Body z={limit} />
          </div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          <div className="dp r28 pad2 rv" data-glow="">
            <h2 className="h2 gw" style={{ marginBottom: 12 }}>{shape.h}</h2>
            <div className="zb cols2">{shape.paras.map((t) => <p key={t}>{t}</p>)}</div>
          </div>
        </div>
      </section>
      <Outro page={page} />
    </RpRoot>
  );
}

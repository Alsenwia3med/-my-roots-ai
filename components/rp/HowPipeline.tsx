/**
 * How It Works — "Living Pipeline". The four stages sit on a flowing rail of glowing orbs; the
 * selected stage opens in a teal dossier. Every other section is a tidy row. Copy: lib/content.
 */

import type { PageContent } from '@/lib/content/c04-pages';
import { Body, HeroL, Ic, Outro, Row, normalize, pad, short, type Group } from './shared';
import { RpRoot } from './RpClient';
import { Pipeline } from './HowPipelineIsland';
import './rp.css';
import './rp-how.css';

const BARS = [88, 72, 94, 64, 80];

function Console({ groups }: { groups: Group[] }) {
  return (
    <aside className="con dp r28 fl in e4" aria-hidden="true">
      {groups.slice(0, 5).map((g, i) => (
        <div className="crow" key={g.id}>
          <span className="co"><Ic n={g.zones[0].icon} /></span>
          <div><b>{short(g.label, 34)}</b><small><i className="bar" style={{ width: `${BARS[i]}%`, animationDelay: `${i * 0.3}s` }} /></small></div>
          <em>{pad(i)}</em>
        </div>
      ))}
      <div className="cfoot">
        <span className="sig">{[0, 0.15, 0.3, 0.45, 0.6, 0.75].map((d) => <i key={d} style={{ animationDelay: `${d}s` }} />)}</span>
      </div>
    </aside>
  );
}

function Pair({ g }: { g: Group }) {
  return (
    <section className="sec">
      <div className="wrap pair rvg">
        {g.zones.map((z, i) => (
          <div key={z.i} className={`dp r22 rvi ${z.tone === 'limit' ? 'lim' : ''}`} style={{ ['--i' as string]: i }} data-glow="">
            <span className="kick w"><Ic n={z.tone === 'limit' ? 'x' : 'check'} /></span>
            <h2 className="h2" style={{ margin: '10px 0 14px' }}>{z.h}</h2>
            <Body z={z} dark />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HowPipeline({ page, kicker }: { page: PageContent; kicker: string }) {
  const N = normalize(page);
  return (
    <RpRoot slug="how">
      <HeroL page={page} kicker={kicker} right={<Console groups={N.groups} />} />
      {N.groups.map((g) =>
        g.type === 'steps' ? (
          <Pipeline
            key={g.id}
            id={g.id}
            kicker={g.head && g.eb ? g.eb : undefined}
            title={g.head ? g.head.h : g.label}
            sub={g.head?.sub ?? ''}
            zones={g.zones}
          />
        ) : g.type === 'pair' ? (
          <Pair key={g.id} g={g} />
        ) : (
          <Row key={g.id} z={g.zones[0]} />
        ),
      )}
      <Outro page={page} />
    </RpRoot>
  );
}

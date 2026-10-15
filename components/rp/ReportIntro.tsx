/**
 * Example Report — the four "look inside" sections shown as one showcase: a state ring, the seven
 * domains as live bars, a constellation for the key patterns and four icons for the priorities.
 * Every word comes from lib/content/website-v121-pages.ts; the graphics carry no text of their own.
 */

import { CalendarCheck, Footprints, Moon, Salad } from 'lucide-react';
import type { PageZone } from '@/lib/content/c04-pages';
import { EXAMPLE } from '@/lib/content/example-report';
import { DOMAIN_DISPLAY_ORDER } from '@/lib/report/c03-content';

const NODES: [number, number][] = [[24, 70], [62, 28], [104, 62], [146, 24], [172, 86], [96, 104]];
const EDGES: [number, number][] = [[0, 1], [1, 2], [2, 3], [2, 4], [2, 5], [0, 5], [3, 4]];

export default function ReportIntro({ zones }: { zones: PageZone[] }) {
  const [intro, state, domains, patterns, priorities] = zones;
  const score = EXAMPLE.biologicalState;
  return (
    <section className="sec rpi">
      <div className="wrap">
        <header className="rih rv">
          <h2 className="h2 gt">{intro.heading}</h2>
          <p className="lede">{intro.paragraphs?.[0]}</p>
          <i className="riline" aria-hidden="true" />
        </header>

        <div className="rigrid rvg">
          <article className="ric a dp r28 rvi" style={{ ['--i' as string]: 0 }} data-glow="" data-tilt="">
            <div className="riring" aria-hidden="true">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="6" />
                <circle className="rarc" cx="50" cy="50" r="42" fill="none" stroke="#8FE6EA" strokeWidth="6" strokeLinecap="round" pathLength={100} strokeDasharray="100" style={{ ['--off' as string]: 100 - score }} transform="rotate(-90 50 50)" />
              </svg>
              <i className="riorbit spin" />
              <div className="rival"><b className="gw" data-count={score}>{score}</b><small>/100</small></div>
            </div>
            <h3 className="h2">{state.heading}</h3>
            {state.sub ? <p className="risub">{state.sub}</p> : null}
            {state.paragraphs?.map((t) => <p key={t}>{t}</p>)}
          </article>

          <article className="ric b tint r28 rvi" style={{ ['--i' as string]: 1 }} data-glow="" data-tilt="">
            <h3 className="h2">{domains.heading}</h3>
            {domains.paragraphs?.map((t) => <p key={t}>{t}</p>)}
            <ul className="ribars" aria-hidden="true">
              {DOMAIN_DISPLAY_ORDER.map((id, i) => (
                <li key={id} style={{ ['--d' as string]: `${i * 110}ms` }}>
                  <span>{id}</span>
                  <i><b style={{ ['--w' as string]: `${EXAMPLE.domains[id]}%` }} /></i>
                  <em>{EXAMPLE.domains[id]}</em>
                </li>
              ))}
            </ul>
          </article>

          <article className="ric c tint r28 rvi" style={{ ['--i' as string]: 2 }} data-glow="" data-tilt="">
            <svg className="ricon" viewBox="0 0 200 120" aria-hidden="true">
              {EDGES.map(([a, b], k) => (
                <line key={k} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} className="riedge" style={{ animationDelay: `${k * 0.25}s` }} />
              ))}
              {NODES.map(([x, y], k) => (
                <g key={k} className="rinode" style={{ animationDelay: `${k * 0.4}s` }}>
                  <circle cx={x} cy={y} r="9" className="rihalo" />
                  <circle cx={x} cy={y} r="4.5" className="ridot" />
                </g>
              ))}
            </svg>
            <h3 className="h2">{patterns.heading}</h3>
            {patterns.paragraphs?.map((t) => <p key={t}>{t}</p>)}
          </article>

          <article className="ric d dp r28 rvi" style={{ ['--i' as string]: 3 }} data-glow="" data-tilt="">
            <div className="ripri" aria-hidden="true">
              {[CalendarCheck, Salad, Footprints, Moon].map((Icon, i) => (
                <span key={i} style={{ animationDelay: `${i * 0.5}s` }}><Icon size="1em" strokeWidth={1.6} /></span>
              ))}
            </div>
            <h3 className="h2">{priorities.heading}</h3>
            {priorities.paragraphs?.map((t) => <p key={t}>{t}</p>)}
          </article>
        </div>
      </div>
    </section>
  );
}

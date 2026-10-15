/**
 * Example Report — the same 19 sections, the same fictional data and the same classifications,
 * laid out in the new style: a report cover in the hero, a sticky contents list that follows the
 * reader, and one animated card per section. Copy: lib/content/example-report.ts, c03-content.ts
 * and website-v121-pages.ts. Nothing here adds wording.
 */

import type { PageContent } from '@/lib/content/c04-pages';
import { EXAMPLE, EXAMPLE_SECTIONS } from '@/lib/content/example-report';
import { EXAMPLE_REPORT_PAGE as PAGE } from '@/lib/content/website-v121-pages';
import { CLASSIFICATION_EXPLANATIONS, COPY, DOMAIN_MEANINGS } from '@/lib/report/c03-content';
import { classify } from '@/lib/report/build';
import { HeroL, Outro, Rows } from './shared';
import { RpRoot } from './RpClient';
import { ReportNav } from './ExampleReportNav';
import ReportIntro from './ReportIntro';
import './rp.css';
import './rp-extra.css';
import './rp-report.css';

const page = {
  route: '/example-report',
  headline: PAGE.headline,
  tagline: PAGE.tagline,
  intro: PAGE.intro,
  introMore: PAGE.introMore,
  kicker: PAGE.kicker,
  ctas: PAGE.ctas,
  bullets: [],
  footnote: PAGE.footnote,
} as PageContent;

/**
 * The five opening sections are shown as one showcase. The section that only lists the 19 titles
 * is not shown, because the contents list beside the report already does that.
 */
const SHOWCASE = ['A Look Inside Your Report', 'Your Biological State™', 'Your Seven-Domain Overview', 'Your Key Patterns', 'Your Educational Priorities'];
const showcase = SHOWCASE.map((h) => PAGE.before.find((z) => z.heading === h)!);
const rest = PAGE.before.filter((z) => !SHOWCASE.includes(z.heading) && z.heading !== 'Explore All 19 Sections');

const pad = (n: number) => String(n).padStart(2, '0');
const whole = (v: string) => /^\d+$/.test(v);

function Cover() {
  return (
    <div className="rcover dp r28 fl" data-glow="">
      <p className="rbadge">{PAGE.badge.label}</p>
      <div className="rring">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="7" />
          <circle className="rarc" cx="50" cy="50" r="42" fill="none" stroke="#8FE6EA" strokeWidth="7" strokeLinecap="round" pathLength={100} strokeDasharray="100" style={{ ['--off' as string]: 100 - EXAMPLE.biologicalState }} transform="rotate(-90 50 50)" />
        </svg>
        <div className="rval">
          <b className="gw" data-count={EXAMPLE.biologicalState}>{EXAMPLE.biologicalState}</b>
          <small>/100</small>
        </div>
      </div>
      <p className="rcls">{EXAMPLE.stateClassification}</p>
      <p className="rbt">{PAGE.badge.text}</p>
    </div>
  );
}

export default function ExampleReport({ kicker }: { kicker: string }) {
  void kicker;
  return (
    <RpRoot slug="report">
      <HeroL page={page} kicker={PAGE.kicker} right={<Cover />} />
      <ReportIntro zones={showcase} />
      <Rows zones={rest} />

      <section className="sec" id="viewer">
        <div className="wrap rbody">
          <ReportNav sections={EXAMPLE_SECTIONS.map((s) => ({ number: s.number, title: s.title }))} />

          <div className="rview">
            {EXAMPLE_SECTIONS.map((section) => {
              const dark = section.number === 1 || Boolean(section.figure);
              const last = section.number === 19;
              return (
                <article
                  key={section.number}
                  id={`section-${section.number}`}
                  className={`rsec ${dark ? 'dp' : 'tint'} ${last ? 'rdisc' : ''} r22 rv`}
                  data-glow=""
                >
                  <header className="rhd">
                    <span className="rn" aria-hidden="true">{pad(section.number)}</span>
                    <div>
                      <p className="rof">Section {section.number} of 19</p>
                      <h2 className="h2">{section.title}</h2>
                    </div>
                  </header>

                  {section.figure ? (
                    <p className="rfig">
                      <strong className="gw" {...(whole(section.figure.value) ? { 'data-count': section.figure.value } : {})}>{section.figure.value}</strong>
                      {section.figure.unit ? <span className="runit">{section.figure.unit}</span> : null}
                      {section.figure.label ? <span className="rclass">{section.figure.label}</span> : null}
                    </p>
                  ) : null}

                  {section.content ? <p className="rcopy">{section.content}</p> : null}

                  {/* Section 7 — every bar states its number and classification, so nothing is carried by colour or length alone. */}
                  {section.bars ? (
                    <ul className="rbars">
                      {section.bars.map((bar, i) => {
                        const classification = classify(bar.score);
                        return (
                          <li key={bar.domain_id} style={{ ['--d' as string]: `${i * 110}ms` }}>
                            <span className="rbl"><strong>{bar.label}</strong><span>{DOMAIN_MEANINGS[bar.domain_id]}</span></span>
                            <span className="rbt2"><span className="rfill" style={{ ['--w' as string]: `${bar.score}%` }} /></span>
                            <span className="rbv"><strong>{bar.score}</strong><span>/100 · {classification}</span></span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}

                  {/* Section 8 — domains and a protective factor are labelled differently so they are never read as equivalent. */}
                  {section.triad ? (
                    <>
                      <ul className="rtri">
                        {section.triad.map((el, i) => (
                          <li key={el.label} data-kind={el.kind} style={{ ['--d' as string]: `${i * 120}ms` }}>
                            <span>{el.kind === 'driver' ? 'Domain' : 'Protective factor'}</span>
                            <strong>{el.label}</strong>
                          </li>
                        ))}
                      </ul>
                      <p className="rnote">The diagram shows possible relationships between these areas, not causes.</p>
                    </>
                  ) : null}

                  {section.modules ? (
                    <ol className="rmods">
                      {section.modules.map((t, i) => <li key={t} style={{ ['--d' as string]: `${i * 50}ms` }}>{t}</li>)}
                    </ol>
                  ) : null}

                  {/* Section 19 — the fixed disclaimer, in full, never truncated. */}
                  {last ? <p className="rcopy">{COPY.disclaimer}</p> : null}

                  {section.number === 3 ? <p className="rnote">{CLASSIFICATION_EXPLANATIONS[EXAMPLE.stateClassification]}</p> : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <Rows zones={PAGE.after} />
      <Outro page={page} />
    </RpRoot>
  );
}

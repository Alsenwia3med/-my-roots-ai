/**
 * The three flagship designs. Each begins with an idea:
 *
 *   1 Maison         quiet luxury. A page set like a private atelier journal: serif display
 *                    type, champagne hairlines, a root that grows down the margin as you read.
 *   2 Constellation  the seven connected domains as a living observatory. The page turns the
 *                    orrery to the next node as each chapter comes into view.
 *   3 Lumière        luminous glass. Light follows the visitor; cards answer the pointer with
 *                    a glow that traces their edge and a depth that tilts.
 *
 * The page model is shared; copy is never touched here.
 */

import { Fragment, type CSSProperties } from 'react';
import { Biosignal } from '@/components/lux/Instruments';
import { Ambient, DotNav, ExplorationFlag, ParticleField, ScrollyWrap, Switcher } from './Interactive';
import { Body, Closing, Diamond, Display, Heading, IntroText, Marquee, SceneStage, Slot, hasTitle, numeralFor, rowsOf } from './Parts';
import type { DDoc, DSection, VariantId } from './types';

const d = (ms: number) => ({ ['--d' as string]: `${ms}ms` }) as CSSProperties;

/* ================================================================== 1 · MAISON */

function Folio({ s, first }: { s: DSection; first: boolean }) {
  return (
    <section id={s.id} className="mz-folio" data-tone={s.tone} data-first={first ? 'true' : undefined} data-bare={hasTitle(s) ? undefined : 'true'}>
      <div className="mz-folio-side" aria-hidden="true">
        <span className="mz-numeral" data-progress="">
          {numeralFor(s)}
        </span>
        <span className="mz-node">
          <Diamond />
        </span>
      </div>
      <div className="mz-folio-main">
        <Heading s={s} />
        <Body s={s} />
      </div>
    </section>
  );
}

function Maison({ doc }: { doc: DDoc }) {
  const all = [...doc.sections, ...doc.after];
  const titles = all.map((s) => s.heading).filter(Boolean) as string[];
  return (
    <div className="lx mz mz-maison">
      <Ambient tone="champagne" />

      <section className="mz-hero lx-wrap">
        <div className="mz-hero-copy">
          <p className="mz-kicker" data-reveal="">
            <Diamond />
            {doc.kicker}
          </p>
          <Display text={doc.title} as="h1" className="mz-h1" />
          {doc.tagline ? (
            <p className="mz-tagline" data-reveal="" style={d(260)}>
              {doc.tagline}
            </p>
          ) : null}
        </div>
        <figure className="mz-plate" data-tilt="3" data-reveal="scale" style={d(120)}>
          <span className="mz-plate-frame" aria-hidden="true" />
          <span className="mz-plate-frame mz-plate-frame--in" aria-hidden="true" />
          <span className="mz-plate-orbit" aria-hidden="true" />
          <SceneStage doc={doc} />
        </figure>
      </section>

      <div className="mz-intro-wrap lx-wrap">
        <IntroText doc={doc} columns />
      </div>

      <Marquee items={titles} />

      <div className="mz-journal lx-wrap" data-progress="">
        <span className="mz-root" aria-hidden="true">
          <span className="mz-root-fill" />
          <span className="mz-bead" />
        </span>
        {doc.sections.map((s, i) => (
          <Folio s={s} first={i === 0} key={s.id} />
        ))}
        <Slot doc={doc} />
        {doc.after.map((s) => (
          <Folio s={s} first={false} key={s.id} />
        ))}
      </div>

      <Closing doc={doc} />
    </div>
  );
}

/* ================================================================== 2 · CONSTELLATION */

const CX = 300;
const CY = 300;
const NODES = Array.from({ length: 7 }, (_, i) => {
  const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
  const r = i % 2 ? 214 : 186;
  return { n: i + 1, x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r };
});
const FLECKS = Array.from({ length: 16 }, (_, i) => {
  const a = i * 2.399963;
  const r = 70 + ((i * 53) % 230);
  return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r, r: 1 + (i % 3) * 0.7, t: (i * 0.7) % 6 };
});

/** The observatory: a core, seven nodes, hairline orbits, light running along the lines. */
function OrbitArt() {
  const poly = NODES.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return (
    <svg className="cs-art" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="cs-core" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="38%" stopColor="#bff3f6" />
          <stop offset="100%" stopColor="#19a7b8" />
        </radialGradient>
        <radialGradient id="cs-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8fe6ea" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8fe6ea" stopOpacity="0" />
        </radialGradient>
        <filter id="cs-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <circle className="cs-halo" cx={CX} cy={CY} r="290" fill="url(#cs-halo)" />

      <g className="cs-layer cs-layer--far">
        {FLECKS.map((f, i) => (
          <circle key={i} className="cs-fleck" cx={f.x} cy={f.y} r={f.r} style={{ animationDelay: `${-f.t}s` }} />
        ))}
      </g>

      <g className="cs-ring-spin">
        <circle className="cs-orbit" cx={CX} cy={CY} r="276" />
        <circle className="cs-orbit cs-orbit--dash" cx={CX} cy={CY} r="238" />
        <circle className="cs-orbit" cx={CX} cy={CY} r="150" />
        <circle className="cs-orbit cs-orbit--dash" cx={CX} cy={CY} r="96" />
      </g>

      <g className="cs-layer cs-layer--mid">
        <g className="cs-rot">
          <polygon className="cs-poly" points={poly} />
          {NODES.map((p, i) => {
            const q = NODES[(i + 2) % 7];
            return <line key={`c${i}`} className="cs-chord" x1={p.x} y1={p.y} x2={q.x} y2={q.y} />;
          })}
          {NODES.map((p) => (
            <Fragment key={p.n}>
              <line className="cs-spoke" x1={CX} y1={CY} x2={p.x} y2={p.y} data-i={p.n} />
              <line className="cs-spoke cs-spoke--run" x1={CX} y1={CY} x2={p.x} y2={p.y} data-i={p.n} pathLength={1} />
            </Fragment>
          ))}
          {NODES.map((p) => (
            <g className="cs-node" data-i={p.n} key={p.n} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
              <g className="cs-node-in">
                <circle className="cs-node-ring" r="20" />
                <circle className="cs-node-pulse" r="14" />
                <circle className="cs-node-dot" r="7" />
                <text className="cs-node-n" y="-30" textAnchor="middle">
                  {p.n}
                </text>
              </g>
            </g>
          ))}
        </g>
      </g>

      <g className="cs-layer cs-layer--near">
        <circle className="cs-core-glow" cx={CX} cy={CY} r="46" fill="url(#cs-halo)" filter="url(#cs-glow)" />
        <circle className="cs-core" cx={CX} cy={CY} r="30" fill="url(#cs-core)" />
        <circle className="cs-core-ring" cx={CX} cy={CY} r="44" />
      </g>
    </svg>
  );
}

function Panel({ s, index, flat = false }: { s: DSection; index?: number; flat?: boolean }) {
  return (
    <section id={s.id} className={`cs-panel${flat ? ' cs-panel--flat' : ''}`} data-panel={index} data-tone={s.tone}>
      <header className="cs-panel-head">
        <span className="cs-chip" aria-hidden="true">
          {numeralFor(s)}
        </span>
        <div>
          <Heading s={s} />
        </div>
      </header>
      <Body s={s} />
    </section>
  );
}

function Constellation({ doc }: { doc: DDoc }) {
  const stages = doc.sections;
  return (
    <div className="lx mz mz-const">
      <Ambient />

      <section className="cs-hero lx-wrap">
        <span className="cs-hero-rings" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <p className="mz-kicker" data-reveal="">
          <Diamond />
          {doc.kicker}
        </p>
        <Display text={doc.title} as="h1" className="mz-h1" />
        {doc.tagline ? (
          <p className="mz-tagline" data-reveal="" style={d(240)}>
            {doc.tagline}
          </p>
        ) : null}
        <IntroText doc={doc} columns />
        <Biosignal className="cs-signal" />
      </section>

      <ScrollyWrap count={stages.length}>
        <div className="cs-grid lx-wrap">
          <aside className="cs-stagecol" aria-hidden="true">
            <div className="cs-sticky">
              <div className="cs-orrery">
                <OrbitArt />
              </div>
              <div className="cs-readout">
                {stages.map((s, i) => (
                  <span className="cs-num" data-n={i + 1} key={s.id}>
                    {numeralFor(s)}
                  </span>
                ))}
              </div>
              <span className="cs-track">
                {stages.map((s, i) => (
                  <i key={s.id} data-n={i + 1} />
                ))}
              </span>
            </div>
          </aside>
          <div className="cs-panels">
            {stages.map((s, i) => (
              <Panel s={s} index={i + 1} key={s.id} />
            ))}
          </div>
        </div>
      </ScrollyWrap>

      {doc.slot !== 'none' || doc.after.length ? (
        <div className="cs-below lx-wrap">
          <Slot doc={doc} />
          {rowsOf(doc.after).map((row) => (
            <div className="cs-row" data-split={row.length > 1 ? 'true' : undefined} key={row[0].id}>
              {row.map((s) => (
                <Panel s={s} flat key={s.id} />
              ))}
            </div>
          ))}
        </div>
      ) : null}

      <Closing doc={doc} />
    </div>
  );
}

/* ================================================================== 3 · LUMIÈRE */

function Pane({ s }: { s: DSection }) {
  return (
    <section id={s.id} className="lm-card" data-tone={s.tone} data-tilt="2" data-reveal="" data-progress="">
      <span className="lm-edge" aria-hidden="true" />
      <span className="lm-sheen" aria-hidden="true" />
      <span className="lm-big" aria-hidden="true">
        {numeralFor(s)}
      </span>
      <div className="lm-card-in">
        <Heading s={s} />
        <Body s={s} />
      </div>
    </section>
  );
}

function Lumiere({ doc }: { doc: DDoc }) {
  const nav = [...doc.sections, ...doc.after].filter((s) => s.heading).map((s) => ({ id: s.id, label: s.heading as string }));
  const rows = (list: DSection[]) =>
    rowsOf(list).map((row) => (
      <div className="lm-row" data-split={row.length > 1 ? 'true' : undefined} key={row[0].id}>
        {row.map((s) => (
          <Pane s={s} key={s.id} />
        ))}
      </div>
    ));
  return (
    <div className="lx mz mz-lum">
      <Ambient />
      <ParticleField />
      <div className="lm-bg" aria-hidden="true">
        <span className="lm-blob lm-blob--a" />
        <span className="lm-blob lm-blob--b" />
        <span className="lm-blob lm-blob--c" />
        <span className="lm-beam" />
      </div>
      <DotNav items={nav} />

      <section className="lm-hero lx-wrap">
        <div className="lm-scene">
          <SceneStage doc={doc} />
        </div>
        <div className="lm-hero-copy">
          <p className="mz-kicker" data-reveal="">
            <Diamond />
            {doc.kicker}
          </p>
          <Display text={doc.title} as="h1" className="mz-h1" />
          {doc.tagline ? (
            <p className="mz-tagline" data-reveal="" style={d(240)}>
              {doc.tagline}
            </p>
          ) : null}
          <IntroText doc={doc} />
        </div>
      </section>

      <div className="lm-stack lx-wrap">
        {rows(doc.sections)}
        <Slot doc={doc} />
        {rows(doc.after)}
      </div>

      <Closing doc={doc} />
    </div>
  );
}

/* ================================================================== dispatcher */

export default function DesignPage({ doc, variant }: { doc: DDoc; variant: VariantId }) {
  return (
    <>
      <ExplorationFlag />
      {variant === 1 ? <Maison doc={doc} /> : null}
      {variant === 2 ? <Constellation doc={doc} /> : null}
      {variant === 3 ? <Lumiere doc={doc} /> : null}
      <Switcher slug={doc.slug} current={variant} label={doc.label} />
    </>
  );
}

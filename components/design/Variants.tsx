/**
 * The four page designs. Each takes the same page model and sets it differently: its own hero,
 * its own arrangement of sections, its own use of the Lux motion hooks (data-reveal, data-tilt,
 * data-progress, data-magnetic). Copy is never touched here.
 */

import { Fragment } from 'react';
import { Quote } from 'lucide-react';
import { IconTile, TONES } from '@/components/lux/Icon';
import { Biosignal } from '@/components/lux/Instruments';
import { ExplorationFlag, RailNav, Switcher } from './Interactive';
import { Closing, HeroCopy, IntroBlock, SceneStage, SectionBody, SectionTitle, Slot, iconAt } from './Parts';
import type { DDoc, DSection, VariantId } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** The big numeral: a stage heading ("01 — …") keeps its own number, anything else its position. */
function numeralFor(s: DSection) {
  const m = s.heading?.match(/^(\d{2}) — /);
  return m ? m[1] : pad(s.num);
}

/** Sections the source sets as a pair sit side by side. */
function rowsOf(sections: DSection[]) {
  const rows: DSection[][] = [];
  for (const s of sections) {
    const last = rows[rows.length - 1];
    if (s.half && last && last.length === 1 && last[0].half) last.push(s);
    else rows.push([s]);
  }
  return rows;
}

const hasTitle = (s: DSection) => Boolean(s.heading || s.eyebrow);

/* ================================================================== 1 · Chapter Rail */

function Chapter({ s }: { s: DSection }) {
  return (
    <section id={s.id} className="dz-ch" data-tone={s.tone} data-bare={hasTitle(s) ? undefined : 'true'} data-reveal="">
      <div className="dz-ch-num" aria-hidden="true">
        {numeralFor(s)}
      </div>
      <div className="dz-ch-main">
        <SectionTitle s={s} />
        <SectionBody s={s} icons />
      </div>
    </section>
  );
}

function ChapterRail({ doc }: { doc: DDoc }) {
  const all = [...doc.sections, ...doc.after];
  const rail = all.filter(hasTitle).map((s) => ({ id: s.id, label: s.heading ?? s.eyebrow ?? '', num: numeralFor(s) }));
  return (
    <div className="lx dz dz-v1">
      <section className="dz-hero">
        <div className="dz-hero-grid lx-wrap">
          <HeroCopy doc={doc} />
          <SceneStage doc={doc} />
        </div>
        <Biosignal className="dz-hero-signal" />
      </section>

      <div className="dz-layout lx-wrap">
        {rail.length > 2 ? (
          <aside className="dz-rail">
            <RailNav items={rail} />
          </aside>
        ) : null}
        <div className="dz-chapters" data-solo={rail.length > 2 ? undefined : 'true'}>
          {doc.sections.map((s) => (
            <Chapter s={s} key={s.id} />
          ))}
          <Slot doc={doc} />
          {doc.after.map((s) => (
            <Chapter s={s} key={s.id} />
          ))}
        </div>
      </div>
      <Closing doc={doc} />
    </div>
  );
}

/* ================================================================== 2 · Glass Lab */

function Panel({ s, index }: { s: DSection; index: number }) {
  return (
    <section id={s.id} className="dz-panel" data-tone={s.tone} data-side={index % 2 ? 'r' : 'l'} data-reveal="">
      <span className="dz-panel-glow" aria-hidden="true" />
      <header className="dz-panel-head">
        <span className="dz-chip" aria-hidden="true">
          {numeralFor(s)}
        </span>
        <div>
          <SectionTitle s={s} />
        </div>
      </header>
      <SectionBody s={s} icons />
    </section>
  );
}

function GlassLab({ doc }: { doc: DDoc }) {
  const before = rowsOf(doc.sections);
  const after = rowsOf(doc.after);
  let k = 0;
  const render = (rows: DSection[][]) =>
    rows.map((row) => (
      <Fragment key={row[0].id}>
        {k > 0 && k % 3 === 0 ? <Biosignal className="dz-divider" /> : null}
        <div className="dz-row" data-split={row.length > 1 ? 'true' : undefined}>
          {row.map((s) => (
            <Panel s={s} index={k++} key={s.id} />
          ))}
        </div>
      </Fragment>
    ));
  return (
    <div className="lx dz dz-v2">
      <div className="dz-v2-bg" aria-hidden="true">
        <span className="dz-grid" />
        <span className="dz-orb dz-orb--a" />
        <span className="dz-orb dz-orb--b" />
      </div>
      <section className="dz-hero">
        <div className="dz-hero-center lx-wrap">
          <div className="dz-hero-scene">
            <SceneStage doc={doc} />
          </div>
          <HeroCopy doc={doc} />
        </div>
      </section>
      <div className="dz-panels lx-wrap">
        {render(before)}
        <Slot doc={doc} />
        {render(after)}
      </div>
      <Closing doc={doc} />
    </div>
  );
}

/* ================================================================== 3 · Editorial Spine */

function SpineSection({ s }: { s: DSection }) {
  return (
    <article id={s.id} className="dz-ch" data-tone={s.tone} data-reveal="">
      <span className="dz-node" aria-hidden="true">
        <i />
      </span>
      <header>
        <span className="dz-folio" aria-hidden="true">
          {numeralFor(s)}
        </span>
        <SectionTitle s={s} />
        {s.sub ? (
          <p className="dz-pull">
            <Quote aria-hidden="true" size={26} strokeWidth={1.6} />
            {s.sub}
          </p>
        ) : null}
      </header>
      <SectionBody s={{ ...s, sub: undefined }} />
    </article>
  );
}

function EditorialSpine({ doc }: { doc: DDoc }) {
  return (
    <div className="lx dz dz-v3">
      <section className="dz-hero">
        <div className="dz-hero-wrap lx-wrap">
          <HeroCopy doc={doc} />
          <div className="dz-orb">
            <SceneStage doc={doc} />
          </div>
        </div>
        <Biosignal className="dz-hero-signal" />
      </section>

      <div className="dz-spine-wrap lx-wrap" data-progress="">
        <span className="dz-spine" aria-hidden="true">
          <span className="dz-spine-fill" />
        </span>
        <div className="dz-column">
          {doc.sections.map((s) => (
            <SpineSection s={s} key={s.id} />
          ))}
          <Slot doc={doc} />
          {doc.after.map((s) => (
            <SpineSection s={s} key={s.id} />
          ))}
        </div>
      </div>
      <Closing doc={doc} />
    </div>
  );
}

/* ================================================================== 4 · Bento Prism */

function BentoSection({ s, index }: { s: DSection; index: number }) {
  const hasCards = s.blocks.length > 0 || s.items.length > 0;
  const tone = TONES[index % TONES.length];
  return (
    <section id={s.id} className="dz-bsec" data-tone={s.tone} data-reveal="">
      <div className="dz-bgrid" data-cards={hasCards ? 'true' : undefined}>
        <div className="dz-tile dz-tile--head" data-tilt="3">
          <span className="dz-tile-glow" aria-hidden="true" />
          <IconTile icon={iconAt(`${s.heading ?? ''} ${s.eyebrow ?? ''}`, index)} tone={tone} />
          <SectionTitle s={s} />
          {s.sub ? <p className="dz-sub">{s.sub}</p> : null}
          {s.lead ? <p className="dz-lead">{s.lead}</p> : null}
        </div>

        {s.paragraphs.length ? (
          <div className="dz-tile dz-tile--text" data-tilt="2">
            {s.paragraphs.map((p, i) => (
              <p className="dz-p" key={i}>
                {p}
              </p>
            ))}
          </div>
        ) : null}

        {s.blocks.map((b, i) => (
          <div className="dz-tile dz-tile--block" data-count={s.blocks.length} data-tilt="5" data-reveal="" key={b.label} style={{ ['--d' as string]: `${Math.min(i, 8) * 60}ms` }}>
            <span className="dz-tile-glow" aria-hidden="true" />
            <IconTile icon={iconAt(`${b.label} ${b.paragraphs[0] ?? ''}`, index + i + 1)} tone={TONES[(index + i + 1) % TONES.length]} size="sm" />
            <h3 className="dz-label">{b.label}</h3>
            {b.paragraphs.map((p, k) => (
              <p className="dz-p" key={k}>
                {p}
              </p>
            ))}
          </div>
        ))}

        {s.items.length ? (
          <div className="dz-tile dz-tile--items" data-tilt="2">
            <ul className="dz-items" data-count={s.items.length} data-tone={s.tone}>
              {s.items.map((item, i) => (
                <li key={i} data-reveal="" style={{ ['--d' as string]: `${Math.min(i, 8) * 50}ms` }}>
                  <span className="dz-tick" aria-hidden="true">
                    {s.tone === 'limit' ? '✕' : '✓'}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {s.closing.length ? (
          <div className="dz-tile dz-tile--closing" data-tilt="2">
            {s.closing.map((p, i) => (
              <p className="dz-p dz-closing" key={i}>
                {p}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BentoPrism({ doc }: { doc: DDoc }) {
  const before = rowsOf(doc.sections);
  const after = rowsOf(doc.after);
  let k = 0;
  const render = (rows: DSection[][]) =>
    rows.map((row) => (
      <div className="dz-row" data-split={row.length > 1 ? 'true' : undefined} key={row[0].id}>
        {row.map((s) => (
          <BentoSection s={s} index={k++} key={s.id} />
        ))}
      </div>
    ));
  return (
    <div className="lx dz dz-v4">
      <section className="dz-hero">
        <span className="dz-mesh" aria-hidden="true" />
        <div className="dz-hero-grid lx-wrap">
          <HeroCopy doc={doc} />
          <div className="dz-prism" data-reveal="scale">
            <span className="dz-prism-edge" aria-hidden="true" />
            <SceneStage doc={doc} />
          </div>
        </div>
      </section>
      <div className="dz-bento lx-wrap">
        {render(before)}
        <Slot doc={doc} />
        {render(after)}
      </div>
      <Closing doc={doc} />
    </div>
  );
}

/* ================================================================== 5 · Split Stage */

function StageCard({ s }: { s: DSection }) {
  return (
    <section id={s.id} className="dz-card" data-tone={s.tone} data-reveal="" data-tilt="1">
      <span className="dz-card-num" aria-hidden="true">
        {numeralFor(s)}
      </span>
      <SectionTitle s={s} />
      <SectionBody s={s} icons />
    </section>
  );
}

function SplitStage({ doc }: { doc: DDoc }) {
  const hasSlot = doc.slot !== 'none';
  return (
    <div className="lx dz dz-v5">
      <div className="dz-split lx-wrap">
        <div className="dz-stick">
          <HeroCopy doc={doc} compact />
          <SceneStage doc={doc} />
        </div>
        <div className="dz-stream">
          <IntroBlock doc={doc} />
          {doc.sections.map((s) => (
            <StageCard s={s} key={s.id} />
          ))}
          {!hasSlot ? doc.after.map((s) => <StageCard s={s} key={s.id} />) : null}
        </div>
      </div>
      {hasSlot ? (
        <div className="dz-below lx-wrap">
          <Slot doc={doc} />
          <div className="dz-stream dz-stream--wide">
            {doc.after.map((s) => (
              <StageCard s={s} key={s.id} />
            ))}
          </div>
        </div>
      ) : null}
      <Closing doc={doc} />
    </div>
  );
}

/* ================================================================== dispatcher */

export default function DesignPage({ doc, variant }: { doc: DDoc; variant: VariantId }) {
  return (
    <>
      <ExplorationFlag />
      {variant === 1 ? <ChapterRail doc={doc} /> : null}
      {variant === 2 ? <GlassLab doc={doc} /> : null}
      {variant === 3 ? <EditorialSpine doc={doc} /> : null}
      {variant === 4 ? <BentoPrism doc={doc} /> : null}
      {variant === 5 ? <SplitStage doc={doc} /> : null}
      <Switcher slug={doc.slug} current={variant} label={doc.label} />
    </>
  );
}

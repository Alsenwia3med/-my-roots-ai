/**
 * Shared building blocks for the four design variants. Markup is the same everywhere; each
 * variant restyles it (and wraps it differently) through its own `.dz-vN` scope in design.css.
 */

import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { ArrowRight, Ban, Check, Compass, Feather, Gem, Layers, Orbit, Sparkles, Target, Waypoints, X, type LucideIcon } from 'lucide-react';
import { IconTile, TONES } from '@/components/lux/Icon';
import { iconFor } from '@/components/lux/iconMap';
import { Biosignal, HudLens } from '@/components/lux/Instruments';
import Scene3D from '@/components/lux/Scene3D';
import ContactForm from '@/app/(site)/contact/ContactForm';
import EntryForm from '@/app/(site)/assessment/_components/EntryForm';
import { ARTICLES } from '@/lib/content/blog';
import { EXAMPLE, EXAMPLE_SECTIONS } from '@/lib/content/example-report';
import { ASSESSMENT_PAGE, CONTACT_PAGE, INSIGHTS_PAGE } from '@/lib/content/website-v121-pages';
import { CLASSIFICATION_EXPLANATIONS, COPY, DOMAIN_MEANINGS } from '@/lib/report/c03-content';
import { classify } from '@/lib/report/build';
import type { DDoc, DLink, DSection } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** An icon for a heading or label: a keyword match where there is one, otherwise a rotating neutral glyph. */
const FALLBACKS: LucideIcon[] = [Sparkles, Compass, Layers, Gem, Orbit, Waypoints, Target, Feather];
export const iconAt = (text: string, i: number): LucideIcon => iconFor(text, FALLBACKS[i % FALLBACKS.length]);

const delay = (i: number) => ({ ['--d' as string]: `${Math.min(i, 8) * 70}ms` });

/* ------------------------------------------------------------------ section content */

/** Everything a section says, in the order the document says it. */
export function SectionBody({ s, icons = false }: { s: DSection; icons?: boolean }) {
  const toneIcon: LucideIcon = s.tone === 'limit' ? Ban : s.tone === 'affirm' ? Check : Sparkles;
  return (
    <div className="dz-body">
      {s.sub ? <p className="dz-sub">{s.sub}</p> : null}
      {s.paragraphs.map((text, i) => (
        <p className="dz-p" key={i}>
          {text}
        </p>
      ))}
      {s.lead ? <p className="dz-lead">{s.lead}</p> : null}
      {s.blocks.length ? (
        <div className="dz-blocks" data-count={s.blocks.length} data-stagger="70">
          {s.blocks.map((b, i) => (
            <div className="dz-block" key={b.label} data-reveal="" data-tilt="4" style={delay(i)}>
              {icons ? <IconTile icon={s.tone ? iconFor(`${b.label} ${b.paragraphs[0] ?? ''}`, toneIcon) : iconAt(`${b.label} ${b.paragraphs[0] ?? ''}`, i + s.num)} tone={TONES[i % TONES.length]} size="sm" /> : null}
              <div className="dz-block-copy">
                <h3 className="dz-label">{b.label}</h3>
                {b.paragraphs.map((text, k) => (
                  <p className="dz-p" key={k}>
                    {text}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {s.items.length ? (
        <ul className="dz-items" data-count={s.items.length} data-tone={s.tone} data-stagger="55">
          {s.items.map((item, i) => (
            <li key={i} data-reveal="" style={delay(i)}>
              <span className="dz-tick" aria-hidden="true">
                {s.tone === 'limit' ? <X size={13} strokeWidth={2.8} /> : <Check size={13} strokeWidth={2.6} />}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {s.closing.map((text, i) => (
        <p className="dz-p dz-closing" key={i}>
          {text}
        </p>
      ))}
    </div>
  );
}

export function SectionTitle({ s, level = 2 }: { s: DSection; level?: 2 | 3 }) {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <>
      {s.eyebrow ? <p className="dz-eyebrow">{s.eyebrow}</p> : null}
      {s.heading ? <H className="dz-title">{s.heading}</H> : null}
    </>
  );
}

/* ------------------------------------------------------------------ hero pieces */

/** The intro paragraphs, version line and badge, for designs that set them apart from the title. */
export function IntroBlock({ doc }: { doc: DDoc }) {
  if (!doc.intro && !doc.effective && !doc.badge) return null;
  return (
    <div className="dz-intro-block" data-reveal="">
      {doc.intro ? (
        <div className="dz-intro">
          <p>{doc.intro}</p>
          {doc.introMore.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </div>
      ) : null}
      {doc.effective ? <p className="dz-effective">{doc.effective}</p> : null}
      {doc.badge ? (
        <p className="dz-badge">
          <span>{doc.badge.label}</span>
          {doc.badge.text}
        </p>
      ) : null}
    </div>
  );
}

export function HeroCopy({ doc, compact = false }: { doc: DDoc; compact?: boolean }) {
  return (
    <div className="dz-hero-copy">
      <p className="lx-kicker dz-kicker" data-reveal="">
        {doc.kicker}
      </p>
      <h1 className="dz-h1" data-reveal="" style={delay(1)}>
        <span className="dz-h1-in">{doc.title}</span>
      </h1>
      {doc.tagline ? (
        <p className="dz-tagline" data-reveal="" style={delay(2)}>
          {doc.tagline}
        </p>
      ) : null}
      {!compact && doc.intro ? (
        <div className="dz-intro" data-reveal="" style={delay(3)}>
          <p>{doc.intro}</p>
          {doc.introMore.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </div>
      ) : null}
      {!compact && doc.effective ? (
        <p className="dz-effective" data-reveal="" style={delay(4)}>
          {doc.effective}
        </p>
      ) : null}
      {!compact && doc.badge ? (
        <p className="dz-badge" data-reveal="" style={delay(4)}>
          <span>{doc.badge.label}</span>
          {doc.badge.text}
        </p>
      ) : null}
      {doc.ctas.length ? <CtaRow ctas={doc.ctas} delayIndex={5} /> : null}
    </div>
  );
}

export function CtaRow({ ctas, delayIndex = 0, onDark = false }: { ctas: DLink[]; delayIndex?: number; onDark?: boolean }) {
  return (
    <div className="dz-ctas" data-reveal="" style={delay(delayIndex)}>
      {ctas.map((cta, i) => (
        <Link
          key={cta.href + cta.label}
          href={cta.href}
          className={`lx-btn ${i === 0 ? (onDark ? 'lx-btn--glow' : 'lx-btn--primary') : onDark ? 'lx-btn--ghost' : 'lx-btn--secondary'}`}
          data-magnetic=""
        >
          <span>{cta.label}</span>
          {i === 0 ? <ArrowRight className="lx-arrow" size={17} strokeWidth={2} aria-hidden="true" /> : null}
        </Link>
      ))}
    </div>
  );
}

export function SceneStage({ doc, children }: { doc: DDoc; children?: ReactNode }) {
  return (
    <div className="dz-stage" data-reveal="scale">
      <span className="dz-aura" aria-hidden="true" />
      <HudLens />
      <Scene3D variant={doc.scene} />
      {children}
    </div>
  );
}

/** Closing statement, calls to action, footnote and identity lines. */
export function Closing({ doc, onDark = false }: { doc: DDoc; onDark?: boolean }) {
  const ctas = doc.ctas;
  const any = doc.outro || ctas.length || doc.footnote || doc.related?.length || doc.corporate?.length;
  if (!any) return null;
  return (
    <section className="dz-closing-band lx-wrap" aria-label="Next steps">
      <div className="dz-closing-panel" data-reveal="scale">
        <span className="dz-closing-aurora" aria-hidden="true" />
        <Biosignal className="dz-closing-signal" />
        {doc.outro ? (
          <div className="dz-outro">
            {doc.outro.heading ? <h2 className="dz-outro-title">{doc.outro.heading}</h2> : null}
            <p>{doc.outro.text}</p>
          </div>
        ) : null}
        {ctas.length ? <CtaRow ctas={ctas} onDark={!onDark ? true : true} /> : null}
        {doc.related?.length ? (
          <ul className="dz-related">
            {doc.related.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        ) : null}
        {doc.corporate?.length ? (
          <div className="dz-corporate">
            {doc.corporate.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ) : null}
      </div>
      {doc.footnote ? <p className="dz-footnote">{doc.footnote}</p> : null}
    </section>
  );
}

/* ------------------------------------------------------------------ functional slots */

export function Slot({ doc }: { doc: DDoc }) {
  switch (doc.slot) {
    case 'viewer':
      return <ExampleViewer />;
    case 'blog':
      return <BlogSlot />;
    case 'contact':
      return <ContactSlot />;
    case 'assessment':
      return <AssessmentSlot />;
    default:
      return null;
  }
}

function ContactSlot() {
  return (
    <div className="dz-slot dz-slot--contact lx lxc" id="contact-form">
      <div className="dz-paper" data-reveal="scale">
        <h2 className="dz-slot-title">{CONTACT_PAGE.form.heading}</h2>
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </div>
    </div>
  );
}

function AssessmentSlot() {
  return (
    <div className="dz-slot dz-slot--assessment dz-asm" id="begin">
      <div className="dz-paper" data-reveal="scale">
        <h2 className="dz-slot-title">{ASSESSMENT_PAGE.form.heading}</h2>
        <EntryForm />
      </div>
    </div>
  );
}

function BlogSlot() {
  if (ARTICLES.length === 0) {
    return (
      <div className="dz-slot dz-slot--blog">
        <div className="dz-paper dz-empty" data-reveal="scale">
          <span className="dz-empty-orb" aria-hidden="true">
            <span />
          </span>
          <h2 className="dz-slot-title">{INSIGHTS_PAGE.emptyState.heading}</h2>
          {INSIGHTS_PAGE.emptyState.paragraphs.map((text) => (
            <p className="dz-p" key={text}>
              {text}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="dz-slot dz-slot--blog">
      <div className="dz-articles">
        {ARTICLES.map((article) => (
          <Link href={`/blog/${article.slug}`} className="lx-card dz-article" data-tilt="4" data-reveal="" key={article.slug}>
            <p className="dz-eyebrow">{article.category}</p>
            <h3 className="dz-title">{article.title}</h3>
            <p className="dz-p">{article.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** The 19-section interactive example, set on a white sheet so it reads in every variant. */
function ExampleViewer() {
  return (
    <div className="dz-slot dz-slot--viewer lx lxr">
      <div className="dz-paper dz-paper--wide" data-reveal="">
        <div className="lxr-body">
          <nav aria-label="Report sections" className="lxr-contents">
            <p>19 sections</p>
            <ol>
              {EXAMPLE_SECTIONS.map((section) => (
                <li key={section.number}>
                  <a href={`#section-${section.number}`}>
                    <span aria-hidden="true">{pad(section.number)}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="lxr-viewer">
            {EXAMPLE_SECTIONS.map((section) => (
              <section className="lx-card lxr-section" id={`section-${section.number}`} key={section.number} data-reveal="">
                <p className="lxr-number">Section {section.number} of 19</p>
                <h2 className="lxr-title">{section.title}</h2>
                {section.figure ? (
                  <p className="lxr-figure">
                    <strong className="lx-grad">{section.figure.value}</strong>
                    {section.figure.unit ? <span className="lxr-unit">{section.figure.unit}</span> : null}
                    {section.figure.label ? <span className="lxr-class">{section.figure.label}</span> : null}
                  </p>
                ) : null}
                {section.content ? <p className="lxr-copy">{section.content}</p> : null}
                {section.bars ? (
                  <ul className="lxr-bars">
                    {section.bars.map((bar, i) => {
                      const classification = classify(bar.score);
                      return (
                        <li key={bar.domain_id} style={{ ['--d' as string]: `${i * 90}ms` }}>
                          <span className="lxr-bar-label">
                            <strong>{bar.label}</strong>
                            <span>{DOMAIN_MEANINGS[bar.domain_id]}</span>
                          </span>
                          <span className="lxr-bar-track">
                            <span className="lxr-bar-fill" data-class={classification} style={{ ['--w' as string]: `${bar.score}%` }} />
                          </span>
                          <span className="lxr-bar-value">
                            <strong>{bar.score}</strong>
                            <span>/100 · {classification}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                {section.triad ? (
                  <>
                    <ul className="lxr-triad">
                      {section.triad.map((element) => (
                        <li data-kind={element.kind} key={element.label}>
                          <span>{element.kind === 'driver' ? 'Domain' : 'Protective factor'}</span>
                          <strong>{element.label}</strong>
                        </li>
                      ))}
                    </ul>
                    <p className="lxr-note">The diagram shows possible relationships between these areas, not causes.</p>
                  </>
                ) : null}
                {section.modules ? (
                  <ol className="lxr-modules">
                    {section.modules.map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ol>
                ) : null}
                {section.number === 19 ? <p className="lxr-disclaimer">{COPY.disclaimer}</p> : null}
                {section.number === 3 ? <p className="lxr-note">{CLASSIFICATION_EXPLANATIONS[EXAMPLE.stateClassification]}</p> : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

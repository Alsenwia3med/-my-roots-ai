/**
 * Shared pieces of the flagship designs. Markup is common; each design dresses it in its own
 * scope (.mz-maison, .mz-const, .mz-lum). No wording is created here: every string comes from
 * the page model, which copies it from the v1.21 content modules.
 */

import Link from 'next/link';
import { Fragment, Suspense, type CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, Check, X } from 'lucide-react';
import { HudLens } from '@/components/lux/Instruments';
import Scene3D from '@/components/lux/Scene3D';
import ContactForm from '@/app/(site)/contact/ContactForm';
import EntryForm from '@/app/(site)/assessment/_components/EntryForm';
import { ARTICLES } from '@/lib/content/blog';
import { EXAMPLE, EXAMPLE_SECTIONS } from '@/lib/content/example-report';
import { ASSESSMENT_PAGE, CONTACT_PAGE, INSIGHTS_PAGE } from '@/lib/content/website-v121-pages';
import { CLASSIFICATION_EXPLANATIONS, COPY, DOMAIN_MEANINGS } from '@/lib/report/c03-content';
import { classify } from '@/lib/report/build';
import type { DDoc, DLink, DSection } from './types';

export const pad = (n: number) => String(n).padStart(2, '0');

/** A stage heading ("01 — …") keeps its own number; every other section uses its position. */
export function numeralFor(s: DSection) {
  const m = s.heading?.match(/^(\d{2}) — /);
  return m ? m[1] : pad(s.num);
}

export const hasTitle = (s: DSection) => Boolean(s.heading || s.eyebrow);

/** Sections the source sets as a pair. */
export function rowsOf(sections: DSection[]) {
  const rows: DSection[][] = [];
  for (const s of sections) {
    const last = rows[rows.length - 1];
    if (s.half && last && last.length === 1 && last[0].half) last.push(s);
    else rows.push([s]);
  }
  return rows;
}

/* ------------------------------------------------------------------ display type */

/**
 * Where a heading's italic emphasis begins: the last sentence if there are several, otherwise
 * the last two words. Presentation only — the words themselves are never touched.
 */
export function splitEmphasis(text: string): [string, string] {
  const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)?.map((x) => x.trim()).filter(Boolean) ?? [text];
  if (sentences.length >= 2) return [sentences.slice(0, -1).join(' '), sentences[sentences.length - 1]];
  const words = text.split(' ');
  if (words.length >= 4) return [words.slice(0, -2).join(' '), words.slice(-2).join(' ')];
  return [text, ''];
}

const wordCount = (s: string) => (s ? s.split(' ').length : 0);

/** Words that rise out of a mask, one after another, when their heading enters the viewport. */
export function Words({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <>
      {text.split(' ').map((w, i, all) => (
        <Fragment key={i}>
          <span className="mz-w">
            <i style={{ ['--i' as string]: from + i } as CSSProperties}>{w}</i>
          </span>
          {i < all.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  );
}

export function Display({ text, as: Tag = 'h2', className = '', plain = false }: { text: string; as?: 'h1' | 'h2' | 'h3'; className?: string; plain?: boolean }) {
  const [head, tail] = plain ? [text, ''] : splitEmphasis(text);
  return (
    <Tag className={`mz-display ${className}`.trim()} aria-label={text} data-reveal="words">
      <span aria-hidden="true">
        <Words text={head} />
        {tail ? (
          <>
            {' '}
            <em>
              <Words text={tail} from={wordCount(head)} />
            </em>
          </>
        ) : null}
      </span>
    </Tag>
  );
}

export function Diamond({ className = '' }: { className?: string }) {
  return (
    <svg className={`mz-diamond ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5 14.2 9.8 22.5 12 14.2 14.2 12 22.5 9.8 14.2 1.5 12 9.8 9.8Z" />
    </svg>
  );
}

/** A slow strip made of the page's own headings. Decorative: the headings are read in the page. */
export function Marquee({ items }: { items: string[] }) {
  if (items.length < 2) return null;
  const run = [...items, ...items];
  return (
    <div className="mz-marquee" aria-hidden="true">
      <div className="mz-track">
        {[0, 1].map((k) => (
          <div className="mz-run" key={k}>
            {run.map((t, i) => (
              <Fragment key={`${k}-${i}`}>
                <span>{t}</span>
                <Diamond />
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ calls to action */

export function Cta({ ctas, tone = 'light', delay = 0 }: { ctas: DLink[]; tone?: 'light' | 'dark'; delay?: number }) {
  if (!ctas.length) return null;
  return (
    <div className="mz-ctas" data-reveal="" style={{ ['--d' as string]: `${delay}ms` } as CSSProperties}>
      {ctas.map((c, i) => (
        <Link key={c.href + c.label} href={c.href} className={i === 0 ? 'mz-btn' : 'mz-link'} data-tone={tone} data-magnetic={i === 0 ? '' : undefined}>
          <span>{c.label}</span>
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ section content */

export function Body({ s, delayBase = 0 }: { s: DSection; delayBase?: number }) {
  const d = (i: number) => ({ ['--d' as string]: `${delayBase + Math.min(i, 10) * 70}ms` }) as CSSProperties;
  return (
    <div className="mz-body">
      {s.paragraphs.length ? (
        <div className="mz-prose" data-cols={s.paragraphs.length >= 3 ? 2 : 1}>
          {s.paragraphs.map((text, i) => (
            <p key={i} data-reveal="" style={d(i)}>
              {text}
            </p>
          ))}
        </div>
      ) : null}
      {s.lead ? (
        <p className="mz-lead" data-reveal="">
          {s.lead}
        </p>
      ) : null}
      {s.blocks.length ? (
        <div className="mz-blocks" data-count={s.blocks.length}>
          {s.blocks.map((b, i) => (
            <div className="mz-block" key={b.label} data-reveal="" data-tilt="5" style={d(i)}>
              <span className="mz-block-n" aria-hidden="true">
                {pad(i + 1)}
              </span>
              <h3 className="mz-label">{b.label}</h3>
              {b.paragraphs.map((text, k) => (
                <p key={k}>{text}</p>
              ))}
            </div>
          ))}
        </div>
      ) : null}
      {s.items.length ? (
        <ul className="mz-items" data-count={s.items.length} data-tone={s.tone}>
          {s.items.map((item, i) => (
            <li key={i} data-reveal="" style={d(i)}>
              <span className="mz-tick" aria-hidden="true">
                {s.tone === 'limit' ? <X size={12} strokeWidth={2.8} /> : <Check size={12} strokeWidth={2.8} />}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {s.closing.length ? (
        <div className="mz-closing">
          {s.closing.map((text, i) => (
            <p key={i} data-reveal="" style={d(i)}>
              {text}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** What sits above a section's content: an eyebrow, the heading, and the line beneath it. */
export function Heading({ s, level = 2 }: { s: DSection; level?: 2 | 3 }) {
  return (
    <>
      {s.eyebrow ? (
        <p className="mz-eyebrow" data-reveal="">
          {s.eyebrow}
        </p>
      ) : null}
      {s.heading ? <Display text={s.heading} as={level === 2 ? 'h2' : 'h3'} /> : null}
      {s.sub ? (
        <p className="mz-sub" data-reveal="" style={{ ['--d' as string]: '160ms' } as CSSProperties}>
          {s.sub}
        </p>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ hero pieces */

export function SceneStage({ doc, compact = false }: { doc: DDoc; compact?: boolean }) {
  return (
    <div className={`mz-stage${compact ? ' mz-stage--compact' : ''}`}>
      <span className="mz-aura" aria-hidden="true" />
      <HudLens />
      <Scene3D variant={doc.scene} />
    </div>
  );
}

export function IntroText({ doc, columns = false }: { doc: DDoc; columns?: boolean }) {
  if (!doc.intro && !doc.effective && !doc.badge) return null;
  return (
    <div className={`mz-intro${columns ? ' mz-intro--cols' : ''}`}>
      {doc.intro ? (
        <div className="mz-intro-text">
          <p data-reveal="">{doc.intro}</p>
          {doc.introMore.map((t, i) => (
            <p key={i} data-reveal="" style={{ ['--d' as string]: `${(i + 1) * 90}ms` } as CSSProperties}>
              {t}
            </p>
          ))}
        </div>
      ) : null}
      {doc.effective ? (
        <p className="mz-effective" data-reveal="">
          {doc.effective}
        </p>
      ) : null}
      {doc.badge ? (
        <p className="mz-badge" data-reveal="">
          <span>{doc.badge.label}</span>
          {doc.badge.text}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ closing */

export function Closing({ doc }: { doc: DDoc }) {
  const any = doc.outro || doc.ctas.length || doc.footnote || doc.related?.length || doc.corporate?.length;
  if (!any) return null;
  return (
    <section className="mz-end lx-wrap" aria-label="Next steps">
      <div className="mz-end-panel" data-reveal="scale">
        <span className="mz-end-aurora" aria-hidden="true" />
        <span className="mz-end-grid" aria-hidden="true" />
        {doc.outro ? (
          <div className="mz-outro">
            {doc.outro.heading ? <Display text={doc.outro.heading} as="h2" className="mz-outro-title" /> : null}
            <p data-reveal="">{doc.outro.text}</p>
          </div>
        ) : null}
        <Cta ctas={doc.ctas} tone="light" delay={120} />
        {doc.related?.length ? (
          <ul className="mz-related">
            {doc.related.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>
                  {l.label}
                  <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {doc.corporate?.length ? (
          <div className="mz-corporate">
            {doc.corporate.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ) : null}
      </div>
      {doc.footnote ? <p className="mz-footnote">{doc.footnote}</p> : null}
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
    <div className="mz-slot lx lxc" id="contact-form">
      <div className="mz-paper" data-reveal="scale">
        <h2 className="mz-slot-title">{CONTACT_PAGE.form.heading}</h2>
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </div>
    </div>
  );
}

function AssessmentSlot() {
  return (
    <div className="mz-slot mz-asm" id="begin">
      <div className="mz-paper" data-reveal="scale">
        <h2 className="mz-slot-title">{ASSESSMENT_PAGE.form.heading}</h2>
        <EntryForm />
      </div>
    </div>
  );
}

function BlogSlot() {
  if (ARTICLES.length === 0) {
    return (
      <div className="mz-slot">
        <div className="mz-paper mz-empty" data-reveal="scale">
          <span className="mz-empty-orb" aria-hidden="true">
            <span />
          </span>
          <h2 className="mz-slot-title">{INSIGHTS_PAGE.emptyState.heading}</h2>
          {INSIGHTS_PAGE.emptyState.paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="mz-slot">
      <div className="mz-articles">
        {ARTICLES.map((article) => (
          <Link href={`/blog/${article.slug}`} className="lx-card mz-article" data-tilt="4" data-reveal="" key={article.slug}>
            <p className="mz-eyebrow">{article.category}</p>
            <h3 className="mz-label">{article.title}</h3>
            <p>{article.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** The 19-section interactive example, set on a white sheet so it reads in every design. */
function ExampleViewer() {
  return (
    <div className="mz-slot mz-slot--viewer lx lxr">
      <div className="mz-paper mz-paper--wide" data-reveal="">
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

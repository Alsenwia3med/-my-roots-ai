/**
 * PUB-04 Example Report (C-05).
 *
 * Zones, in the order C-05 lists them:
 *   1 Intro            example-only badge and disclaimer
 *   2 Report viewer    all 19 sections using approved sample data
 *   3 Sticky contents  section links
 *   4 CTA              Start Your Assessment
 *   5 Footer disclaimer  full educational boundary
 *
 * Content comes from lib/content/example-report.ts, which transcribes C-03 §8's reference
 * sample. The page renders the governed 19-section architecture with the seven canonical
 * domains; it introduces no finding, recommendation or category of its own.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { CLASSIFICATION_EXPLANATIONS, COPY, DOMAIN_MEANINGS, EDUCATIONAL_BADGE } from '@/lib/report/c03-content';
import { EXAMPLE, EXAMPLE_SECTIONS } from '@/lib/content/example-report';
import { EXAMPLE_REPORT } from '@/lib/content/c04-pages';
import { classify } from '@/lib/report/build';
import { ArrowRight } from 'lucide-react';
import PageHero from '@/components/lux/PageHero';

export const metadata: Metadata = {
  title: EXAMPLE_REPORT.meta!.title,
  description: EXAMPLE_REPORT.meta!.description,
};

export default function ExampleReportPage() {
  return (
    <div className="lx lxr">
      <main id="main">
        {/* z1 — intro, with the example-only badge */}
        <PageHero kicker="ROOTS / EXAMPLE REPORT" title={EXAMPLE_REPORT.headline} intro={EXAMPLE_REPORT.intro} scene="rings">
          <p className="lxr-badge">
            <span>Example only</span>
            Fictional sample data. {EXAMPLE_REPORT.bullets[0]}
          </p>
        </PageHero>

        <div className="lxr-body lx-wrap">
          {/* z3 — sticky contents */}
          <nav aria-label="Report sections" className="lxr-contents">
            <p>19 sections</p>
            <ol>
              {EXAMPLE_SECTIONS.map((section) => (
                <li key={section.number}>
                  <a href={`#section-${section.number}`}>
                    <span aria-hidden="true">{String(section.number).padStart(2, '0')}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* z2 — the report viewer */}
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

                {/* Section 7 — the seven canonical domains, in the fixed C-03 display order.
                    Every bar states its number and classification, so nothing is carried by
                    colour or length alone (C-03 RPT-04). */}
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

                {/* Section 8 — domains and a protective factor are labelled differently, so the
                    two are never read as equivalent constructs. */}
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

                {/* Section 16 — the thirteen modules a real report organises answers by. */}
                {section.modules ? (
                  <ol className="lxr-modules">
                    {section.modules.map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ol>
                ) : null}

                {/* Section 19 — the fixed disclaimer, in full, never truncated. */}
                {section.number === 19 ? <p className="lxr-disclaimer">{COPY.disclaimer}</p> : null}

                {section.number === 3 ? (
                  <p className="lxr-note">{CLASSIFICATION_EXPLANATIONS[EXAMPLE.stateClassification]}</p>
                ) : null}
              </section>
            ))}
          </div>
        </div>

        {/* z4 — CTA */}
        <div className="lxl-actions lx-wrap">
          <Link className="lx-btn lx-btn--primary" href="/assessment" data-magnetic="">
            <span>Start Your Assessment</span>
            <ArrowRight className="lx-arrow" size={17} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>

        {/* z5 — footer disclaimer: the full educational boundary */}
        <section className="lxr-boundary lx-wrap">
          <div className="lx-deep lxr-boundary-panel lx-on-deep" data-reveal="scale">
            <p className="lxr-badge lxr-badge--deep">
              <span>Example only</span>
              {EDUCATIONAL_BADGE}
            </p>
            <p>{COPY.disclaimer}</p>
          </div>
        </section>
      </main>
    </div>
  );
}

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

export const metadata: Metadata = {
  title: EXAMPLE_REPORT.meta!.title,
  description: EXAMPLE_REPORT.meta!.description,
};

export default function ExampleReportPage() {
  return (
    <div className="clone-page">
      <main className="marketing-page inner-page public-page" id="main">
        {/* z1 — intro, with the example-only badge */}
        <section className="page-heading">
          <p className="marketing-kicker">ROOTS / EXAMPLE REPORT</p>
          <h1>{EXAMPLE_REPORT.headline}</h1>
          <p>{EXAMPLE_REPORT.intro}</p>
          <p className="example-badge">
            <span>Example only</span>
            Fictional sample data. {EXAMPLE_REPORT.bullets[0]}
          </p>
        </section>

        <div className="example-body">
          {/* z3 — sticky contents */}
          <nav aria-label="Report sections" className="example-contents">
            <p>19 sections</p>
            <ol>
              {EXAMPLE_SECTIONS.map((section) => (
                <li key={section.number}>
                  <a href={`#section-${section.number}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          {/* z2 — the report viewer */}
          <div className="example-viewer">
            {EXAMPLE_SECTIONS.map((section) => (
              <section className="example-section" id={`section-${section.number}`} key={section.number}>
                <p className="example-number">Section {section.number} of 19</p>
                <h2>{section.title}</h2>

                {section.figure ? (
                  <p className="example-figure">
                    <strong>{section.figure.value}</strong>
                    {section.figure.unit ? <span className="example-unit">{section.figure.unit}</span> : null}
                    {section.figure.label ? <span className="example-class">{section.figure.label}</span> : null}
                  </p>
                ) : null}

                {section.content ? <p className="example-copy">{section.content}</p> : null}

                {/* Section 7 — the seven canonical domains, in the fixed C-03 display order.
                    Every bar states its number and classification, so nothing is carried by
                    colour or length alone (C-03 RPT-04). */}
                {section.bars ? (
                  <ul className="example-bars">
                    {section.bars.map((bar) => {
                      const classification = classify(bar.score);
                      return (
                        <li key={bar.domain_id}>
                          <span className="example-bar-label">
                            <strong>{bar.label}</strong>
                            <span>{DOMAIN_MEANINGS[bar.domain_id]}</span>
                          </span>
                          <span className="example-bar-track">
                            <span className="example-bar-fill" data-class={classification} style={{ width: `${bar.score}%` }} />
                          </span>
                          <span className="example-bar-value">
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
                    <ul className="example-triad">
                      {section.triad.map((element) => (
                        <li data-kind={element.kind} key={element.label}>
                          <span>{element.kind === 'driver' ? 'Domain' : 'Protective factor'}</span>
                          <strong>{element.label}</strong>
                        </li>
                      ))}
                    </ul>
                    <p className="example-note">The diagram shows possible relationships between these areas, not causes.</p>
                  </>
                ) : null}

                {/* Section 16 — the thirteen modules a real report organises answers by. */}
                {section.modules ? (
                  <ol className="example-modules">
                    {section.modules.map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ol>
                ) : null}

                {/* Section 19 — the fixed disclaimer, in full, never truncated. */}
                {section.number === 19 ? <p className="example-disclaimer">{COPY.disclaimer}</p> : null}

                {section.number === 3 ? (
                  <p className="example-note">{CLASSIFICATION_EXPLANATIONS[EXAMPLE.stateClassification]}</p>
                ) : null}
              </section>
            ))}
          </div>
        </div>

        {/* z4 — CTA */}
        <div className="center-actions">
          <Link className="primary-button" href="/assessment">
            Start Your Assessment
          </Link>
        </div>

        {/* z5 — footer disclaimer: the full educational boundary */}
        <section className="example-footer-boundary">
          <p className="example-badge">
            <span>Example only</span>
            {EDUCATIONAL_BADGE}
          </p>
          <p>{COPY.disclaimer}</p>
        </section>
      </main>
    </div>
  );
}

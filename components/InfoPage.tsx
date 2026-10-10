// Inner-page design copied from clonedwebsite/components/InfoPage.tsx; styles scoped in app/clone-pages.css.

import Link from 'next/link';

/**
 * Shared layout for the simple informational and legal pages: a heading block,
 * a grid of short sections, and the Start Your Assessment action.
 */
export default function InfoPage({
  kicker,
  title,
  intro,
  sections,
}: {
  kicker: string;
  title: string;
  intro: string;
  sections: [string, string][];
}) {
  return (
    <div className="clone-page">
      <main id="main" className="marketing-page inner-page">
      <section className="page-heading">
        <p className="marketing-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>
      <section className="info-section-grid">
        {sections.map(([heading, body]) => (
          <article key={heading}>
            <h2>{heading}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>
      <div className="center-actions">
        <Link className="primary-button" href="/assessment">
          Start Your Assessment
        </Link>
      </div>
    </main>
      </div>
  );
}

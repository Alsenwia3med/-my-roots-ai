/**
 * Shared layout for the five governed legal notices (C-04 §§4-8).
 *
 * The pages carry no copy of their own: every sentence comes from lib/content/c04-legal.ts, so
 * the controlled wording lives in one place and can be checked against C-04 by test rather than
 * by reading five files. C-04 §1 forbids replacing governed legal content with shortened
 * summaries, so nothing here truncates, collapses or reflows a section away.
 *
 * Structure follows the other inner pages — `marketing-page inner-page`, a `page-heading` block
 * and `center-actions` — so a legal notice sits in the same container, on the same left edge,
 * with the same eyebrow, title and card treatment as About or Platform. What it adds is only
 * what a long governed document needs and a three-card page does not: a contents list, a
 * reading measure, and a category table.
 *
 * Server component; only the print control is client-side.
 */

import Link from 'next/link';
import CookiePreferencesButton from './CookiePreferencesButton';
import PrintButton from './PrintButton';
import type { LegalDocument } from '@/lib/content/c04-legal';

const slug = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function LegalPage({ doc }: { doc: LegalDocument }) {
  const numbered = doc.blocks.length > 1;

  return (
    <div className="clone-page">
      <main id="main" className="marketing-page inner-page">
        <section className="page-heading">
          <p className="marketing-kicker">{doc.kicker}</p>
          <h1>{doc.title}</h1>
          {doc.effective ? <p>{doc.effective.line}</p> : null}
          <PrintButton />
        </section>

        <div className={`legal-body${numbered ? '' : ' legal-body-single'}`}>
          {numbered ? (
            // A disclosure rather than a sidebar that vanishes: below 1024px it collapses, so a
            // fourteen-section notice is still navigable on a phone. From 1024px the CSS shows
            // the list whatever its open state, so the sidebar is always there.
            <details className="legal-contents">
              <summary>Contents</summary>
              <ol>
                {doc.blocks.map((block) => (
                  <li key={block.heading}>
                    <a href={`#${slug(block.heading)}`}>{block.heading}</a>
                  </li>
                ))}
              </ol>
            </details>
          ) : null}

          <article className="legal-article">
            {/* LEG-04 z2 "Callout", LEG-05 z2 "Summary" — the boundary before the full text. */}
            {doc.callout ? (
              <p className="legal-callout">{doc.callout}</p>
            ) : null}

            {doc.blocks.map((block, i) => (
              <section key={block.heading} id={slug(block.heading)}>
                {/* A single-block notice whose only heading repeats the page title would give
                    the page two headings saying the same thing. */}
                {numbered || block.heading !== doc.title ? (
                  <h2>
                    {numbered ? `${i + 1}. ` : ''}
                    {block.heading}
                  </h2>
                ) : null}
                {block.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </section>
            ))}

            {/* LEG-04 z4 "Emergency: fixed local-emergency direction", as its own zone. */}
            {doc.emergency ? (
              <section id="emergency">
                <h2>In an emergency</h2>
                <p className="legal-emergency">{doc.emergency}</p>
              </section>
            ) : null}

            {/* LEG-03 z3 "Preferences: open consent panel". */}
            {/* C-05 LEG-03 z3 is "open consent panel"; the banner wording is already the body
                above it (z2), so this zone is the control, not a second copy of the text. */}
            {doc.preferences ? (
              <section id="preferences">
                <h2>Your choices</h2>
                <CookiePreferencesButton />
              </section>
            ) : null}

            {/* Vendor-authored disclosures C-04 does not supply, kept visibly apart from the
                controlled text above rather than mixed into it. ROOTS directed these on
                1 October 2026; each is registered in the vendor copy register with its support. */}
            {doc.vendorNotes ? (
              <section id="additional-disclosures">
                <h2>{doc.vendorNotes.heading}</h2>
                {doc.vendorNotes.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </section>
            ) : null}

            {doc.table ? (
              <section id="categories">
                <h2>{doc.table.caption}</h2>
                <table className="legal-table">
                  <thead>
                    <tr>
                      {doc.table.columns.map((c) => (
                        <th key={c} scope="col">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {doc.table.rows.map((row) => (
                      <tr key={row[0]}>
                        <th scope="row">{row[0]}</th>
                        {row.slice(1).map((cell, i) => (
                          // data-label carries the column name into the stacked mobile layout,
                          // where the header row is visually hidden.
                          <td key={cell} data-label={doc.table!.columns[i + 1]}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {doc.table.note ? <p className="legal-table-note">{doc.table.note}</p> : null}
              </section>
            ) : null}

            {doc.references?.length ? (
              <section id="references">
                <h2>Official legal reference links</h2>
                <ul className="legal-references">
                  {doc.references.map((r) => (
                    <li key={r.label}>
                      {r.href ? (
                        <a href={r.href} rel="noreferrer noopener" target="_blank">
                          {r.label}
                        </a>
                      ) : (
                        r.label
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* LEG-01 z4 "Rights CTA: contact / data-rights request channel". */}
            {doc.rightsCta ? (
              <section id="rights">
                <h2>Requesting your rights</h2>
                <p>{doc.rightsCta.text}</p>
                <Link className="legal-cta" href={doc.rightsCta.href}>
                  {doc.rightsCta.label}
                </Link>
              </section>
            ) : null}

            {/* LEG-05 z4 "Versioning: current disclaimer/version identifier". */}
            {doc.effective ? (
              <section id="effective">
                <p className="legal-effective">
                  {doc.effective.line}
                  {doc.effective.note ? ` ${doc.effective.note}` : ''}
                </p>
              </section>
            ) : null}

            {/* LEG-02 z4, LEG-04 z5, LEG-05 z5 "Related". */}
            {doc.related?.length ? (
              <section id="related">
                <h2>Related notices</h2>
                <ul className="legal-related">
                  {doc.related.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </article>
        </div>

        <div className="center-actions">
          <Link className="primary-button" href="/assessment">
            Start Your Assessment
          </Link>
        </div>
      </main>
    </div>
  );
}

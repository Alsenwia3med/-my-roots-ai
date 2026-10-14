/**
 * Shared layout for the five governed legal notices (C-04 §§4-8).
 *
 * The pages carry no copy of their own: every sentence comes from lib/content/c04-legal.ts, so
 * the controlled wording lives in one place and can be checked against C-04 by test rather than
 * by reading five files. C-04 §1 forbids replacing governed legal content with shortened
 * summaries, so nothing here truncates, collapses or reflows a section away.
 *
 * Lux presentation: a white opening section with the governance shield, then a calm reading
 * column beside a contents list that follows the reader.
 *
 * Server component; only the print control and the contents highlight are client-side.
 */

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Siren } from 'lucide-react';
import CookiePreferencesButton from './CookiePreferencesButton';
import PrintButton from './PrintButton';
import LegalToc from './lux/LegalToc';
import PageHero from './lux/PageHero';
import { IconTile } from './lux/Icon';
import type { LegalBlock, LegalDocument } from '@/lib/content/c04-legal';

const slug = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** The running text of one legal section: paragraphs, labelled sub-sections, a list, closing paragraphs. */
function BlockBody({ block }: { block: LegalBlock }) {
  return (
    <>
      {block.paragraphs.map((p) => (
        <p key={p.slice(0, 40)}>{p}</p>
      ))}
      {block.subs?.map((sub) => (
        <div className="lxl-sub" key={sub.label}>
          <h3 className="lxl-h3">{sub.label}</h3>
          {sub.paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      ))}
      {block.list?.length ? (
        <ul className="lxl-list">
          {block.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {block.closing?.map((p) => (
        <p key={p.slice(0, 40)}>{p}</p>
      ))}
    </>
  );
}

export default function LegalPage({ doc }: { doc: LegalDocument }) {
  const numbered = doc.blocks.length > 1;

  return (
    <div className="lx lxl">
      <main id="main">
        <PageHero kicker={doc.kicker} title={doc.title} scene="shield">
          {doc.effective ? <p className="lxl-effective-top">{doc.effective.line}</p> : null}
          <PrintButton />
        </PageHero>

        <div className={`lxl-body lx-wrap${numbered ? '' : ' lxl-body--single'}`}>
          {numbered ? (
            <aside className="lxl-aside">
              <LegalToc items={doc.blocks.map((block) => ({ id: slug(block.heading), label: block.heading }))} />
            </aside>
          ) : null}

          <article className="lxl-article">
            {/* LEG-04 z2 "Callout", LEG-05 z2 "Summary" — the boundary before the full text. */}
            {doc.callout ? (
              <p className="lxl-callout" data-reveal="">
                {doc.callout}
              </p>
            ) : null}

            {doc.intro?.map((p) => (
              <p className="lxl-intro" key={p.slice(0, 40)}>
                {p}
              </p>
            ))}

            {doc.blocks.map((block, i) => (
              <section key={block.heading} id={slug(block.heading)} className="lxl-section" data-reveal="">
                {/* A single-block notice whose only heading repeats the page title would give
                    the page two headings saying the same thing. */}
                {numbered || block.heading !== doc.title ? (
                  <h2 className="lxl-h2">
                    {numbered ? <span className="lxl-num">{`${i + 1}. `}</span> : null}
                    {block.heading}
                  </h2>
                ) : null}
                <BlockBody block={block} />
              </section>
            ))}



            {/* LEG-04 z4 "Emergency: fixed local-emergency direction", as its own zone. */}
            {doc.emergency ? (
              <section id="emergency" className="lxl-section lxl-emergency" data-reveal="">
                <IconTile icon={Siren} tone="glass" />
                <div>
                  <h2 className="lxl-h2">In an emergency</h2>
                  <p>{doc.emergency}</p>
                </div>
              </section>
            ) : null}

            {/* LEG-03 z3 "Preferences: open consent panel". The banner wording is already the
                body above it (z2), so this zone is the control, not a second copy of the text. */}
            {doc.preferences ? (
              <section id="preferences" className="lxl-section" data-reveal="">
                <h2 className="lxl-h2">Your choices</h2>
                <CookiePreferencesButton />
              </section>
            ) : null}

            {/* Vendor-authored disclosures C-04 does not supply, kept visibly apart from the
                controlled text above rather than mixed into it. */}
            {doc.vendorNotes ? (
              <section id="additional-disclosures" className="lxl-section lxl-vendor" data-reveal="">
                <h2 className="lxl-h2">{doc.vendorNotes.heading}</h2>
                {doc.vendorNotes.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </section>
            ) : null}

            {doc.table ? (
              <section id="categories" className="lxl-section" data-reveal="">
                <h2 className="lxl-h2">{doc.table.caption}</h2>
                <div className="lxl-table-wrap">
                  <table className="lxl-table">
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
                            // data-label carries the column name into the stacked mobile layout.
                            <td key={cell} data-label={doc.table!.columns[i + 1]}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {doc.table.note ? <p className="lxl-table-note">{doc.table.note}</p> : null}
              </section>
            ) : null}

            {doc.references?.length ? (
              <section id="references" className="lxl-section" data-reveal="">
                <h2 className="lxl-h2">Official legal reference links</h2>
                <ul className="lxl-references">
                  {doc.references.map((r) => (
                    <li key={r.label}>
                      {r.href ? (
                        <a href={r.href} rel="noreferrer noopener" target="_blank">
                          <span>{r.label}</span>
                          <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
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
              <section id="rights" className="lxl-section lxl-rights" data-reveal="">
                <h2 className="lxl-h2">Requesting your rights</h2>
                <p>{doc.rightsCta.text}</p>
                <Link className="lx-btn lx-btn--secondary" href={doc.rightsCta.href}>
                  <span>{doc.rightsCta.label}</span>
                  <ArrowRight className="lx-arrow" size={16} strokeWidth={2} aria-hidden="true" />
                </Link>
              </section>
            ) : null}

            {/* LEG-05 z4 "Versioning: current disclaimer/version identifier". */}
            {doc.effective ? (
              <section id="effective" className="lxl-section">
                <p className="lxl-effective">
                  {doc.effective.line}
                  {doc.effective.note ? ` ${doc.effective.note}` : ''}
                </p>
              </section>
            ) : null}

            {/* LEG-02 z4, LEG-04 z5, LEG-05 z5 "Related". */}
            {doc.related?.length ? (
              <section id="related" className="lxl-section" data-reveal="">
                <h2 className="lxl-h2">Related Notices</h2>
                <ul className="lxl-related">
                  {doc.related.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="lx-card" data-tilt="4">
                        <span>{link.label}</span>
                        <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {doc.corporate ? (
              <section id="corporate-information" className="lxl-section" data-reveal="">
                <h2 className="lxl-h2">{doc.corporate.heading}</h2>
                <BlockBody block={doc.corporate} />
              </section>
            ) : null}
          </article>
        </div>

        <div className="lxl-actions lx-wrap">
          <Link className="lx-btn lx-btn--primary" href="/assessment" data-magnetic="">
            <span>Start Your Assessment</span>
            <ArrowRight className="lx-arrow" size={17} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </main>
    </div>
  );
}

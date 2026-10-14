// PUB-11 Blog Landing (C-05). Copy is the v1.21 publication-candidate document ("Insights").

import type { Metadata } from 'next';
import Link from 'next/link';
import { ARTICLES, categories } from '@/lib/content/blog';
import { INSIGHTS_PAGE as PAGE } from '@/lib/content/website-v121-pages';
import { ArrowRight } from 'lucide-react';
import PageHero from '@/components/lux/PageHero';
import { ZoneSheet } from '@/components/PublicPage';

export const metadata: Metadata = {
  title: `${PAGE.headline} — ROOTS-AI™`,
  description: PAGE.intro,
};

// UTC: a post date must not read differently on the server and in the browser (point 34).
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function BlogPage() {
  const [featured, ...rest] = ARTICLES;
  const filters = categories();

  return (
    <div className="lx lxb">
      <main id="main">
        {/* z1 — hero and editorial boundary */}
        <PageHero
          kicker={PAGE.kicker}
          title={PAGE.headline}
          intro={
            <>
              <strong className="lxp-tagline">{PAGE.tagline}</strong>
              <p>{PAGE.intro}</p>
            </>
          }
          scene="wave"
        />

        <ZoneSheet zones={PAGE.before} />

        <div className="lxb-body lx-wrap">

          {/* z4 — filters only where there is something to filter */}
          {filters.length > 1 ? (
            <nav aria-label="Categories" className="lxb-filters">
              {filters.map((category) => (
                <span className="lxz-pill" key={category}>
                  {category}
                </span>
              ))}
            </nav>
          ) : null}

          {ARTICLES.length === 0 || !featured ? (
            /* z5 — approved launch state; no placeholder cards stand in for articles */
            <section className="lxb-empty" id="articles" data-reveal="scale">
              <span className="lxb-empty-orb" aria-hidden="true">
                <span />
              </span>
              <h2 className="lx-h2">{PAGE.emptyState.heading}</h2>
              {PAGE.emptyState.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </section>
          ) : (
            <>
              {/* z2 — featured */}
              <section className="lxb-featured" id="articles" data-reveal="">
                <Link href={`/blog/${featured.slug}`} className="lx-card" data-tilt="3">
                  <p className="lxb-meta">
                    {featured.category} · {dateFormat.format(new Date(featured.published))}
                  </p>
                  <h2 className="lx-h2">{featured.title}</h2>
                  <p className="lx-text">{featured.excerpt}</p>
                </Link>
              </section>

              {/* z3 — grid */}
              {rest.length ? (
                <section className="lxb-grid" data-stagger="90">
                  {rest.map((article) => (
                    <article key={article.slug} data-reveal="">
                      <Link href={`/blog/${article.slug}`} className="lx-card" data-tilt="5">
                        <p className="lxb-meta">
                          {article.category} · {dateFormat.format(new Date(article.published))}
                        </p>
                        <h3 className="lx-h3">{article.title}</h3>
                        <p className="lx-text">{article.excerpt}</p>
                      </Link>
                    </article>
                  ))}
                </section>
              ) : null}
            </>
          )}
        </div>

        <ZoneSheet zones={PAGE.after} />

        <div className="lxl-actions lx-wrap">
          {PAGE.ctas.map((cta, i) => (
            <Link
              className={`lx-btn ${i === 0 ? 'lx-btn--primary' : 'lx-btn--secondary'}`}
              href={cta.href}
              key={cta.href}
              data-magnetic=""
            >
              <span>{cta.label}</span>
              {i === 0 ? <ArrowRight className="lx-arrow" size={17} strokeWidth={2} aria-hidden="true" /> : null}
            </Link>
          ))}
        </div>

        <p className="lxd-footnote lx-wrap">{PAGE.footnote}</p>
      </main>
    </div>
  );
}

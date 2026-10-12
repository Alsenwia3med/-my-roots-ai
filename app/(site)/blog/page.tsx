// PUB-11 Blog Landing (C-05). Copy is C-04 §3 "/blog".

import type { Metadata } from 'next';
import Link from 'next/link';
import { ARTICLES, categories } from '@/lib/content/blog';
import { BLOG, BLOG_EMPTY_STATE } from '@/lib/content/c04-pages';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import PageHero from '@/components/lux/PageHero';
import { IconTile } from '@/components/lux/Icon';

export const metadata: Metadata = {
  title: `${BLOG.headline} — ROOTS-AI™`,
  description: BLOG.intro,
};

// UTC: a post date must not read differently on the server and in the browser (point 34).
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function BlogPage() {
  const [featured, ...rest] = ARTICLES;
  const filters = categories();
  const boundaryIcons = [BadgeCheck, ShieldCheck];

  return (
    <div className="lx lxb">
      <main id="main">
        {/* z1 — hero and editorial boundary */}
        <PageHero kicker="ROOTS / INSIGHTS" title={BLOG.headline} intro={BLOG.intro} scene="wave" />

        <div className="lxb-body lx-wrap">
          <section className="lxb-boundary" data-stagger="90">
            <ul className="lxz-points">
              {BLOG.bullets.map((bullet, i) => (
                <li key={bullet} className="lx-card lxz-point" data-tilt="5" data-reveal="">
                  <IconTile icon={boundaryIcons[i] ?? BadgeCheck} />
                  <p className="lx-text">{bullet}</p>
                </li>
              ))}
            </ul>
          </section>

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
              <p>{BLOG_EMPTY_STATE}</p>
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
      </main>
    </div>
  );
}

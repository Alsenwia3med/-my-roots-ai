// PUB-11 Blog Landing (C-05). Copy is C-04 §3 "/blog".

import type { Metadata } from 'next';
import Link from 'next/link';
import { ARTICLES, categories } from '@/lib/content/blog';
import { BLOG, BLOG_EMPTY_STATE } from '@/lib/content/c04-pages';

export const metadata: Metadata = {
  title: `${BLOG.headline} — ROOTS-AI™`,
  description: BLOG.intro,
};

// UTC: a post date must not read differently on the server and in the browser (point 34).
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function BlogPage() {
  const [featured, ...rest] = ARTICLES;
  const filters = categories();

  return (
    <div className="clone-page">
      <main className="marketing-page inner-page public-page" id="main">
        {/* z1 — hero and editorial boundary */}
        <section className="page-heading">
          <p className="marketing-kicker">ROOTS / INSIGHTS</p>
          <h1>{BLOG.headline}</h1>
          <p>{BLOG.intro}</p>
        </section>

        <div className="blog-body">
          <section className="blog-boundary">
            <ul className="pz-points">
              {BLOG.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </section>

          {/* z4 — filters only where there is something to filter */}
          {filters.length > 1 ? (
            <nav aria-label="Categories" className="blog-filters">
              {filters.map((category) => (
                <span className="blog-chip" key={category}>
                  {category}
                </span>
              ))}
            </nav>
          ) : null}

          {ARTICLES.length === 0 || !featured ? (
            /* z5 — approved launch state; no placeholder cards stand in for articles */
            <section className="blog-empty" id="articles">
              <p>{BLOG_EMPTY_STATE}</p>
            </section>
          ) : (
            <>
              {/* z2 — featured */}
              <section className="blog-featured" id="articles">
                <Link href={`/blog/${featured.slug}`}>
                  <p className="blog-meta">
                    {featured.category} · {dateFormat.format(new Date(featured.published))}
                  </p>
                  <h2>{featured.title}</h2>
                  <p className="blog-excerpt">{featured.excerpt}</p>
                </Link>
              </section>

              {/* z3 — grid */}
              {rest.length ? (
                <section className="blog-grid">
                  {rest.map((article) => (
                    <article key={article.slug}>
                      <Link href={`/blog/${article.slug}`}>
                        <p className="blog-meta">
                          {article.category} · {dateFormat.format(new Date(article.published))}
                        </p>
                        <h3>{article.title}</h3>
                        <p className="blog-excerpt">{article.excerpt}</p>
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

/**
 * PUB-12 Blog Article Template (C-05).
 *
 * Zones, in the order C-05 lists them: 1 Breadcrumb · 2 Article header · 3 Body (720 px column,
 * semantic headings, citations) · 4 Share (copy link only) · 5 Related (up to three) ·
 * 6 Disclaimer · 7 CTA.
 *
 * No article is approved for Phase 1, so every slug is a 404 rather than a placeholder. The
 * template reads lib/content/blog.ts, so an approved article renders as soon as ROOTS adds one —
 * and cannot be added without the author, review date and sources C-04 requires.
 *
 * This route previously rendered an invented article, with an invented author and invented
 * health content, presented as published. That is removed: an article nobody approved is a
 * claim nobody made.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ShareLink from './ShareLink';
import { ARTICLES, findArticle } from '@/lib/content/blog';
import { MEDICAL_DISCLAIMER } from '@/lib/content/c04-legal';
import { BLOG } from '@/lib/content/c04-pages';

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = findArticle((await params).slug);
  if (!article) return { title: `${BLOG.headline} — ROOTS-AI™` };
  return { title: `${article.title} — ROOTS-AI™`, description: article.excerpt };
}

// UTC: a post date must not read differently on the server and in the browser (point 34).
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = findArticle((await params).slug);
  if (!article) notFound();

  const related = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <div className="clone-page">
      <main className="marketing-page inner-page public-page" id="main">
        <div className="article-body">
          {/* z1 — breadcrumb */}
          <nav aria-label="Breadcrumb" className="article-crumbs">
            <Link href="/blog">Insights</Link>
            <span aria-hidden="true">/</span>
            <span>{article.category}</span>
          </nav>

          {/* z2 — header, carrying the editorial controls C-04 requires */}
          <header className="article-header">
            <h1>{article.title}</h1>
            <p className="article-subtitle">{article.subtitle}</p>
            <dl className="article-meta">
              <div>
                <dt>Author</dt>
                <dd>{article.author}</dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>{dateFormat.format(new Date(article.published))}</dd>
              </div>
              <div>
                <dt>Reviewed</dt>
                <dd>{dateFormat.format(new Date(article.reviewed))}</dd>
              </div>
              <div>
                <dt>Reading time</dt>
                <dd>{article.readingMinutes} min</dd>
              </div>
            </dl>
          </header>

          {/* z3 — body, held to the reading measure */}
          <article className="article-prose">
            {article.body.map((block) => (
              <section key={block.heading ?? block.paragraphs[0].slice(0, 30)}>
                {block.heading ? <h2>{block.heading}</h2> : null}
                {block.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </section>
            ))}

            <section className="article-sources">
              <h2>Sources</h2>
              <ul>
                {article.sources.map((source) => (
                  <li key={source.label}>
                    {source.href ? (
                      <a href={source.href} rel="noreferrer noopener" target="_blank">
                        {source.label}
                      </a>
                    ) : (
                      source.label
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </article>

          {/* z4 — share: copy link only */}
          <ShareLink />

          {/* z5 — related, up to three */}
          {related.length ? (
            <section className="article-related">
              <h2>Related</h2>
              <ul>
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* z6 — educational boundary, in approved C-04 wording */}
          <section className="article-disclaimer">
            <p>{MEDICAL_DISCLAIMER.callout}</p>
            <p>{BLOG.bullets[1]}</p>
          </section>

          {/* z7 — CTA */}
          <div className="center-actions">
            <Link className="primary-button" href="/assessment">
              Start Your Assessment
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

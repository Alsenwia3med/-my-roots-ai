/**
 * Blog (Insights) — the same hero, rows and boxes as the other public pages. Approved articles are
 * listed only when ROOTS has approved some. Posts from the company LinkedIn page appear here at
 * once, as ROOTS instructed (lib/linkedin). While there is neither, the approved launch state is
 * shown, and no card stands in for an article. Copy: lib/content/website-v121-pages.ts and lib/content/blog.ts.
 */

import Link from 'next/link';
import type { PageContent } from '@/lib/content/c04-pages';
import { ARTICLES, categories } from '@/lib/content/blog';
import { INSIGHTS_PAGE as PAGE } from '@/lib/content/website-v121-pages';
import { Outro, HeroL, Rows } from './shared';
import LinkedInPosts from './LinkedInPosts';
import { RpRoot } from './RpClient';
import './rp.css';
import './rp-extra.css';
import './rp-blog.css';

// UTC: a post date must not read differently on the server and in the browser.
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const hero = { route: '/blog', headline: PAGE.headline, tagline: PAGE.tagline, intro: PAGE.intro, kicker: PAGE.kicker, ctas: [], bullets: [] } as PageContent;
const outro = {
  route: '/blog',
  headline: PAGE.headline,
  intro: PAGE.intro,
  ctas: PAGE.ctas,
  bullets: [],
  outro: {
    heading: 'Better Questions. More Responsible Understanding.',
    text: 'Good science does not need exaggerated promises to be worth reading.',
  },
  footnote: PAGE.footnote,
} as PageContent;

export default function BlogPage() {
  const [featured, ...rest] = ARTICLES;
  const filters = categories();
  const [questions, ...before] = PAGE.before;
  const questionEmojis = ['🍽️', '🌙', '🧪'];
  return (
    <RpRoot slug="blog">
      <HeroL page={hero} kicker={PAGE.kicker} />
      {questions?.items.length ? (
        <section className="sec blog-questions" aria-label="Questions we explore">
          <div className="wrap">
            <ul className="blog-question-grid rvg">
              {questions.items.map((question, index) => (
                <li className="blog-question tint r22 rvi" data-glow="" key={question} style={{ ['--i' as string]: index }}>
                  <span aria-hidden="true">{questionEmojis[index] ?? '💡'}</span>
                  <p>{question}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
      <Rows zones={before} />
      <section className="sec" id="articles">
        <div className="wrap">
          <LinkedInPosts hasArticles={ARTICLES.length > 0} />
          {filters.length > 1 ? (
            <nav aria-label="Categories" className="bfil">
              {filters.map((c) => <span key={c}>{c}</span>)}
            </nav>
          ) : null}
          {featured ? (
            <>
              <Link href={`/blog/${featured.slug}`} className="bfeat dp r28 rv lift" data-glow="">
                <p className="bmeta">{featured.category} · {dateFormat.format(new Date(featured.published))}</p>
                <h2 className="h2">{featured.title}</h2>
                <p>{featured.excerpt}</p>
              </Link>
              {rest.length ? (
                <div className="bgrid rvg">
                  {rest.map((article, i) => (
                    <Link key={article.slug} href={`/blog/${article.slug}`} className="bcard tint r22 rvi lift" style={{ ['--i' as string]: i }} data-glow="">
                      <p className="bmeta">{article.category} · {dateFormat.format(new Date(article.published))}</p>
                      <h3 className="h3">{article.title}</h3>
                      <p>{article.excerpt}</p>
                    </Link>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
      <Rows zones={PAGE.after} />
      <Outro page={outro} />
    </RpRoot>
  );
}

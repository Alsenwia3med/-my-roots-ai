/**
 * The LinkedIn posts on the Insights page, shown as they were posted: the picture, the text and a
 * link to the post. The newest is set large; the rest follow in a grid. Each post carries only
 * what the company wrote on LinkedIn — nothing here adds wording.
 */

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { LinkedInFeedPost } from '@/lib/linkedin/archive';
import { PostText } from './PostText';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** LinkedIn's mark (lucide ships no brand icons). */
function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function Cover({ post, first }: { post: LinkedInFeedPost; first?: boolean }) {
  return post.hasImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={post.imageSrc ?? `/api/v1/linkedin/media/${post.id}`}
      alt={post.title ?? ''}
      width={post.imageWidth}
      height={post.imageHeight}
      loading={first ? 'eager' : 'lazy'}
      fetchPriority={first ? 'high' : 'low'}
      decoding="async"
    />
  ) : (
    <span className="lino" aria-hidden="true"><i className="spin" /><i className="unspin" /><LinkedInMark /></span>
  );
}

function CoverLink({ post, first }: { post: LinkedInFeedPost; first?: boolean }) {
  const cover = <Cover post={post} first={first} />;
  return post.slug ? (
    <Link href={`/blog/linkedin/${post.slug}`} className="li-cover-link" aria-label={`Read ${post.title}`}>
      {cover}
    </Link>
  ) : cover;
}

function Meta({ post }: { post: LinkedInFeedPost }) {
  return (
    <p className="limeta">
      <LinkedInMark className="limark" />
      {post.author ? <span>{post.author}</span> : null}
      {post.publishedAt ? <time dateTime={post.publishedAt}>{dateFormat.format(new Date(post.publishedAt))}</time> : null}
    </p>
  );
}

function Open({ post, dark }: { post: LinkedInFeedPost; dark?: boolean }) {
  if (!post.url) return null;
  return (
    <a className={`btn ${dark ? 'bw' : 'bp'} liopen`} href={post.url} target="_blank" rel="noopener noreferrer" aria-label="Open on LinkedIn">
      <LinkedInMark className="limark" />
      LinkedIn
      <ArrowUpRight size="1em" strokeWidth={1.8} aria-hidden="true" className="ic arr" />
    </a>
  );
}

function ReadArticle({ post }: { post: LinkedInFeedPost }) {
  if (!post.slug) return null;
  return (
    <Link className="li-read-article" href={`/blog/linkedin/${post.slug}`}>
      Read full article
      <ArrowUpRight size="1em" strokeWidth={1.8} aria-hidden="true" />
    </Link>
  );
}

export default function LinkedInFeed({ posts }: { posts: LinkedInFeedPost[] }) {
  const [latest, ...rest] = posts;
  return (
    <div className="lif">
      <article className="lifeat blog-post-feature dp r28" data-glow="">
        <div className="lifr" data-tilt="">
          <div className="liframe"><div className="liimg"><CoverLink post={latest} first /><i className="lishine" aria-hidden="true" /></div></div>
        </div>
        <div className="lifc">
          <Meta post={latest} />
          {latest.title ? <h3 className="h2">{latest.slug ? <Link href={`/blog/linkedin/${latest.slug}`}>{latest.title}</Link> : latest.title}</h3> : null}
          <PostText text={latest.body} limit={latest.slug ? 300 : 640} />
          <ReadArticle post={latest} />
          <Open post={latest} dark />
        </div>
      </article>

      {rest.length ? (
        <div className="ligrid rvg">
          {rest.map((post, i) => (
            <article key={post.id} className={`lic blog-post-tile ${i % 3 === 1 ? 'dp' : 'tint'} r22`} style={{ ['--i' as string]: i % 6 }} data-glow="">
              {post.hasImage || post.title ? <div className="liimg"><CoverLink post={post} /><i className="lishine" aria-hidden="true" /></div> : null}
              <div className="licb">
                <Meta post={post} />
                {post.title ? <h3 className="h3">{post.slug ? <Link href={`/blog/linkedin/${post.slug}`}>{post.title}</Link> : post.title}</h3> : null}
                <PostText text={post.body} limit={post.hasImage ? 220 : 420} />
                <ReadArticle post={post} />
                <Open post={post} dark={i % 3 === 1} />
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

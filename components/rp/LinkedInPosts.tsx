'use client';

import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LinkedInPost } from '@/lib/linkedin/posts';
import { mergeLinkedInPosts, type LinkedInFeedPost } from '@/lib/linkedin/archive';
import { INSIGHTS_PAGE } from '@/lib/content/website-v121-pages';
import LinkedInFeed from './LinkedInFeed';

let cachedPosts: LinkedInPost[] | null = null;

function isPostsResponse(value: unknown): value is { posts: LinkedInPost[] } {
  if (!value || typeof value !== 'object' || !('posts' in value) || !Array.isArray(value.posts)) return false;
  return value.posts.every((post) =>
    post && typeof post === 'object' &&
    typeof post.id === 'string' &&
    (post.url === null || typeof post.url === 'string') &&
    typeof post.body === 'string' &&
    (post.author === null || typeof post.author === 'string') &&
    typeof post.publishedAt === 'string' &&
    typeof post.hasImage === 'boolean',
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function LoadingFeed() {
  return (
    <div className="blog-skeleton" aria-label="Loading recent ROOTS-AI posts">
      <div className="blog-skeleton-feature dp r28">
        <div className="blog-skeleton-image" />
        <div className="blog-skeleton-copy">
          <i /><b /><span /><span /><span />
        </div>
      </div>
      <div className="blog-skeleton-grid" aria-hidden="true">
        {[0, 1, 2].map((item) => <div className="blog-skeleton-card tint r22" key={item}><i /><b /><span /><span /></div>)}
      </div>
    </div>
  );
}

export default function LinkedInPosts({ hasArticles = false }: { hasArticles?: boolean }) {
  const [posts, setPosts] = useState<LinkedInFeedPost[]>(() => mergeLinkedInPosts(cachedPosts ?? []));
  const [unavailable, setUnavailable] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void fetch('/api/v1/linkedin/posts', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(`LinkedIn posts request failed (${response.status})`);
        if (!isPostsResponse(payload)) throw new Error('LinkedIn posts response was invalid');
        cachedPosts = payload.posts;
        setPosts(mergeLinkedInPosts(payload.posts));
        setUnavailable(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setUnavailable(true);
      });

    return () => controller.abort();
  }, [retry]);

  return (
    <section className="blog-stream" aria-labelledby="blog-stream-title">
      <div className="blog-stream-head rv">
        <div>
          <p className="kick">THE ROOTS-AI™ COMMUNITY</p>
          <h2 className="h2 gt" id="blog-stream-title">ROOTS-AI on LinkedIn</h2>
          <p className="lede">Updates from ROOTS-AI™ on LinkedIn, gathered in one place.</p>
        </div>
        <span className="blog-network"><LinkedInMark /> LinkedIn posts</span>
      </div>

      <div aria-live="polite" aria-busy={posts.length === 0 && !unavailable}>
        {posts.length === 0 && !unavailable ? <LoadingFeed /> : null}
        {posts.length ? <LinkedInFeed posts={posts} /> : null}
        {unavailable ? (
          <div className="blog-state tint r22" role="status">
            <div>
              <strong>Newer posts could not be loaded right now.</strong>
              <p>The imported posts are still available. Try again in a moment for newer updates.</p>
            </div>
            <button className="btn bs" type="button" onClick={() => { setUnavailable(false); setRetry((value) => value + 1); }}>
              <RefreshCw size="1em" aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : null}
        {posts.length === 0 && !hasArticles ? (
          <div className="blog-empty dp r28 rv" data-glow="">
            <span className="blog-empty-mark" aria-hidden="true"><i /><i /><LinkedInMark /></span>
            <p className="kick w">ROOTS-AI™ / INSIGHTS</p>
            <h3 className="h2">{INSIGHTS_PAGE.emptyState.heading}</h3>
            {INSIGHTS_PAGE.emptyState.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        ) : null}
      </div>
    </section>
  );
}

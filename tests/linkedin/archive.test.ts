import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { findLinkedInArchivePost, LINKEDIN_ARCHIVE, mergeLinkedInPosts } from '../../lib/linkedin/archive';

describe('LinkedIn post archive', () => {
  test('keeps the supplied order and uses only locally stored images', () => {
    const posts = mergeLinkedInPosts([]);

    assert.equal(posts.length, 10);
    assert.equal(new Set(LINKEDIN_ARCHIVE.map((post) => post.slug)).size, LINKEDIN_ARCHIVE.length);
    assert.equal(posts[0].title, 'The Scale May Be Measuring Yesterdays Night, Not Just Yesterdays Food.');
    assert.equal(posts[9].title, 'The Day Your Health Graph Changed');
    assert.equal(posts.filter((post) => post.hasImage).length, 9);
    assert(posts.every((post) => post.publishedAt === null && post.url === null));
    assert(posts.filter((post) => post.imageSrc).every((post) => post.imageSrc?.startsWith('/linkedin/')));
    assert.equal(posts[0].author, 'ROOTS-AI™');
  });

  test('resolves every article by its generated page slug', () => {
    assert(LINKEDIN_ARCHIVE.every((post) => post.slug && findLinkedInArchivePost(post.slug) === post));
  });

  test('places live posts first and avoids exact text duplicates', () => {
    const archived = mergeLinkedInPosts([])[0];
    const livePost = {
      id: 'live-1',
      url: 'https://www.linkedin.com/feed/update/urn:li:activity:1',
      body: archived.body,
      author: 'ROOTS-AI™',
      publishedAt: '2026-10-15T10:00:00.000Z',
      hasImage: false,
    };
    const posts = mergeLinkedInPosts([livePost]);

    assert.equal(posts.length, 10);
    assert.equal(posts[0].id, 'live-1');
    assert.equal(posts.filter((post) => post.body === archived.body).length, 1);
  });
});

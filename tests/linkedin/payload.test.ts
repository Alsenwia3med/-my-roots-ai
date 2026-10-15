import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { linkedInUrl, parseLinkedInPayload, plainText } from '../../lib/linkedin/payload';

describe('LinkedIn webhook payload', () => {
  test('normalizes common post fields and strips markup', () => {
    assert.deepEqual(
      parseLinkedInPayload({
        id: 'urn:li:activity:123',
        permalink: 'https://www.linkedin.com/feed/update/urn:li:activity:123',
        commentary: '<p>ROOTS &amp; health</p><p>New insight</p>',
        author_name: 'ROOTS-AI',
        published_at: '2026-10-15T09:00:00Z',
        image_url: 'https://images.example.com/post.png',
      }),
      {
        action: 'upsert',
        post: {
          externalId: 'urn:li:activity:123',
          url: 'https://www.linkedin.com/feed/update/urn:li:activity:123',
          body: 'ROOTS & health\n\nNew insight',
          author: 'ROOTS-AI',
          publishedAt: '2026-10-15T09:00:00.000Z',
          imageUrl: 'https://images.example.com/post.png',
        },
      },
    );
  });

  test('accepts delete events and rejects invalid payloads', () => {
    assert.deepEqual(parseLinkedInPayload({ id: 'post-123', action: 'delete' }), {
      action: 'delete',
      externalId: 'post-123',
    });
    assert.equal(parseLinkedInPayload({ text: 'no stable id' }), null);
    assert.equal(parseLinkedInPayload({ id: 'post-123' }), null);
  });

  test('keeps only LinkedIn links and renders HTML as text', () => {
    assert.equal(linkedInUrl('https://lnkd.in/example'), 'https://lnkd.in/example');
    assert.equal(linkedInUrl('https://example.com/post'), null);
    assert.equal(linkedInUrl('javascript:alert(1)'), null);
    assert.equal(plainText('<p>&lt;not markup&gt;</p>'), '<not markup>');
  });
});

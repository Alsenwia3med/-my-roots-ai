/**
 * POST /api/v1/linkedin/webhook — receives a post from the company LinkedIn page and shows it on
 * /blog. Zapier, Make, RSS.app or any script can call it when the page publishes:
 *
 *   Authorization: Bearer <LINKEDIN_WEBHOOK_SECRET>      (or the header x-webhook-secret)
 *   { "id": "...", "url": "https://www.linkedin.com/...", "text": "...", "image": "https://...",
 *     "published_at": "2026-10-15T09:00:00Z", "author": "ROOTS-AI™" }
 *
 * Common alternative field names are accepted (see lib/linkedin/payload.ts). A body of
 * { "id": "...", "action": "delete" } removes a post, and an array sends several at once.
 * Without LINKEDIN_WEBHOOK_SECRET the endpoint is closed.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { apiError, json } from '@/lib/api/http';
import { audit } from '@/lib/audit';
import { parseLinkedInPayload } from '@/lib/linkedin/payload';
import { deletePost, savePost } from '@/lib/linkedin/posts';

export const dynamic = 'force-dynamic';

const MAX_REQUEST_BYTES = 256 * 1024;
const MAX_BATCH = 20;

const digest = (v: string) => createHash('sha256').update(v).digest();

function authorised(request: NextRequest, secret: string): boolean {
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const given = bearer || request.headers.get('x-webhook-secret') || '';
  return given !== '' && timingSafeEqual(digest(given), digest(secret));
}

export async function POST(request: NextRequest) {
  const secret = process.env.LINKEDIN_WEBHOOK_SECRET;
  if (!secret) return apiError(503, 'NOT_CONFIGURED', 'The LinkedIn feed is not configured.');
  if (!authorised(request, secret)) {
    await audit({ action: 'linkedin.webhook', result: 'denied', actorType: 'anonymous' }).catch(() => undefined);
    return apiError(401, 'UNAUTHORIZED', 'Not authorised.');
  }

  const text = await request.text();
  if (text.length > MAX_REQUEST_BYTES) return apiError(413, 'TOO_LARGE', 'The request is too large.');
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return apiError(400, 'INVALID_REQUEST', 'Send JSON.');
  }

  const items = Array.isArray(body) ? body : [body];
  if (items.length > MAX_BATCH) return apiError(413, 'TOO_MANY_ITEMS', `Send no more than ${MAX_BATCH} posts per request.`);
  const results: { id: string | null; status: 'saved' | 'deleted' | 'not_found' | 'ignored' }[] = [];

  try {
    for (const item of items) {
      const payload = item && typeof item === 'object' && !Array.isArray(item) ? parseLinkedInPayload(item as Record<string, unknown>) : null;
      if (!payload) { results.push({ id: null, status: 'ignored' }); continue; }
      if (payload.action === 'delete') {
        const removed = await deletePost(payload.externalId);
        results.push({ id: payload.externalId, status: removed ? 'deleted' : 'not_found' });
        continue;
      }
      const id = await savePost(payload.post);
      await audit({ action: 'linkedin.post.saved', result: 'success', actorType: 'system', objectType: 'linkedin_post', objectId: id }).catch(() => undefined);
      results.push({ id, status: 'saved' });
    }
  } catch (e) {
    console.error('linkedin webhook failed:', e instanceof Error ? e.message : e);
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The post could not be saved. Please try again.');
  }

  return json({ results });
}

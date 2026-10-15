/**
 * LinkedIn posts for the Insights page: save, remove, list, and read an image back.
 *
 * ROOTS decided that anything published on the company LinkedIn page appears on /blog straight
 * away, without a review step. These posts are kept apart from lib/content/blog.ts (approved
 * articles with author, review date and sources); the page shows both.
 *
 * Images are copied into private Supabase Storage when a post arrives and served through
 * /api/v1/linkedin/media/{id}, so the Content Security Policy stays at `img-src 'self'` and an
 * expired LinkedIn image link never breaks a post. The copy is fetched with the usual SSRF
 * guards: https only, no private or internal addresses, redirects checked one by one, a size
 * cap, and the file must really be an image.
 */

import 'server-only';
import { randomUUID } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { LinkedInPostInput } from './payload';

const BUCKET = 'linkedin-media';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 10_000;

export interface LinkedInPost {
  id: string;
  url: string | null;
  body: string;
  author: string | null;
  publishedAt: string;
  hasImage: boolean;
}

export interface LinkedInPostsResult {
  posts: LinkedInPost[];
  unavailable: boolean;
}

/* ---------------------------------------------------------------- safe image fetch */

function privateV4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

export function privateAddress(ip: string): boolean {
  if (isIP(ip) === 4) return privateV4(ip);
  const v6 = ip.toLowerCase();
  if (v6 === '::' || v6 === '::1') return true;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v6);
  if (mapped) return privateV4(mapped[1]);
  return /^(fc|fd|fe[89ab])/.test(v6);
}

async function assertPublicHost(url: URL): Promise<void> {
  if (url.protocol !== 'https:') throw new Error('image must be https');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addresses.length || addresses.some((a) => privateAddress(a.address))) throw new Error('image host is not public');
}

function sniff(b: Uint8Array): { type: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { type: 'image/jpeg', ext: 'jpg' };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { type: 'image/png', ext: 'png' };
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return { type: 'image/gif', ext: 'gif' };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { type: 'image/webp', ext: 'webp' };
  return null;
}

async function fetchImage(start: string): Promise<{ bytes: Uint8Array; type: string; ext: string }> {
  let url = new URL(start);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url);
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), headers: { accept: 'image/*' } });
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get('location');
      if (!next) throw new Error('redirect without location');
      url = new URL(next, url);
      continue;
    }
    if (!res.ok || !res.body) throw new Error(`image request failed (${res.status})`);
    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > MAX_IMAGE_BYTES) throw new Error('image too large');
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) { await reader.cancel(); throw new Error('image too large'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let at = 0;
    for (const c of chunks) { bytes.set(c, at); at += c.byteLength; }
    const kind = sniff(bytes);
    if (!kind) throw new Error('not a supported image');
    return { bytes, ...kind };
  }
  throw new Error('too many redirects');
}

/* ---------------------------------------------------------------- storage */

/** Saves or updates a post. The image is copied once; a failed copy keeps the post without it. */
export async function savePost(post: LinkedInPostInput): Promise<string> {
  const admin = getSupabaseAdmin();
  const { data: existing, error: readError } = await admin
    .from('linkedin_posts')
    .select('id, image_path')
    .eq('external_id', post.externalId)
    .maybeSingle();
  if (readError) throw new Error(`linkedin_posts read failed: ${readError.message}`);

  let image: { path: string; type: string } | null = null;
  if (post.imageUrl && !existing?.image_path) {
    try {
      const file = await fetchImage(post.imageUrl);
      const path = `${randomUUID()}.${file.ext}`;
      const { error } = await admin.storage.from(BUCKET).upload(path, file.bytes, { contentType: file.type, upsert: false });
      if (error) throw new Error(error.message);
      image = { path, type: file.type };
    } catch (e) {
      console.error('linkedin image copy failed:', e instanceof Error ? e.message : e);
    }
  }

  const { data, error } = await admin
    .from('linkedin_posts')
    .upsert(
      {
        external_id: post.externalId,
        url: post.url,
        body: post.body,
        author_name: post.author,
        published_at: post.publishedAt,
        updated_at: new Date().toISOString(),
        ...(image ? { image_path: image.path, image_type: image.type } : {}),
      },
      { onConflict: 'external_id' },
    )
    .select('id')
    .single();
  if (error || !data) throw new Error(`linkedin_posts save failed: ${error?.message ?? 'no row'}`);
  return data.id as string;
}

export async function deletePost(externalId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data } = await admin.from('linkedin_posts').select('id, image_path').eq('external_id', externalId).maybeSingle();
  if (!data) return false;
  const { error } = await admin.from('linkedin_posts').delete().eq('id', data.id);
  if (error) throw new Error(`linkedin_posts delete failed: ${error.message}`);
  if (data.image_path) await admin.storage.from(BUCKET).remove([data.image_path]);
  return true;
}

/** Newest first. Read every stored post in pages so older company posts are not hidden. */
export async function listPosts(): Promise<LinkedInPostsResult> {
  try {
    const admin = getSupabaseAdmin();
    const pageSize = 1000;
    const posts: LinkedInPost[] = [];

    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await admin
        .from('linkedin_posts')
        .select('id, url, body, author_name, published_at, image_path')
        .order('published_at', { ascending: false })
        .range(offset, offset + pageSize - 1)
        .abortSignal(AbortSignal.timeout(1000));
      if (error) throw new Error(error.message);
      posts.push(...(data ?? []).map((r) => ({
        id: r.id as string,
        url: (r.url as string | null) ?? null,
        body: (r.body as string) ?? '',
        author: (r.author_name as string | null) ?? null,
        publishedAt: r.published_at as string,
        hasImage: Boolean(r.image_path),
      })));
      if (!data || data.length < pageSize) return { posts, unavailable: false };
    }
  } catch (e) {
    console.error('linkedin posts unavailable:', e instanceof Error ? e.message : e);
    return { posts: [], unavailable: true };
  }
}

export async function readPostImage(id: string): Promise<{ bytes: ArrayBuffer; type: string } | null> {
  const admin = getSupabaseAdmin();
  const { data } = await admin.from('linkedin_posts').select('image_path, image_type').eq('id', id).maybeSingle();
  if (!data?.image_path) return null;
  const file = await admin.storage.from(BUCKET).download(data.image_path as string);
  if (file.error || !file.data) return null;
  return { bytes: await file.data.arrayBuffer(), type: (data.image_type as string) || 'application/octet-stream' };
}

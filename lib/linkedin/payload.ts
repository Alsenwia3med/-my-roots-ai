/**
 * Reads the request an automation (Zapier, Make, RSS.app, or a script) sends when the company
 * LinkedIn page publishes. Those tools name their fields differently, so the common names are
 * accepted. The result is plain, bounded and safe to store: HTML is reduced to text, and only
 * https links are kept.
 */

export interface LinkedInPostInput {
  externalId: string;
  url: string | null;
  body: string;
  author: string | null;
  publishedAt: string;
  imageUrl: string | null;
}

export type LinkedInPayload =
  | { action: 'upsert'; post: LinkedInPostInput }
  | { action: 'delete'; externalId: string };

export const MAX_BODY = 12000;

const first = (o: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

const str = (v: unknown): string | null => {
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return null;
};

/** The link of an object such as { url } (RSS enclosures and media blocks use this shape). */
const urlOf = (v: unknown): unknown => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>).url : v);

export function plainText(input: string): string {
  return input
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function httpsUrl(v: unknown): string | null {
  const s = str(urlOf(v));
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' && !u.username && !u.password ? u.toString() : null;
  } catch {
    return null;
  }
}

/** A LinkedIn post link: https on linkedin.com, www.linkedin.com or the lnkd.in short domain. */
export function linkedInUrl(v: unknown): string | null {
  const s = httpsUrl(v);
  if (!s) return null;
  const host = new URL(s).hostname.toLowerCase();
  return host === 'linkedin.com' || host.endsWith('.linkedin.com') || host === 'lnkd.in' ? s : null;
}

export function toIsoDate(v: unknown): string {
  let d: Date | null = null;
  if (typeof v === 'number' && Number.isFinite(v)) d = new Date(v < 1e12 ? v * 1000 : v);
  else if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    d = Number.isFinite(n) && /^\d{9,13}$/.test(v.trim()) ? new Date(n < 1e12 ? n * 1000 : n) : new Date(v);
  }
  if (!d || Number.isNaN(d.getTime()) || d.getTime() > Date.now() + 24 * 3600 * 1000) return new Date().toISOString();
  return d.toISOString();
}

export function parseLinkedInPayload(raw: Record<string, unknown>): LinkedInPayload | null {
  const url = linkedInUrl(first(raw, ['url', 'link', 'post_url', 'postUrl', 'permalink']));
  const externalId = str(first(raw, ['id', 'post_id', 'postId', 'urn', 'activity_id', 'guid'])) ?? url;
  if (!externalId || externalId.length > 400) return null;

  const action = str(raw.action)?.toLowerCase();
  if (action === 'delete' || action === 'deleted' || action === 'remove') return { action: 'delete', externalId };

  const textRaw = str(first(raw, ['text', 'content', 'commentary', 'description', 'body', 'message', 'title']));
  const body = textRaw ? plainText(textRaw).slice(0, MAX_BODY) : '';
  const imageUrl = httpsUrl(first(raw, ['image', 'image_url', 'imageUrl', 'media_url', 'mediaUrl', 'picture', 'enclosure', 'thumbnail']));
  if (!body && !imageUrl) return null;

  const author = str(first(raw, ['author', 'author_name', 'authorName', 'company', 'organization']));
  return {
    action: 'upsert',
    post: {
      externalId,
      url,
      body,
      author: author ? plainText(author).slice(0, 120) : null,
      publishedAt: toIsoDate(first(raw, ['published_at', 'publishedAt', 'published', 'date', 'pubDate', 'created_at', 'createdAt', 'timestamp'])),
      imageUrl,
    },
  };
}

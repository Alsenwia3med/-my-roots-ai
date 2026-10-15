/**
 * GET /api/v1/linkedin/media/{post id} — the copy of a LinkedIn post's image. Public, because the
 * posts are public; served from this origin so the Content Security Policy stays `img-src 'self'`.
 */

import { UUID_PATTERN } from '@/lib/api/http';
import { readPostImage } from '@/lib/linkedin/posts';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return new Response('Not found', { status: 404 });
  try {
    const image = await readPostImage(id);
    if (!image) return new Response('Not found', { status: 404 });
    return new Response(image.bytes, {
      headers: {
        'Content-Type': image.type,
        'Content-Length': String(image.bytes.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    console.error('linkedin media failed:', e instanceof Error ? e.message : e);
    return new Response('Unavailable', { status: 503 });
  }
}

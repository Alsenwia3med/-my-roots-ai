// GET /api/v1/linkedin/posts — public ROOTS-AI LinkedIn posts for the Insights page.

import { apiError, json } from '@/lib/api/http';
import { listPosts } from '@/lib/linkedin/posts';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await listPosts();
  if (result.unavailable) return apiError(503, 'LINKEDIN_UNAVAILABLE', 'LinkedIn posts are temporarily unavailable.');
  return json({ posts: result.posts });
}

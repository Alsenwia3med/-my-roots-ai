// GET /api/v1/auth/session — whether the session is still valid; calling it also refreshes the
// session (proxy.ts), which is how the assessment "stay signed in" action extends it.

import { json } from '@/lib/api/http';
import { getParticipant } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { user } = await getParticipant();
  return json({ authenticated: Boolean(user) }, user ? 200 : 401);
}

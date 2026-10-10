// POST /api/v1/auth/sign-out — ends the participant session (Master Requirements 2.2 logout /
// revocation). The refresh token is revoked with Supabase Auth and the cookies are cleared.

import { json } from '@/lib/api/http';
import { audit } from '@/lib/audit';
import { getParticipant } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const { supabase, user } = await getParticipant();
  await supabase.auth.signOut();
  if (user) await audit({ action: 'auth.sign_out', result: 'success', actorId: user.id, objectType: 'session' });
  return json({ status: 'signed_out' });
}

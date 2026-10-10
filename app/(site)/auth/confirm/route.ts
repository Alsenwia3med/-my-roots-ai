/**
 * GET /auth/confirm?token_hash=…&type=magiclink — verifies a one-time secure link with Supabase
 * Auth and starts the participant session (httpOnly, Secure, SameSite cookies managed by
 * @supabase/ssr). Invalid, used or expired links go to ASM-03 without exposing token details.
 */

import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { audit } from '@/lib/audit';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set<EmailOtpType>(['magiclink', 'email']);

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
  const failure = NextResponse.redirect(new URL('/assessment/link-error', request.url));

  if (!tokenHash || !type || !ALLOWED_TYPES.has(type) || tokenHash.length > 512) {
    await audit({ action: 'auth.secure_link.verified', result: 'denied', details: { reason: 'malformed' } });
    return failure;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error || !data.user) {
    await audit({ action: 'auth.secure_link.verified', result: 'denied', details: { reason: 'invalid_or_expired' } });
    return failure;
  }

  await audit({ action: 'auth.secure_link.verified', result: 'success', actorId: data.user.id, objectType: 'session' });
  return NextResponse.redirect(new URL('/assessment/continue', request.url));
}

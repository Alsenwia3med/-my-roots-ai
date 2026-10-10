/**
 * GET /auth/callback?code=… — finish an OAuth (Google) sign-in.
 *
 * Exchanges the one-time code for a Supabase session (httpOnly cookies via @supabase/ssr) and
 * continues to the page saved by /api/v1/auth/google in a short-lived cookie (or ?next= for
 * links made before that change), always restricted to a relative path. Failures return to ADM-01
 * without exposing provider or token detail.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/lib/admin/format';
import { audit } from '@/lib/audit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OAUTH_NEXT_COOKIE } from '@/lib/auth/oauth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = safeNextPath(request.cookies.get(OAUTH_NEXT_COOKIE)?.value ?? request.nextUrl.searchParams.get('next'), '/admin');
  const failure = NextResponse.redirect(new URL('/admin?error=provider', request.url));

  if (!code || code.length > 1024) {
    await audit({ action: 'auth.oauth.verified', result: 'denied', details: { reason: 'malformed' } });
    return failure;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    await audit({ action: 'auth.oauth.verified', result: 'denied', details: { reason: 'exchange_failed' } });
    return failure;
  }

  await audit({ action: 'auth.oauth.verified', result: 'success', actorId: data.user.id, objectType: 'session', details: { provider: 'google' } });
  const done = NextResponse.redirect(new URL(next, request.url));
  done.cookies.set(OAUTH_NEXT_COOKIE, '', { path: '/auth/callback', maxAge: 0 });
  return done;
}

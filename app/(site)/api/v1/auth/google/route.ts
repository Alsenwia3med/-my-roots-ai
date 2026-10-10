/**
 * GET /api/v1/auth/google?next=/admin — start Google sign-in through Supabase Auth.
 *
 * Google returns the user to Supabase (https://<project>.supabase.co/auth/v1/callback), which
 * returns them to /auth/callback here with a one-time code. The Google client ID and secret
 * are configured in the Supabase dashboard (Authentication > Providers > Google); this
 * application never holds them. PKCE: the code verifier is kept in an httpOnly cookie.
 *
 * The return address sent to Supabase is always exactly <APP_URL>/auth/callback, with no query
 * string: Supabase matches it against its Redirect URLs allow-list, and a query parameter would
 * make an exact entry fail (Supabase then falls back to its Site URL). The page to continue to
 * after sign-in travels in a short-lived httpOnly cookie instead.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/lib/admin/format';
import { audit } from '@/lib/audit';
import { appUrl } from '@/lib/env';
import { OAUTH_NEXT_COOKIE } from '@/lib/auth/oauth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get('next'), '/admin');
  const failure = NextResponse.redirect(new URL(`/admin?error=provider`, request.url));

  try {
    const callback = new URL('/auth/callback', appUrl(request.nextUrl.origin));

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.toString(), skipBrowserRedirect: true },
    });
    if (error || !data?.url) {
      console.error('google sign-in start failed:', error?.message);
      await audit({ action: 'auth.oauth.started', result: 'failure', details: { provider: 'google' } });
      return failure;
    }
    const response = NextResponse.redirect(data.url);
    response.cookies.set(OAUTH_NEXT_COOKIE, next, {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/auth/callback',
      maxAge: 10 * 60,
    });
    return response;
  } catch (e) {
    console.error('google sign-in start failed:', e instanceof Error ? e.message : e);
    return failure;
  }
}

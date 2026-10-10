/**
 * Proxy (Next.js 16; formerly Middleware) — refreshes the Supabase Auth session on every
 * authorized request so a participant who leaves and returns resumes without being signed out
 * (C-05 ASM-07/ASM-08; M1 "Resume").
 *
 * Server Components cannot write cookies, so a token refreshed inside a page render would be
 * lost (see lib/supabase/server.ts). Refreshing here, where the response is still writable, is
 * the only place the rotated access and refresh tokens can be persisted.
 *
 * This is a session refresh, not an authorization check: access control stays in the page
 * guards (lib/assessment/guards.ts), the API handlers and the database's Row Level Security.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabasePublicConfig } from '@/lib/env';

export async function proxy(request: NextRequest) {
  const config = supabasePublicConfig();
  let response = NextResponse.next({ request });
  if (!config) return response;

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() validates the session with Supabase Auth and rotates the tokens when they are
  // close to expiry; setAll above writes the rotated cookies onto the outgoing response.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    '/assessment/:path*',
    '/auth/:path*',
    '/admin/:path*',
    '/report/:path*',
    '/account/:path*',
    '/api/v1/assessments/:path*',
    '/api/v1/consents',
    '/api/v1/admin/:path*',
    '/api/v1/me/:path*',
    '/api/v1/reports/:path*',
    '/api/v1/profile',
  ],
};

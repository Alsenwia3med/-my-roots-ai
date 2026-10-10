/**
 * Supabase client bound to the signed-in participant's session cookies (Supabase Auth).
 * Queries run as the `authenticated` role, so Row Level Security applies to every read and write.
 */

import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabasePublicConfig } from '@/lib/env';

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const config = supabasePublicConfig();
  if (!config) throw new Error('Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');

  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}

/** The verified participant (validated with Supabase Auth, not just read from the cookie). */
export async function getParticipant() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

/**
 * Service-role Supabase client. Server-only: used for Supabase Auth administration (secure-link
 * generation), server-validated state transitions (submit / archive) and audit records.
 * Never imported by client components; the key is never exposed to the browser.
 */

import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }
  client = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return client;
}

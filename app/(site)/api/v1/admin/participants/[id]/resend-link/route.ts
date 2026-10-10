/**
 * POST /api/v1/admin/participants/{id}/resend-link — ADM-03/04 "resend approved link".
 * Emails the participant a fresh one-time secure link, exactly as if they had requested it.
 * Admin or Super Admin; confirmed in the interface first; always audited.
 */

import { apiError, json, UUID_PATTERN } from '@/lib/api/http';
import { requireStaffApi } from '@/lib/admin/guard';
import { audit } from '@/lib/audit';
import { emailConfigured, sendSecureLinkEmail } from '@/lib/email/mailer';
import { appUrl, magicLinkExpiryMinutes } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return apiError(404, 'NOT_FOUND', 'Participant not found.');

  const auth = await requireStaffApi(['admin', 'super_admin']);
  if ('error' in auth) return auth.error;
  const { ctx } = auth;

  // Read with the staff session: RLS confirms this staff member may see the profile.
  const { data: profile } = await ctx.supabase.from('profiles').select('email').eq('id', id).maybeSingle();
  if (!profile?.email) return apiError(404, 'NOT_FOUND', 'Participant not found.');
  if (!(await emailConfigured())) return apiError(503, 'EMAIL_UNAVAILABLE', 'Email is not configured for this environment.');

  try {
    const { data, error } = await getSupabaseAdmin().auth.admin.generateLink({ type: 'magiclink', email: profile.email as string });
    if (error || !data?.properties?.hashed_token) throw new Error(error?.message ?? 'no token');

    const link = new URL('/auth/confirm', appUrl(new URL(request.url).origin));
    link.searchParams.set('token_hash', data.properties.hashed_token);
    link.searchParams.set('type', 'magiclink');
    await sendSecureLinkEmail(profile.email as string, link.toString(), magicLinkExpiryMinutes());
  } catch (e) {
    console.error('admin resend link failed:', e instanceof Error ? e.message : e);
    await audit({ action: 'admin.link.resent', result: 'failure', actorType: 'admin', actorId: ctx.user.id, objectType: 'profile', objectId: id });
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The link could not be sent. Please try again.');
  }

  await audit({ action: 'admin.link.resent', result: 'success', actorType: 'admin', actorId: ctx.user.id, objectType: 'profile', objectId: id });
  return json({ status: 'sent' });
}

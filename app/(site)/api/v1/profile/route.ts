/**
 * PUT /api/v1/profile { display_name } — the participant's name for their report cover.
 *
 * Written with the participant's own session: RLS limits it to their own profile row, and the
 * column privilege limits it to display_name (and locale). An empty value clears the name. The
 * audit event records that the name changed, never the name itself.
 */

import { apiError, json, readJsonObject, requireParticipant } from '@/lib/api/http';
import { audit } from '@/lib/audit';
import { LIMITS, rateLimited } from '@/lib/api/rateLimit';
import { PENDING } from '@/lib/assessment/copy';
import { normalizeDisplayName } from '@/lib/profile/displayName';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  const auth = await requireParticipant();
  if ('unauthorized' in auth) return auth.unauthorized;
  const { supabase, user } = auth;

  const limited = await rateLimited(user.id, LIMITS.profileUpdate);
  if (limited) return limited;

  const body = await readJsonObject(request);
  const name = normalizeDisplayName(body?.display_name);
  if (!name.ok) return apiError(400, 'INVALID_NAME', PENDING.reportNameInvalid);

  // .select() returns the updated row, so "nothing was updated" is caught rather than reported as saved.
  const { data, error } = await supabase.from('profiles').update({ display_name: name.value }).eq('id', user.id).select('id');
  if (error || !data?.length) {
    console.error('profile update failed:', error?.message ?? 'no profile row');
    return apiError(503, 'SERVICE_UNAVAILABLE', PENDING.reportNameSaveFailed);
  }

  await audit({ action: 'profile.updated', result: 'success', actorId: user.id, objectType: 'profile', objectId: user.id, details: { field: 'display_name', cleared: name.value === null } });
  return json({ display_name: name.value });
}

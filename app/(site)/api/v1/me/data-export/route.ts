/**
 * GET /api/v1/me/data-export — the signed-in participant downloads all of their personal data
 * as JSON (GDPR Art. 15 access, Art. 20 portability). Rate limited and audited; the audit
 * event records that an export happened, never its content.
 */

import { NextResponse } from 'next/server';
import { apiError, requireParticipant } from '@/lib/api/http';
import { LIMITS, rateLimited } from '@/lib/api/rateLimit';
import { audit } from '@/lib/audit';
import { collectParticipantData } from '@/lib/privacy/data';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireParticipant();
  if ('unauthorized' in auth) return auth.unauthorized;
  const { user } = auth;

  const limited = await rateLimited(user.id, LIMITS.dataExport);
  if (limited) return limited;

  let data;
  try {
    data = await collectParticipantData(getSupabaseAdmin(), user.id);
  } catch (e) {
    console.error('personal data export failed:', e instanceof Error ? e.message : e);
    return apiError(503, 'SERVICE_UNAVAILABLE', 'Your data could not be prepared. Please try again.');
  }

  await audit({ action: 'privacy.data.exported', result: 'success', actorId: user.id, objectType: 'profile', objectId: user.id, details: { assessments: data.assessments.length } });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="roots-ai-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}

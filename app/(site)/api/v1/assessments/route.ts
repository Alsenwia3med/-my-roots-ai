/**
 * /api/v1/assessments
 *   GET   the participant's in-progress assessment (or null)
 *   POST  start an assessment; returns the existing one if one is already in progress
 * Requires sign-in and a current service consent.
 */

import { apiError, json, requireParticipant } from '@/lib/api/http';
import { audit } from '@/lib/audit';
import { LIMITS, rateLimited } from '@/lib/api/rateLimit';
import { QUESTIONNAIRE_VERSION } from '@/lib/assessment/questionBank';
import { getInProgressAssessment, hasServiceConsent } from '@/lib/assessment/store';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ASSESSMENT_SOURCE_VERSIONS } from '@/lib/versions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireParticipant();
  if ('unauthorized' in auth) return auth.unauthorized;
  return json({ assessment: await getInProgressAssessment(auth.supabase) });
}

export async function POST(request: Request) {
  const auth = await requireParticipant();
  if ('unauthorized' in auth) return auth.unauthorized;
  const { supabase, user } = auth;

  if (!(await hasServiceConsent(supabase, user.id))) {
    return apiError(403, 'CONSENT_REQUIRED', 'Consent is required before starting the assessment.');
  }

  const existing = await getInProgressAssessment(supabase);
  if (existing) return json({ assessment: existing });

  const limited = await rateLimited(user.id, LIMITS.startAssessment);
  if (limited) return limited;

  // Device class only; no fingerprinting.
  const ua = request.headers.get('user-agent') ?? '';
  const deviceClass = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';

  const { data, error } = await supabase
    .from('assessments')
    .insert({ profile_id: user.id, questionnaire_version: QUESTIONNAIRE_VERSION, device_metadata: { device_class: deviceClass } })
    .select('id, status, current_module, progress_percent, questionnaire_version, started_at, last_saved_at')
    .single();

  if (error) {
    // A concurrent request may have created it first (one in progress per participant).
    const raced = await getInProgressAssessment(supabase);
    if (raced) return json({ assessment: raced });
    console.error('assessment create failed:', error.message);
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again.');
  }

  // M2 item 7: record the controlled question bank this assessment is answered against. Written
  // with the service role: the database refuses this column from a browser session.
  const { error: stampError } = await getSupabaseAdmin()
    .from('assessments')
    .update({ source_versions: ASSESSMENT_SOURCE_VERSIONS })
    .eq('id', data.id)
    .is('source_versions', null);
  if (stampError) console.error('assessment source stamp failed:', stampError.message);

  await audit({ action: 'assessment.started', result: 'success', actorId: user.id, objectType: 'assessment', objectId: data.id, details: { source: ASSESSMENT_SOURCE_VERSIONS.c01.label } });
  return json({ assessment: data }, 201);
}

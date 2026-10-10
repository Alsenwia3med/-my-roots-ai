/**
 * POST /api/v1/consents { service: true, research: boolean } — records ASM-04 consent.
 * Service consent is required; research consent is a separate optional record that is stored
 * whether granted or declined, with no effect on service access (C-05 ASM-04; C-04 §9).
 * Records are append-only and capture the document version, effective date and a SHA-256 of
 * the exact consent text shown.
 */

import { createHash } from 'node:crypto';
import { apiError, json, readJsonObject, requireParticipant } from '@/lib/api/http';
import { audit } from '@/lib/audit';
import { LEGAL_VERSION, PENDING, SYSTEM } from '@/lib/assessment/copy';

export const dynamic = 'force-dynamic';

const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

export async function POST(request: Request) {
  const auth = await requireParticipant();
  if ('unauthorized' in auth) return auth.unauthorized;
  const { supabase, user } = auth;

  const body = await readJsonObject(request);
  if (body?.service !== true) return apiError(400, 'SERVICE_CONSENT_REQUIRED', PENDING.consentRequired);
  const research = body.research === true;

  const base = {
    profile_id: user.id,
    document_version: LEGAL_VERSION.version,
    document_effective_date: LEGAL_VERSION.effectiveDateIso,
  };
  const { error } = await supabase.from('consents').insert([
    { ...base, consent_type: 'service', granted: true, purpose: 'service', consent_text_sha256: sha256(SYSTEM.consentService) },
    { ...base, consent_type: 'research', granted: research, purpose: 'pilot_research', consent_text_sha256: sha256(SYSTEM.consentResearch) },
  ]);
  if (error) {
    console.error('consent insert failed:', error.message);
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again.');
  }

  await audit({ action: 'consent.recorded', result: 'success', actorId: user.id, objectType: 'consent', details: { service: true, research } });
  return json({ status: 'recorded' }, 201);
}

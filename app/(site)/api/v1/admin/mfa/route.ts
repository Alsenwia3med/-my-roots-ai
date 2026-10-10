/**
 * POST /api/v1/admin/mfa — ADM-01 multi-factor authentication (TOTP, Supabase Auth MFA).
 *
 *   { action: 'enroll' }                      first-time setup: returns a QR code and setup key
 *   { action: 'verify', factorId, code }      6-digit code -> session raised to AAL2
 *
 * Only accounts holding an active staff role may use this. Enrolment is allowed only while
 * the account has no verified factor: an existing authenticator is never replaced from here,
 * so a stolen session cannot add its own. Lost devices go through controlled recovery
 * (a Super Admin resets the factor), never a security-question fallback.
 */

import { apiError, json, readJsonObject } from '@/lib/api/http';
import { getStaffState } from '@/lib/admin/guard';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const state = await getStaffState();
  if (state.kind === 'signed_out') return apiError(401, 'SESSION_EXPIRED', 'Sign in to continue.');
  if (state.kind === 'no_role') return apiError(403, 'FORBIDDEN', 'You do not have access to this action.');
  const { supabase, user } = state.ctx;

  const body = await readJsonObject(request);

  if (body?.action === 'enroll') {
    if (state.kind !== 'enroll') return apiError(409, 'ALREADY_ENROLLED', 'An authenticator is already set up for this account.');

    // Clear any half-finished enrolment before starting a new one.
    const { data: factors } = await supabase.auth.mfa.listFactors();
    for (const f of factors?.all ?? []) {
      if (f.factor_type === 'totp' && f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
    }

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `ROOTS-AI admin ${Date.now()}` });
    if (error || !data) {
      console.error('mfa enroll failed:', error?.message);
      return apiError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again.');
    }
    await audit({ action: 'admin.mfa.enrolment_started', result: 'success', actorType: 'admin', actorId: user.id });
    return json({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  }

  if (body?.action === 'verify') {
    const factorId = typeof body.factorId === 'string' ? body.factorId : '';
    const code = typeof body.code === 'string' ? body.code.replace(/\s/g, '') : '';
    if (!factorId || !/^\d{6}$/.test(code)) return apiError(400, 'INVALID_CODE', 'Enter the 6-digit code from your authenticator app.');

    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) {
      await audit({ action: 'admin.mfa.verified', result: 'denied', actorType: 'admin', actorId: user.id });
      return apiError(400, 'INVALID_CODE', 'That code did not match. Check your authenticator app and try again.');
    }
    await audit({ action: 'admin.mfa.verified', result: 'success', actorType: 'admin', actorId: user.id });
    return json({ status: 'verified' });
  }

  return apiError(400, 'INVALID_REQUEST', 'Unknown action.');
}

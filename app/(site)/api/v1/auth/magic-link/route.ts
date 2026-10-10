/**
 * POST /api/v1/auth/magic-link { email, ageConfirmed } — request a secure assessment link
 * (C-06 §2; C-05 ASM-01/ASM-02; Master Requirements 2.2).
 *
 * - Supabase Auth issues a one-time link (the user is created on first request); expiry is the
 *   project's Email OTP expiration, which must equal MAGIC_LINK_EXPIRY_MINUTES.
 * - The link is emailed over SMTP. The response is identical whether or not the address has
 *   an account, so account existence is never revealed.
 * - Rate limited per email address (MAGIC_LINK_MAX_REQUESTS per 15 minutes) using keyed
 *   digests in audit_logs, so the limit holds across serverless instances.
 * - Demo sign-in (link returned in the response) works only when APP_ENV is development or
 *   staging and MAGIC_LINK_DEMO_MODE=true; it is ignored in production.
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, json, readJsonObject } from '@/lib/api/http';
import { audit, hashIdentifier } from '@/lib/audit';
import { VAL } from '@/lib/assessment/validation';
import { emailConfigured, sendSecureLinkEmail } from '@/lib/email/mailer';
import { appEnv, appUrl, demoSignInEnabled, magicLinkExpiryMinutes, magicLinkMaxRequests } from '@/lib/env';
import { ensureAccount } from '@/lib/auth/provisioning';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const Body = z.object({
  email: z.email().max(254),
  ageConfirmed: z.literal(true),
});

const WINDOW_MS = 15 * 60 * 1000;


export async function POST(request: NextRequest) {
  try {
    return await requestSecureLink(request);
  } catch (e) {
    // Unexpected failures (configuration, network, Supabase client) return a handled response
    // instead of an unhandled 500; the reason is logged server-side only.
    console.error('secure link request failed:', e instanceof Error ? e.message : e);
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again.');
  }
}

async function requestSecureLink(request: NextRequest) {
  const body = await readJsonObject(request);
  if (!body) return apiError(400, 'INVALID_REQUEST', 'Enter a valid email address.');
  const parsed = Body.safeParse({
    email: typeof body?.email === 'string' ? body.email.trim().toLowerCase() : body?.email,
    ageConfirmed: body?.ageConfirmed,
  });
  if (!parsed.success) {
    const ageIssue = parsed.error.issues.some((i) => i.path[0] === 'ageConfirmed');
    return ageIssue
      ? apiError(400, 'AGE_ELIGIBILITY', VAL['VAL-010'])
      : apiError(400, 'INVALID_EMAIL', 'Enter a valid email address.');
  }

  const { email } = parsed.data;
  const emailHash = hashIdentifier(email);
  const admin = getSupabaseAdmin();

  const { count, error: countError, status: countStatus } = await admin
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'auth.secure_link.requested')
    .eq('result', 'success')
    .contains('details', { email_hash: emailHash })
    .gte('occurred_at', new Date(Date.now() - WINDOW_MS).toISOString());
  if (countError) {
    // HEAD requests carry no error body, so the HTTP status is the useful signal
    // (404 = audit_logs table missing, 401 = wrong service-role key).
    console.error(
      `secure link rate-limit check failed: status=${countStatus} code=${countError.code || '-'} message=${countError.message || '-'}`
    );
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again.');
  }
  if ((count ?? 0) >= magicLinkMaxRequests()) {
    await audit({ action: 'auth.secure_link.requested', result: 'denied', details: { email_hash: emailHash, reason: 'rate_limited' } });
    return apiError(429, 'RATE_LIMITED', 'Too many requests. Please wait a few minutes and try again.');
  }

  const sendEmail = await emailConfigured();
  const demo = demoSignInEnabled();
  if (!sendEmail && !demo && appEnv() !== 'development') {
    console.error('secure link requested but email is not configured and demo sign-in is not permitted');
    return apiError(503, 'EMAIL_UNAVAILABLE', 'The service is temporarily unavailable. Please try again.');
  }

  /*
   * The account must exist before a link is generated for it: Supabase issues a token for an
   * unknown address that then fails to verify, so a first-time participant's first link was
   * always dead. `created` and `existing` are both success and produce the same response, so
   * account existence is still never revealed.
   */
  const provisioned = await ensureAccount(admin, email);
  if (provisioned === 'failed') {
    console.error('secure link account provisioning failed for a requested address');
    await audit({ action: 'auth.secure_link.requested', result: 'failure', details: { email_hash: emailHash, reason: 'provision_failed' } });
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again.');
  }

  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error || !data?.properties?.hashed_token) {
    console.error('secure link generation failed:', error?.message);
    await audit({ action: 'auth.secure_link.requested', result: 'failure', details: { email_hash: emailHash, reason: 'generate_failed' } });
    return apiError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again.');
  }

  const link = new URL('/auth/confirm', appUrl(request.nextUrl.origin));
  link.searchParams.set('token_hash', data.properties.hashed_token);
  link.searchParams.set('type', 'magiclink');

  if (sendEmail) {
    try {
      await sendSecureLinkEmail(email, link.toString(), magicLinkExpiryMinutes());
    } catch (e) {
      console.error('secure link email failed:', e instanceof Error ? e.message : e);
      await audit({ action: 'auth.secure_link.requested', result: 'failure', details: { email_hash: emailHash, reason: 'email_failed' } });
      return apiError(503, 'EMAIL_UNAVAILABLE', 'We could not send your secure link. Please try again.');
    }
  } else if (appEnv() === 'development') {
    console.info(`[development] secure link: ${link.toString()}`);
  }

  await audit({
    action: 'auth.secure_link.requested',
    result: 'success',
    details: { email_hash: emailHash, delivery: sendEmail ? 'email' : demo ? 'demo' : 'development_log' },
  });

  return json({ status: 'sent', ...(demo ? { demoLink: link.toString() } : {}) });
}

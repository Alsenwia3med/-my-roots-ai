/**
 * POST /api/v1/contact { name, email, message, website } — Contact page enquiry, emailed to the
 * team inbox (CONTACT_TO_EMAIL).
 *
 * - `website` is a honeypot hidden from people; when filled, the request is accepted and dropped.
 * - Rate limited per sender email and per client IP (CONTACT_MAX_PER_WINDOW per 15 minutes)
 *   using keyed digests in audit_logs, so the limit holds across serverless instances.
 * - The message is never stored or logged; the audit row holds digests only.
 */

import type { NextRequest } from 'next/server';
import { apiError, json, readJsonObject } from '@/lib/api/http';
import { audit, hashIdentifier } from '@/lib/audit';
import { newEnquiryReference, parseContact } from '@/lib/contact/message';
import { emailConfigured, sendContactEmail } from '@/lib/email/mailer';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 15 * 60 * 1000;
const CONTACT_MAX_PER_WINDOW = 3;
const UNAVAILABLE = 'We could not send your message. Please try again later.';

export async function POST(request: NextRequest) {
  try {
    return await submitContact(request);
  } catch (e) {
    console.error('contact submission failed:', e instanceof Error ? e.message : e);
    return apiError(503, 'SERVICE_UNAVAILABLE', UNAVAILABLE);
  }
}

async function submitContact(request: NextRequest) {
  const body = await readJsonObject(request);
  if (!body) return apiError(400, 'INVALID_REQUEST', 'Complete all fields.');

  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return json({ status: 'sent' }); // honeypot: indistinguishable from success
  }

  const msg = parseContact(body);
  if (!msg) {
    return apiError(400, 'INVALID_CONTACT', 'Choose an enquiry type, enter your name, a valid email address, a message of at least 10 characters, and confirm the consent statement.');
  }

  if (!(await emailConfigured())) {
    console.error('contact submission received but email is not configured');
    return apiError(503, 'EMAIL_UNAVAILABLE', UNAVAILABLE);
  }

  const emailHash = hashIdentifier(msg.email);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '';
  const ipHash = ip ? hashIdentifier(ip) : null;

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const admin = getSupabaseAdmin();
  const countBy = (details: Record<string, string>) =>
    admin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'contact.submitted')
      .eq('result', 'success')
      .contains('details', details)
      .gte('occurred_at', since);

  const [byEmail, byIp] = await Promise.all([countBy({ email_hash: emailHash }), ipHash ? countBy({ ip_hash: ipHash }) : null]);
  if (byEmail.error || byIp?.error) {
    console.error(`contact rate-limit check failed: status=${byEmail.status}/${byIp?.status ?? '-'}`);
    return apiError(503, 'SERVICE_UNAVAILABLE', UNAVAILABLE);
  }
  if ((byEmail.count ?? 0) >= CONTACT_MAX_PER_WINDOW || (byIp?.count ?? 0) >= CONTACT_MAX_PER_WINDOW) {
    await audit({ action: 'contact.submitted', result: 'denied', details: { email_hash: emailHash, ip_hash: ipHash, reason: 'rate_limited' } });
    return apiError(429, 'RATE_LIMITED', 'Too many messages. Please wait a few minutes and try again.');
  }

  const reference = newEnquiryReference();

  try {
    await sendContactEmail(msg, reference);
  } catch (e) {
    console.error('contact email failed:', e instanceof Error ? e.message : e);
    await audit({ action: 'contact.submitted', result: 'failure', details: { email_hash: emailHash, ip_hash: ipHash, reason: 'email_failed' } });
    return apiError(503, 'EMAIL_UNAVAILABLE', UNAVAILABLE);
  }

  await audit({ action: 'contact.submitted', result: 'success', details: { email_hash: emailHash, ip_hash: ipHash, reference } });
  return json({ status: 'sent', reference });
}

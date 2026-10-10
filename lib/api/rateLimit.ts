/**
 * Per-account rate limits for signed-in endpoints, counted from audit_logs so the limit holds
 * across serverless instances (the same approach as the secure-link and contact limits).
 *
 * Fails open: if the count itself cannot be read, the request proceeds — these endpoints are
 * already authenticated and protected by Row Level Security, and an audit outage must not stop
 * a participant from submitting.
 */

import 'server-only';
import { apiError } from '@/lib/api/http';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface Limit {
  action: string;
  max: number;
  windowMinutes: number;
}

export const LIMITS = {
  startAssessment: { action: 'assessment.started', max: 5, windowMinutes: 15 },
  profileUpdate: { action: 'profile.updated', max: 10, windowMinutes: 15 },
  reportRetry: { action: 'report.retry.requested', max: 5, windowMinutes: 15 },
  submit: { action: 'assessment.submitted', max: 10, windowMinutes: 15 },
  dataExport: { action: 'privacy.data.exported', max: 5, windowMinutes: 60 },
  deletionRequest: { action: 'privacy.deletion.requested', max: 5, windowMinutes: 60 },
  pdfDownload: { action: 'report.pdf.downloaded', max: 20, windowMinutes: 15 },
} satisfies Record<string, Limit>;

/** A 429 response when this account has used up the limit, otherwise null. */
export async function rateLimited(actorId: string, limit: Limit) {
  const since = new Date(Date.now() - limit.windowMinutes * 60 * 1000).toISOString();
  const { count, error } = await getSupabaseAdmin()
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('action', limit.action)
    .eq('actor_id', actorId)
    .gte('occurred_at', since);
  if (error) {
    console.error(`rate-limit check failed for ${limit.action}: status=${error.code || '-'}`);
    return null;
  }
  return (count ?? 0) >= limit.max
    ? apiError(429, 'RATE_LIMITED', 'Too many requests. Please wait a few minutes and try again.')
    : null;
}

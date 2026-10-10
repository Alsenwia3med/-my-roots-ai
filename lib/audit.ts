/**
 * Append-only audit events (Master Requirements 11: access, authentication and security events).
 * Details never contain an email address, answer, token or other direct identifier; identifiers
 * that must be correlated (email for rate limiting) are stored as keyed HMAC-SHA-256 digests.
 */

import 'server-only';
import { createHmac } from 'node:crypto';
import { appEnv } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type AuditResult = 'success' | 'denied' | 'failure';

export interface AuditEvent {
  action: string;
  result: AuditResult;
  actorType?: 'anonymous' | 'participant' | 'admin' | 'system';
  actorId?: string | null;
  objectType?: string;
  objectId?: string;
  details?: Record<string, string | number | boolean | null>;
}

export function hashIdentifier(value: string): string {
  return createHmac('sha256', auditKey()).update(value.trim().toLowerCase()).digest('hex');
}

/**
 * HMAC key for audit digests. AUDIT_HMAC_SECRET is preferred. When it is not set, a stable key
 * is derived from the server-only service-role key, so a missing audit secret never breaks
 * sign-in while digests stay keyed with a server secret. Setting AUDIT_HMAC_SECRET later only
 * resets the 15-minute rate-limit window.
 */
function auditKey(): string {
  const secret = process.env.AUDIT_HMAC_SECRET;
  if (secret) return secret;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    return createHmac('sha256', serviceRoleKey).update('roots-ai/audit-hmac/v1').digest('hex');
  }

  if (appEnv() === 'development') return 'development-only-audit-secret';
  throw new Error('AUDIT_HMAC_SECRET is not configured.');
}

/** Records an audit event. A failure to record is logged but never breaks the participant flow. */
export async function audit(event: AuditEvent): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin().from('audit_logs').insert({
      action: event.action,
      result: event.result,
      actor_type: event.actorType ?? (event.actorId ? 'participant' : 'anonymous'),
      actor_id: event.actorId ?? null,
      object_type: event.objectType ?? null,
      object_id: event.objectId ?? null,
      details: event.details ?? {},
    });
    if (error) console.error(`audit write failed for ${event.action}: ${error.message}`);
  } catch (error) {
    console.error(`audit write failed for ${event.action}:`, error instanceof Error ? error.message : error);
  }
}

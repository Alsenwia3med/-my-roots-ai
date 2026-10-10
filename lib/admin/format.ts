/**
 * Minimum-necessary identity for admin screens (ADM-03/04 "pseudonymous/display identity,
 * masked email").
 */

import 'server-only';
import { hashIdentifier } from '@/lib/audit';

/** "maria.lopez@gmail.com" -> "ma••••@g••••.com". */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '—';
  const [local, domain] = email.split('@');
  const dot = domain.lastIndexOf('.');
  const host = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : '';
  return `${local.slice(0, 2)}••••@${host.slice(0, 1)}••••${tld}`;
}

/**
 * A stable participant pseudonym. Keyed with the server's audit secret, so it cannot be
 * reversed to the account ID and means nothing outside this installation.
 */
export function pseudonym(profileId: string): string {
  return `P-${hashIdentifier(profileId).slice(0, 8).toUpperCase()}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });
}

/** Keep only a relative path, so a crafted ?next= cannot send anyone off-site. */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  return next;
}

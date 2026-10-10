/**
 * Canonical serialisation and hash of a report (C-03 §9 "Web and PDF must render from the same
 * stored JSON hash"). Keys are sorted at every level so the same report always serialises to
 * the same bytes, whatever order its properties were built in.
 */

import { createHash } from 'node:crypto';

export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalStringify(v)}`).join(',')}}`;
}

export function reportChecksum(report: unknown): string {
  return createHash('sha256').update(canonicalStringify(report), 'utf8').digest('hex');
}

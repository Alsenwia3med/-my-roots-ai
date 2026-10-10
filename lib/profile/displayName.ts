/**
 * The name printed on the report cover (C-03 §4.1 "participant display name or Participant").
 *
 * Optional. Letters (any script), spaces, hyphens, apostrophes and full stops only, up to 60
 * characters — so an email address, phone number or free text cannot end up on the report
 * cover. Shared by the browser (immediate feedback) and the API (the actual rule).
 */

export const DISPLAY_NAME_MAX = 60;

const ALLOWED = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;

export type DisplayNameResult = { ok: true; value: string | null } | { ok: false };

/** Trims and collapses spaces; an empty value clears the name (the report then shows "Participant"). */
export function normalizeDisplayName(input: unknown): DisplayNameResult {
  if (input === null || input === undefined) return { ok: true, value: null };
  if (typeof input !== 'string') return { ok: false };
  const value = input.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (value === '') return { ok: true, value: null };
  if (value.length > DISPLAY_NAME_MAX || !ALLOWED.test(value)) return { ok: false };
  return { ok: true, value };
}

/**
 * Cookie consent state (C-05 SYS-01; Regulatory Readiness Annex OPS-01 … OPS-03).
 *
 * The rules this implements:
 *   OPS-01  necessary / analytics / preference / marketing categories are maintained, and no
 *           unknown script runs in production;
 *   OPS-02  non-essential scripts are blocked before consent and stay blocked after refusal or
 *           withdrawal — so the default is essential-only, and `analyticsAllowed` is false
 *           until someone actively says otherwise;
 *   OPS-03  the consent version, categories and timestamp are recorded.
 *
 * Stored in localStorage rather than on the server: this covers public visitors who have no
 * account, and C-04 requires analytics consent to be recorded "without storing unnecessary
 * identifiers" — a visitor's choice about analytics does not justify creating a record that
 * identifies them. A signed-in participant's service and research consents are separate, and
 * live in the consents table.
 *
 * Nothing here loads analytics. There is no analytics provider in Phase 1; this is the gate
 * that one would have to pass, and the reason the gate is closed by default.
 */

export const CONSENT_STORAGE_KEY = 'roots-ai.cookie-consent';

/** Bumping this invalidates stored decisions and asks again, as a material change requires. */
export const CONSENT_VERSION = '1.0.1';

export interface CookieConsent {
  version: string;
  /** The only optional category in Phase 1. Advertising and session replay are not used at all. */
  analytics: boolean;
  /** ISO timestamp of the decision (OPS-03). */
  decidedAt: string;
}

export function readConsent(): CookieConsent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    // A decision recorded against an older notice is not a decision about this one.
    if (parsed.version !== CONSENT_VERSION || typeof parsed.analytics !== 'boolean') return null;
    return { version: parsed.version, analytics: parsed.analytics, decidedAt: parsed.decidedAt ?? '' };
  } catch {
    // Private browsing, blocked storage, corrupt value: treat as undecided, which is the safe end.
    return null;
  }
}

export function writeConsent(analytics: boolean): CookieConsent {
  const consent: CookieConsent = { version: CONSENT_VERSION, analytics, decidedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // If the choice cannot be stored it cannot be honoured later either; the default stays
    // essential-only, which is the outcome that does not act without permission.
  }
  return consent;
}

/** OPS-02 — the gate any future analytics loader must pass. Closed unless consent says otherwise. */
export function analyticsAllowed(): boolean {
  return readConsent()?.analytics === true;
}

/** Lets the footer and the Cookie Notice reopen the panel (C-05 SYS-01 z4 "Reopen"). */
export const OPEN_PREFERENCES_EVENT = 'roots-ai:cookie-preferences';

export function openCookiePreferences(): void {
  window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT));
}

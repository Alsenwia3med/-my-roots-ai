/**
 * The one place the participant's address is held in the browser, and the one place it is cleared.
 *
 * ROOTS decision of 30 September 2026, section 7:
 *
 *   "The participant email must not be retained in sessionStorage beyond the minimum period
 *    required for the entry/authentication flow. Remove the email immediately once it is no longer
 *    required by that flow. Clear it on successful completion/sign-out. Do not use it for offline
 *    persistence. Do not store assessment answers, scores, report content or health information in
 *    browser storage."
 *
 * ## Why it is held at all
 *
 * ASM-02 offers a resend and a "use a different email" action after the link has been sent, and
 * both need to know which address was used. It is never placed in the URL (C-05 §12), so the
 * alternative would be asking the participant to type it again to resend a link they just
 * requested.
 *
 * ## When it is removed
 *
 * | Moment | Where |
 * |---|---|
 * | The participant signs in — the flow is over | `ClearPendingEmail`, rendered by the assessment shell whenever a session exists |
 * | The participant signs out | `SignOutButton` |
 * | The participant chooses a different address | `CheckEmail` |
 * | The tab closes | `sessionStorage`, by definition |
 *
 * ## What is never held
 *
 * No answer, score, classification, report content or health information is written to browser
 * storage anywhere in this application. `tests/privacy/browserStorage.test.ts` proves it by
 * scanning the source rather than by assertion, and fails on any storage key this module and the
 * submit idempotency key do not account for.
 *
 * Every call is wrapped: `sessionStorage` throws in some private-browsing modes, and losing the
 * resend convenience must never break the screen.
 */

export const PENDING_EMAIL_KEY = 'roots-secure-link-email';

export function storePendingEmail(email: string): void {
  try {
    sessionStorage.setItem(PENDING_EMAIL_KEY, email);
  } catch {
    // Resend will be unavailable; the flow itself is unaffected.
  }
}

export function readPendingEmail(): string | null {
  try {
    return sessionStorage.getItem(PENDING_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function clearPendingEmail(): void {
  try {
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
  } catch {
    // Nothing to do: if storage is unavailable, nothing was stored.
  }
}

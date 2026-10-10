/**
 * Account provisioning for the secure-link sign-in.
 *
 * Extracted from the magic-link route so the behaviour can be tested directly. ROOTS' review of
 * 29 September 2026 (item B1) requires regression evidence for a defect that affected accepted
 * M1/M2 behaviour, including the concurrency case, and a route handler is not reachable from a
 * unit test.
 *
 * ## The defect this exists to prevent
 *
 * Supabase issues a link token for an address it has never seen, creates the account as a side
 * effect, and that token then fails to verify. A first-time participant was told to check their
 * email, clicked the link and was refused — with nothing logged, because the route behaved
 * correctly and the token genuinely was invalid. Only a second request worked, by which time the
 * account existed.
 *
 * Ensuring the account exists *before* the link is generated removes that first-attempt failure.
 */

/** The single Supabase admin call this module needs; narrowed so tests need no client. */
export interface AccountAdmin {
  auth: {
    admin: {
      createUser(attributes: { email: string; email_confirm: boolean }): Promise<{
        error: { status?: number; message?: string } | null;
      }>;
    };
  };
}

export type ProvisionOutcome =
  /** The account did not exist and was created. */
  | 'created'
  /** The account already existed, or a concurrent request created it first. */
  | 'existing'
  /** The account could not be assured; the caller must not issue a link. */
  | 'failed';

/**
 * True when the provider is telling us the address is already registered.
 *
 * Supabase reports this as 422. The message is also matched because the status is not guaranteed
 * across client versions, and treating "already registered" as a failure would break every
 * returning participant — a far worse outcome than the defect being fixed.
 */
export function isAlreadyRegistered(error: { status?: number; message?: string } | null): boolean {
  if (!error) return false;
  if (error.status === 422) return true;
  return /already|exists|registered|duplicate/i.test(error.message ?? '');
}

/**
 * Makes sure an account exists for `email` before a secure link is generated for it.
 *
 * Reveals nothing about who is already registered: `created` and `existing` are both success,
 * and the caller issues the same response either way. Only `failed` is distinguishable, and only
 * to the server.
 */
export async function ensureAccount(admin: AccountAdmin, email: string): Promise<ProvisionOutcome> {
  const { error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (!error) return 'created';

  // The loser of a race between two simultaneous first requests lands here, and so does every
  // returning participant. In both cases the account exists, which is all this promises.
  if (isAlreadyRegistered(error)) return 'existing';

  return 'failed';
}

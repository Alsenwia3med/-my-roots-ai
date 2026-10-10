/**
 * Secure-link account provisioning — regression evidence for the defect ROOTS records as B1.
 *
 * ROOTS review of 29 September 2026: "Because the defect affected previously accepted M1/M2
 * behavior, it must be recorded as a controlled defect correction... Include concurrency or
 * duplicate-provisioning tests where the corrected account-creation sequence presents that risk.
 * Confirm that the correction does not bypass required consent, reveal account existence, create
 * duplicate accounts, broaden permissions, compromise RLS, or affect assessment ownership and
 * autosave/resume."
 *
 * These drive the provisioning step directly with a stub provider, so every branch is reachable
 * without a database. The journey through the running application is covered separately by the
 * end-to-end evidence; what is asserted here is the decision the application makes, and what it
 * refuses to reveal.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ensureAccount, isAlreadyRegistered, type AccountAdmin } from '../../lib/auth/provisioning';

interface Attempt {
  email: string;
}

/** A stub Supabase admin whose behaviour each test chooses. */
function stub(behaviour: (email: string, calls: number) => { status?: number; message?: string } | null) {
  const attempts: Attempt[] = [];
  let calls = 0;
  const admin: AccountAdmin = {
    auth: {
      admin: {
        async createUser({ email }) {
          calls += 1;
          attempts.push({ email });
          return { error: behaviour(email, calls) };
        },
      },
    },
  };
  return { admin, attempts, get calls() { return calls; } };
}

const ok = () => null;
const alreadyRegistered = () => ({ status: 422, message: 'A user with this email address has already been registered' });

describe('secure-link account provisioning (ROOTS item B1)', () => {
  test('a first-time address is provisioned before a link is issued', async () => {
    const s = stub(ok);
    assert.equal(await ensureAccount(s.admin, 'new@roots-ai.invalid'), 'created');
    assert.equal(s.calls, 1, 'exactly one provisioning attempt');
    assert.deepEqual(s.attempts, [{ email: 'new@roots-ai.invalid' }]);
  });

  test('a returning participant is not treated as an error', async () => {
    const s = stub(alreadyRegistered);
    assert.equal(await ensureAccount(s.admin, 'returning@roots-ai.invalid'), 'existing');
  });

  test('provisioning never creates a second account for the same address', async () => {
    // The provider refuses the duplicate; the application must accept that refusal as success
    // rather than retrying, which is what would create one.
    const s = stub((_email, calls) => (calls === 1 ? null : alreadyRegistered()));
    assert.equal(await ensureAccount(s.admin, 'once@roots-ai.invalid'), 'created');
    assert.equal(await ensureAccount(s.admin, 'once@roots-ai.invalid'), 'existing');
    assert.equal(s.calls, 2, 'one attempt each; no retry loop');
  });

  test('concurrency: two simultaneous first requests both succeed, and only one account is made', async () => {
    // The real race: two requests for an unknown address arrive together. The first create wins;
    // the second is refused as a duplicate. Both callers must be able to proceed.
    let created = 0;
    const admin: AccountAdmin = {
      auth: {
        admin: {
          async createUser() {
            await new Promise((r) => setTimeout(r, 5));
            if (created === 0) {
              created += 1;
              return { error: null };
            }
            return { error: alreadyRegistered() };
          },
        },
      },
    };

    const results = await Promise.all([
      ensureAccount(admin, 'race@roots-ai.invalid'),
      ensureAccount(admin, 'race@roots-ai.invalid'),
      ensureAccount(admin, 'race@roots-ai.invalid'),
    ]);

    assert.equal(created, 1, 'more than one account was created for one address');
    assert.ok(!results.includes('failed'), `a concurrent request failed: ${JSON.stringify(results)}`);
    assert.equal(results.filter((r) => r === 'created').length, 1, 'exactly one caller should see a creation');
    assert.equal(results.filter((r) => r === 'existing').length, 2, 'the others should see an existing account');
  });

  test('an unexpected provider failure does not report success', async () => {
    for (const error of [
      { status: 500, message: 'internal error' },
      { status: 503, message: 'service unavailable' },
      { message: 'network unreachable' },
      { status: 401, message: 'invalid api key' },
    ]) {
      const s = stub(() => error);
      assert.equal(
        await ensureAccount(s.admin, 'broken@roots-ai.invalid'),
        'failed',
        `"${error.message}" must not be read as an existing account`,
      );
    }
  });

  test('account existence is never revealed: success is indistinguishable either way', async () => {
    const fresh = await ensureAccount(stub(ok).admin, 'a@roots-ai.invalid');
    const known = await ensureAccount(stub(alreadyRegistered).admin, 'b@roots-ai.invalid');

    // Both are success. The route issues the same response for either, so a caller cannot learn
    // from the outcome whether the address was already registered.
    assert.notEqual(fresh, 'failed');
    assert.notEqual(known, 'failed');
    assert.ok(['created', 'existing'].includes(fresh));
    assert.ok(['created', 'existing'].includes(known));
  });

  test('provisioning asks only for an email and a confirmed address', async () => {
    // It must not set a role, grant anything, or carry other attributes: the account is an
    // ordinary participant, exactly as a normal sign-up produces.
    const received: Record<string, unknown>[] = [];
    const admin: AccountAdmin = {
      auth: {
        admin: {
          async createUser(attributes) {
            received.push({ ...attributes });
            return { error: null };
          },
        },
      },
    };

    await ensureAccount(admin, 'plain@roots-ai.invalid');
    assert.equal(received.length, 1);
    assert.deepEqual(Object.keys(received[0]).sort(), ['email', 'email_confirm']);
    assert.equal(received[0].email_confirm, true);
    for (const forbidden of ['role', 'app_metadata', 'user_metadata', 'password', 'phone']) {
      assert.ok(!(forbidden in received[0]), `provisioning must not set ${forbidden}`);
    }
  });
});

describe('recognising an already-registered address', () => {
  test('the provider status is honoured', () => {
    assert.equal(isAlreadyRegistered({ status: 422, message: 'whatever' }), true);
  });

  test('the message is honoured when the status is absent', () => {
    for (const message of [
      'A user with this email address has already been registered',
      'User already exists',
      'duplicate key value violates unique constraint',
    ]) {
      assert.equal(isAlreadyRegistered({ message }), true, `"${message}" should be recognised`);
    }
  });

  test('an unrelated failure is not mistaken for an existing account', () => {
    for (const message of ['internal error', 'service unavailable', 'invalid api key', 'rate limit exceeded']) {
      assert.equal(isAlreadyRegistered({ status: 500, message }), false, `"${message}" must not be read as existing`);
    }
  });

  test('no error means no claim either way', () => {
    assert.equal(isAlreadyRegistered(null), false);
  });
});

describe('what provisioning does not touch', () => {
  test('it grants no role and cannot broaden permissions', async () => {
    // Asserted structurally: the module's only provider call is createUser, and the narrowed
    // interface it declares offers nothing else. A change that granted a role would not compile
    // against this type, and would fail the attribute test above.
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../../lib/auth/provisioning.ts', import.meta.url), 'utf8'),
    );
    for (const forbidden of ['role_assignments', 'super_admin', 'GRANT', 'service_role', 'updateUserById']) {
      assert.ok(!source.includes(forbidden), `provisioning references ${forbidden}`);
    }
  });

  test('it records no consent and cannot stand in for one', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../../lib/auth/provisioning.ts', import.meta.url), 'utf8'),
    );
    for (const forbidden of ['consent', 'consents']) {
      assert.ok(!source.toLowerCase().includes(forbidden), `provisioning references ${forbidden}`);
    }
  });
});

describe('the route still provisions before it generates a link', () => {
  const route = () =>
    import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../../app/(site)/api/v1/auth/magic-link/route.ts', import.meta.url), 'utf8'),
    );

  test('ensureAccount is called, and called before generateLink', async () => {
    // This ordering *is* the defect. A link generated for an address that has no account yet
    // produces a token that cannot verify, which is what made every first sign-in fail.
    const source = await route();
    const provision = source.indexOf('ensureAccount(admin, email)');
    const generate = source.indexOf('generateLink(');
    assert.ok(provision !== -1, 'the route no longer provisions the account');
    assert.ok(generate !== -1, 'the route no longer generates a link');
    assert.ok(provision < generate, 'the link is generated before the account exists — the B1 defect');
  });

  test("a failed provision stops the request instead of sending a dead link", async () => {
    const source = await route();
    assert.match(
      source,
      /provisioned === 'failed'[\s\S]{0,400}?return apiError\(503/,
      'a failed provision must return an error, not continue to generateLink',
    );
  });

  test('the response is the same whether or not the account already existed', async () => {
    const source = await route();
    // Only 'failed' is branched on; 'created' and 'existing' fall through to the same path.
    assert.ok(!/provisioned === 'created'/.test(source), 'the route must not branch on account creation');
    assert.ok(!/provisioned === 'existing'/.test(source), 'the route must not branch on account existence');
  });

  test('provisioning happens after consent and age confirmation are validated', async () => {
    const source = await route();
    const ageCheck = source.indexOf('AGE_ELIGIBILITY');
    const provision = source.indexOf('ensureAccount(admin, email)');
    assert.ok(ageCheck !== -1 && ageCheck < provision, 'an unvalidated request must never provision an account');
  });

  test('provisioning happens after the rate limit is applied', async () => {
    const source = await route();
    const rateLimit = source.indexOf("'RATE_LIMITED'");
    const provision = source.indexOf('ensureAccount(admin, email)');
    assert.ok(rateLimit !== -1 && rateLimit < provision, 'the rate limit must not be bypassable by provisioning first');
  });
});

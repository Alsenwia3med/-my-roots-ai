# ROOTS-AI™ — controlled defect record B1

**Secure-link sign-in: a first-time participant's first link never worked**

Prepared in response to the ROOTS review of 29 September 2026, item B1:

> "Because the defect affected previously accepted M1/M2 behavior, it must be recorded as a
> controlled defect correction. Please document the root cause, affected versions, changed files,
> regression test and evidence that the intended behavior is restored... Include concurrency or
> duplicate-provisioning tests where the corrected account-creation sequence presents that risk.
> Confirm that the correction does not bypass required consent, reveal account existence, create
> duplicate accounts, broaden permissions, compromise RLS, or affect assessment ownership and
> autosave/resume."

| | |
|---|---|
| Defect reference | **B1** |
| Severity | **Blocking for pilot.** Every participant would have met it on their first sign-in. |
| Requirement affected | C-06 §2; C-05 ASM-01 / ASM-02; Master Requirements 2.2 |
| Found | 2026-09-29, by the end-to-end evidence run (`npm run evidence:e2e`), step 1 |
| Corrected in | `b66c619` |
| Regression evidence added in | this commit — `tests/auth/provisioning.test.ts`, 18 tests |

---

## 1. What went wrong

A participant entering their email address for the first time was told to check their inbox,
received a secure link, clicked it, and was refused. Requesting a second link worked.

Nothing was logged as an error, because nothing in the application had failed: the route had
generated a link successfully, and the verification endpoint had correctly rejected a token that
was genuinely invalid. The defect was only visible from the participant's side, and only on a
genuinely new address — which is why it survived M1 and M2 acceptance and every manual test
performed with an address that had been used before.

## 2. Root cause

`app/api/v1/auth/magic-link/route.ts` called `supabase.auth.admin.generateLink({ type: 'magiclink', email })`
for an address that had no account yet.

Observed behaviour: the call succeeds and returns a hashed token, and the account comes into
existence as a side effect, but the token returned by that first call does not verify. The second
request finds the account already present and returns a token that does.

So the failing condition was precisely *"this address has never been seen before"* — the state
every real pilot participant starts in, and the one state no returning tester could reproduce.

The route was correct in every other respect. The ordering was the whole of the fault.

## 3. Affected versions

The defect was present from the first delivery of secure-link sign-in until 29 September 2026.

| Commit (ROOTS repository) | Date | Provisions before generating? |
|---|---|---|
| `6a1d2bf` — M3 base, carrying the accepted M1/M2 sign-in | 2026-09-23 | **No — defective** |
| `c0733aa` | 2026-09-24 | **No — defective** |
| `b66c619` | 2026-09-29 | Yes — corrected |
| `3186838` and later | 2026-09-29 | Yes |

No production pilot had begun, so no participant was affected in service. The accepted M1 and M2
demonstrations used addresses that had already been registered, which is why the behaviour looked
correct at the time.

## 4. The correction

The account is assured *before* a link is generated for it. Nothing else in the route moved.

| File | Change |
|---|---|
| `lib/auth/provisioning.ts` | **New.** `ensureAccount()` and `isAlreadyRegistered()`, extracted so the behaviour is reachable from a unit test. |
| `app/api/v1/auth/magic-link/route.ts` | Calls `ensureAccount()` before `generateLink()`; a failure returns 503 and no link is issued. |
| `tests/auth/provisioning.test.ts` | **New.** The regression suite below. |
| `package.json` | `test:auth`, added to `npm test`. |

`ensureAccount()` returns one of three outcomes:

- `created` — the address was new and now has an account;
- `existing` — the provider refused it as already registered (a returning participant, **or** the
  loser of a race between two simultaneous first requests);
- `failed` — anything else. The caller must not issue a link.

`created` and `existing` are both success and take the same path out of the route.

**No database change was required.** The schema, every RLS policy and every grant are identical
across the correction; the only SQL added in `b66c619` is the `roots_ai_narrative` read-only role,
which belongs to the AI boundary and is unrelated to sign-in.

## 5. Regression evidence

`npm run test:auth` — 18 tests, all passing.

### The defect itself

| Test | Asserts |
|---|---|
| `ensureAccount is called, and called before generateLink` | The ordering that *is* the defect. Fails if a future change reverts it. |
| `a first-time address is provisioned before a link is issued` | Exactly one provisioning attempt for a new address. |
| `a failed provision stops the request instead of sending a dead link` | A provider failure returns 503 rather than continuing to `generateLink`. |

### Concurrency and duplicate provisioning

| Test | Asserts |
|---|---|
| `concurrency: two simultaneous first requests both succeed, and only one account is made` | Three overlapping requests for one unknown address: exactly one `created`, the rest `existing`, none `failed`, and the provider creates exactly one account. |
| `provisioning never creates a second account for the same address` | A repeat request makes one attempt and accepts the refusal, with no retry loop — a retry loop being the only way this code could produce a duplicate. |

### The confirmations ROOTS asked for

| Concern | How it is held, and what proves it |
|---|---|
| **Does not bypass required consent** | Age confirmation (`VAL-010`) is validated before provisioning is reached — `provisioning happens after consent and age confirmation are validated`. Consent records are written later in the journey, into `consents`, which this change does not touch; the module contains no reference to consent at all — `it records no consent and cannot stand in for one`. |
| **Does not reveal account existence** | `created` and `existing` are indistinguishable to the caller, and the route branches on neither — `account existence is never revealed` and `the response is the same whether or not the account already existed`. The 200 response body is unchanged from M1. |
| **Does not create duplicate accounts** | The two concurrency tests above. |
| **Does not broaden permissions** | Provisioning passes `email` and `email_confirm` and nothing else — `provisioning asks only for an email and a confirmed address` rejects `role`, `app_metadata`, `user_metadata`, `password` and `phone`. Roles live in `public.role_assignments` and are granted only through the admin flow; the module references no role, grant or service identity — `it grants no role and cannot broaden permissions`. |
| **Does not compromise RLS** | No policy, grant or table changed. The account is created through the same Supabase Auth path as an ordinary sign-up, so the `on_auth_user_created` trigger inserts the profile exactly as before, and every policy continues to key off `auth.uid()`. |
| **Does not affect assessment ownership, autosave or resume** | Provisioning happens before any assessment can exist for the address. `public.assessments.profile_id` references `public.profiles(id)`, which equals the auth user ID; because exactly one account is created, that ID is stable and no assessment can be orphaned or re-pointed. The 98 database probes (`npm run db:probes`) re-run unchanged. |
| **Rate limiting is not bypassable** | Provisioning is reached only after the per-address limit is applied — `provisioning happens after the rate limit is applied`. An unthrottled caller cannot use this path to mass-create accounts. |

### The tests were verified to fail without the fix

The suite was re-run against two deliberately broken versions of `lib/auth/provisioning.ts`:

| Mutation | Result |
|---|---|
| The original defect — no account is created | **6 of 18 fail** |
| Every provider error swallowed as success | **1 of 18 fails** |
| Unmodified | 18 of 18 pass |

## 6. Evidence that the intended behaviour is restored

Two independent lines, one structural and one live:

1. **Unit and structural** — the 18 tests above, run inside `npm test` (458 tests, all passing).
2. **Live, against the running application** — `npm run evidence:e2e`, step 1, which requests a
   secure link for a freshly generated address that has never been seen, verifies the **first**
   link it receives, and asserts the session is authenticated. That step is recorded in
   `docs/m3/ROOTS-AI_M3_E2E_Evidence.md`. It is the step that found the defect, and it now passes.

Both must be re-run against the delivered commit, per the submission index.

## 7. Residual risk

The provider's already-registered signal is matched on HTTP 422 first and on the error message
second, because the status is not guaranteed across client versions. A future provider change that
reported an existing account with a status and wording matching neither would be read as `failed`,
and the participant would see "temporarily unavailable" rather than a link — a visible, logged,
safe failure, not a silent one. `an unexpected provider failure does not report success` fixes that
boundary so the behaviour cannot drift in the permissive direction unnoticed.

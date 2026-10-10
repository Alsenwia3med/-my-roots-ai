/**
 * What this application is allowed to keep in the browser.
 *
 * ROOTS decision of 30 September 2026, section 7:
 *
 *   "The submit idempotency key may remain in sessionStorage provided it is random/non-semantic,
 *    contains no participant health data or identity, and expires with the browser session.
 *    The participant email must not be retained in sessionStorage beyond the minimum period
 *    required for the entry/authentication flow... Do not store assessment answers, scores, report
 *    content or health information in browser storage. Add a test proving this behavior."
 *
 * The lifecycle tests drive the module directly. The rest scan the source, because the claim worth
 * proving is a negative — that *nothing else anywhere* reaches browser storage — and no amount of
 * driving one module can establish that.
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

const ROOT = join(import.meta.dirname, '..', '..');
const SOURCE_ROOTS = ['app', 'lib', 'components'];

/** A minimal sessionStorage, so the lifecycle can be driven without a browser. */
function installSessionStorage(): Map<string, string> {
  const store = new Map<string, string>();
  (globalThis as { sessionStorage?: unknown }).sessionStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  return store;
}

function sourceFiles(): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry)) out.push({ path: full.slice(ROOT.length + 1).replace(/\\/g, '/'), text: readFileSync(full, 'utf8') });
    }
  };
  for (const root of SOURCE_ROOTS) walk(join(ROOT, root));
  return out;
}

// The locked homepage ((home) route group) keeps its own chrome under components/layout and
// components/RootsV1; it is outside the original code base this policy applies to.
const HOMEPAGE_ONLY = (p: string) => p.startsWith('components/layout/') || p.startsWith('components/RootsV1') || p.startsWith('app/(home)/');
const files = sourceFiles().filter((f) => !HOMEPAGE_ONLY(f.path));

describe('the participant address is not retained beyond the entry flow', () => {
  test('it is stored, read and cleared through one module', async () => {
    const store = installSessionStorage();
    const { storePendingEmail, readPendingEmail, clearPendingEmail, PENDING_EMAIL_KEY } = await import(
      '../../app/(site)/assessment/_components/pendingEmail'
    );

    storePendingEmail('someone@example.invalid');
    assert.equal(readPendingEmail(), 'someone@example.invalid');
    assert.equal(store.size, 1, 'exactly one key should be written');
    assert.ok(store.has(PENDING_EMAIL_KEY));

    clearPendingEmail();
    assert.equal(readPendingEmail(), null, 'the address survived the clear');
    assert.equal(store.size, 0, 'the key should be removed, not emptied');
  });

  test('every read and write survives storage being unavailable', async () => {
    // Private-browsing modes throw. Losing the resend convenience must never break the screen.
    (globalThis as { sessionStorage?: unknown }).sessionStorage = {
      getItem() { throw new Error('denied'); },
      setItem() { throw new Error('denied'); },
      removeItem() { throw new Error('denied'); },
    };
    const { storePendingEmail, readPendingEmail, clearPendingEmail } = await import(
      '../../app/(site)/assessment/_components/pendingEmail'
    );

    assert.doesNotThrow(() => storePendingEmail('a@example.invalid'));
    assert.equal(readPendingEmail(), null);
    assert.doesNotThrow(() => clearPendingEmail());
  });

  test('it is cleared at each of the three moments ROOTS named', () => {
    const find = (path: string) => files.find((f) => f.path === path)?.text ?? '';

    // 1. On sign-in: the shell renders the clear whenever a session exists.
    const layout = find('app/(site)/assessment/layout.tsx');
    assert.match(layout, /getParticipant\(\)/, 'the shell must know whether a participant is signed in');
    assert.match(layout, /\{user && <ClearPendingEmail \/>\}/, 'the shell must clear the address once signed in');
    assert.match(find('app/(site)/assessment/_components/ClearPendingEmail.tsx'), /clearPendingEmail\(\)/);

    // 2. On sign-out.
    assert.match(find('app/(site)/assessment/_components/SignOutButton.tsx'), /clearPendingEmail\(\)/, 'sign-out must clear the address');

    // 3. On choosing a different address.
    assert.match(find('app/(site)/assessment/_components/CheckEmail.tsx'), /onClick=\{clearPendingEmail\}/, '"use a different email" must clear it');
  });

  test('nothing writes the address outside that module', () => {
    const offenders = files.filter(
      (f) => f.path !== 'app/(site)/assessment/_components/pendingEmail.ts' && f.text.includes('roots-secure-link-email'),
    );
    assert.deepEqual(offenders.map((f) => f.path), [], 'the storage key must exist in exactly one module');
  });
});

describe('what may be kept in browser storage, and nothing else', () => {
  /** Every direct call into browser storage, with the file it is in. */
  const calls = files.flatMap((f) =>
    [...f.text.matchAll(/\b(localStorage|sessionStorage|indexedDB)\s*\.\s*(setItem|getItem|removeItem|clear|open)\s*\(/g)].map((m) => ({
      path: f.path,
      api: m[1],
      method: m[2],
    })),
  );

  const ALLOWED = new Set([
    // The address, for the entry flow only. Lifecycle proved above.
    'app/(site)/assessment/_components/pendingEmail.ts',
    // The submit idempotency key: crypto.randomUUID(), so random and non-semantic.
    'app/(site)/assessment/_components/SubmitPanel.tsx',
    // The cookie-consent decision, which C-04 requires be recorded without an identifier.
    'lib/content/cookie-consent.ts',
  ]);

  test('only the approved modules touch browser storage', () => {
    const unexpected = [...new Set(calls.map((c) => c.path))].filter((p) => !ALLOWED.has(p));
    assert.deepEqual(unexpected, [], 'a module outside the approved set reaches into browser storage');
  });

  test('IndexedDB is never used', () => {
    assert.deepEqual(calls.filter((c) => c.api === 'indexedDB').map((c) => c.path), []);
  });

  test('the submit idempotency key is random and non-semantic', async () => {
    const panel = files.find((f) => f.path === 'app/(site)/assessment/_components/SubmitPanel.tsx')?.text ?? '';
    assert.match(panel, /crypto\.randomUUID\(\)/, 'the key must be a random UUID');
    assert.match(panel, /sessionStorage/, 'it must be session-scoped, so it expires with the browser session');
    assert.doesNotMatch(panel, /localStorage/, 'it must not outlive the session');

    // It is keyed by assessment ID and holds a UUID: no address, no answer, no health information.
    assert.match(panel, /roots-submit-key-\$\{assessmentId\}/, 'the key names the assessment and nothing about the participant');
  });

  test('no answer, score, classification or report content reaches browser storage', () => {
    // A storage write near any of these words would be a health-data leak. The approved modules
    // are excluded because their contents are established above.
    const FORBIDDEN = /\b(answers?|score|scores|classification|biological|report|domain|driver|health|response)\b/i;

    for (const file of files) {
      if (ALLOWED.has(file.path)) continue;
      for (const m of file.text.matchAll(/\b(localStorage|sessionStorage)\s*\.\s*setItem\s*\(([^)]*)\)/g)) {
        assert.ok(false, `${file.path} writes to browser storage: ${m[0]}`);
      }
    }

    // And inside the approved modules, no forbidden term appears in what is written.
    const submit = files.find((f) => f.path === 'app/(site)/assessment/_components/SubmitPanel.tsx')?.text ?? '';
    const written = [...submit.matchAll(/sessionStorage\.setItem\(([^)]*)\)/g)].map((m) => m[1]).join(' ');
    assert.doesNotMatch(written.replace(/storageKey|value/g, ''), FORBIDDEN, 'a forbidden term appears in a storage write');
  });

  test('the offline message tells the truth: no answer is persisted', () => {
    // The participant is told their current entry stays on the device until they leave or refresh.
    // That is only true if nothing writes an answer to storage — which the checks above establish.
    const assessment = files.filter((f) => f.path.startsWith('app/(site)/assessment/') || f.path.startsWith('lib/assessment/'));
    const writes = assessment.filter(
      (f) => !ALLOWED.has(f.path) && /\b(localStorage|sessionStorage)\s*\.\s*setItem/.test(f.text),
    );
    assert.deepEqual(writes.map((f) => f.path), [], 'the assessment journey must persist nothing to the device');
  });
});

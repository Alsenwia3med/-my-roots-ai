/**
 * Cookie consent (C-05 SYS-01; Annex OPS-01 … OPS-03).
 *
 * The rule that matters is OPS-02: non-essential scripts are blocked before consent and stay
 * blocked after refusal or withdrawal. Every case below is about the gate staying shut unless
 * someone has actively opened it.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import { COOKIE_CATEGORIES } from '../../lib/content/c04-legal';
import {
  analyticsAllowed,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  readConsent,
  writeConsent,
} from '../../lib/content/cookie-consent';

// A localStorage stand-in, so the module can be exercised without a browser.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(k: string) { return this.store.get(k) ?? null; }
  setItem(k: string, v: string) { this.store.set(k, v); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

const storage = new MemoryStorage();
// The module reads window.localStorage inside its functions, not at load time, so the stub only
// has to exist before a test calls one.
(globalThis as { window?: unknown }).window = { localStorage: storage };

describe('cookie consent', () => {
  beforeEach(() => storage.clear());

  test('OPS-02: analytics are blocked before any decision', () => {
    assert.equal(readConsent(), null);
    assert.equal(analyticsAllowed(), false);
  });

  test('OPS-02: analytics stay blocked after refusal', () => {
    writeConsent(false);
    assert.equal(analyticsAllowed(), false);
  });

  test('analytics are allowed only after an explicit acceptance', () => {
    writeConsent(true);
    assert.equal(analyticsAllowed(), true);
  });

  test('OPS-03: the decision records category, version and timestamp', () => {
    const consent = writeConsent(true);
    assert.equal(consent.version, CONSENT_VERSION);
    assert.equal(consent.analytics, true);
    assert.ok(Date.parse(consent.decidedAt) > 0, 'a parseable timestamp is recorded');

    const stored = JSON.parse(storage.getItem(CONSENT_STORAGE_KEY)!);
    assert.deepEqual(Object.keys(stored).sort(), ['analytics', 'decidedAt', 'version']);
  });

  test('no identifier is stored alongside the decision (C-04: no unnecessary identifiers)', () => {
    writeConsent(true);
    const stored = JSON.parse(storage.getItem(CONSENT_STORAGE_KEY)!) as Record<string, unknown>;

    // Only the three fields the decision itself needs.
    assert.deepEqual(Object.keys(stored).sort(), ['analytics', 'decidedAt', 'version']);

    // And none of their values is an address or an opaque identifier.
    for (const value of Object.values(stored)) {
      if (typeof value !== 'string') continue;
      assert.ok(!value.includes('@'), `an address was stored: ${value}`);
      assert.ok(
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
        `a UUID was stored: ${value}`,
      );
    }
  });

  test('a decision made against an older notice is not carried over', () => {
    storage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: '0.9.0', analytics: true, decidedAt: '2026-01-01T00:00:00.000Z' }));
    assert.equal(readConsent(), null, 'an outdated decision must be asked again');
    assert.equal(analyticsAllowed(), false);
  });

  test('a corrupt or unreadable value falls back to blocked', () => {
    storage.setItem(CONSENT_STORAGE_KEY, 'not json');
    assert.equal(readConsent(), null);
    assert.equal(analyticsAllowed(), false);
  });

  test('only public-site analytics is optional; nothing else is offered as a choice', () => {
    const optional = COOKIE_CATEGORIES.filter((c) => c.control.startsWith('Disabled until required consent'));
    assert.deepEqual(optional.map((c) => c.category), ['Public-site analytics']);
  });
});

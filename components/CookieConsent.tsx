'use client';

/**
 * SYS-01 — Cookie Consent (C-05).
 *
 * Zones, in the order C-05 lists them:
 *   1 Banner       essential-only default; Accept optional; Reject optional; Preferences
 *   2 Preferences  categories and purpose, with the optional category unticked by default
 *   3 Persistence  consent version and time (lib/content/cookie-consent.ts)
 *   4 Reopen       the Cookie Notice and footer can reopen the panel
 *
 * "Usable at 320 px minimum without clipped primary action": the actions wrap and stay full
 * width on a narrow screen, so no button is ever cut off.
 *
 * Nothing is loaded before a decision — there is no analytics provider in Phase 1, and
 * `analyticsAllowed()` stays false until someone accepts, which is what OPS-02 requires of any
 * provider added later.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { COOKIE_BANNER, COOKIE_CATEGORIES } from '@/lib/content/c04-legal';
import { OPEN_PREFERENCES_EVENT, readConsent, writeConsent } from '@/lib/content/cookie-consent';

type View = 'hidden' | 'banner' | 'preferences';

export default function CookieConsent() {
  const [view, setView] = useState<View>('hidden');
  // C-05 SYS-01 z2: "unticked optional default".
  const [analytics, setAnalytics] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) setView('banner');
    else setAnalytics(existing.analytics);

    const reopen = () => {
      setAnalytics(readConsent()?.analytics ?? false);
      setView('preferences');
    };
    window.addEventListener(OPEN_PREFERENCES_EVENT, reopen);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, reopen);
  }, []);

  const decide = useCallback((allowAnalytics: boolean) => {
    writeConsent(allowAnalytics);
    setAnalytics(allowAnalytics);
    setView('hidden');
  }, []);

  // Escape closes the preferences panel without changing the stored decision.
  useEffect(() => {
    if (view !== 'preferences') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setView(readConsent() ? 'hidden' : 'banner');
    };
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [view]);

  if (view === 'hidden') return null;

  if (view === 'banner') {
    return (
      <div className="cookie-bar" role="region" aria-label="Cookie choices">
        <div className="cookie-bar-inner">
          <p>{COOKIE_BANNER.body}</p>
          <div className="cookie-actions">
            <button className="cookie-button cookie-button-primary" onClick={() => decide(true)} type="button">
              {COOKIE_BANNER.accept}
            </button>
            <button className="cookie-button" onClick={() => decide(false)} type="button">
              {COOKIE_BANNER.reject}
            </button>
            <button className="cookie-button cookie-button-quiet" onClick={() => setView('preferences')} type="button">
              {COOKIE_BANNER.manage}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cookie-overlay">
      <div
        className="cookie-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-panel-title"
        ref={panelRef}
        tabIndex={-1}
      >
        <h2 id="cookie-panel-title">{COOKIE_BANNER.manage}</h2>
        <p>{COOKIE_BANNER.body}</p>

        <ul className="cookie-categories">
          {COOKIE_CATEGORIES.map((category) => {
            const optional = category.category === 'Public-site analytics';
            const unused = category.control === 'Not used.' || category.control === 'Not used on protected routes.';
            return (
              <li key={category.category}>
                <div className="cookie-category-head">
                  <span className="cookie-category-name">{category.category}</span>
                  {optional ? (
                    <label className="cookie-toggle">
                      <input checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} type="checkbox" />
                      <span>Allow</span>
                    </label>
                  ) : (
                    <span className="cookie-state">{unused ? 'Not used' : 'Always active'}</span>
                  )}
                </div>
                <p>{category.treatment}</p>
                <p className="cookie-control">{category.control}</p>
              </li>
            );
          })}
        </ul>

        <div className="cookie-actions">
          <button className="cookie-button cookie-button-primary" onClick={() => decide(analytics)} type="button">
            Save choices
          </button>
          <button className="cookie-button" onClick={() => decide(false)} type="button">
            {COOKIE_BANNER.reject}
          </button>
        </div>
      </div>
    </div>
  );
}

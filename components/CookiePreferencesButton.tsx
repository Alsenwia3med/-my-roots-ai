'use client';

/** C-05 LEG-03 z3 / SYS-01 z4 — reopens the consent panel from the Cookie Notice. */

import { openCookiePreferences } from '@/lib/content/cookie-consent';
import { COOKIE_BANNER } from '@/lib/content/c04-legal';

export default function CookiePreferencesButton() {
  return (
    <button className="legal-cta" onClick={() => openCookiePreferences()} type="button">
      {COOKIE_BANNER.manage}
    </button>
  );
}

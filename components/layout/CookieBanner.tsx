"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "roots_ai_analytics_consent";
const CONSENT_VERSION = "1.0.1";

const BANNER_COPY = "We use essential technologies to keep ROOTS-AI™ secure. With your permission, we may use limited analytics on public pages. We do not use advertising pixels or session replay on assessment, report, sign-in or admin pages.";

/** Routes where the banner must never appear (C-04: not used on protected routes). */
const EXCLUDED_PREFIXES = ["/assessment", "/report", "/admin", "/account", "/auth"];

const CHANGE_EVENT = "roots-ai:home-consent";

/* Consent lives in localStorage, which the server cannot see. Reading it through
   useSyncExternalStore keeps the server render and the first client render identical (both
   "unknown", banner hidden) and then shows the banner only to visitors who have not decided —
   so a returning visitor is not shown the banner again. */
function readDecision(): "accepted" | "rejected" | "none" {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return "none";
    const parsed = JSON.parse(stored) as { version?: string; analytics?: string };
    // A stale consent version is discarded and treated as undecided.
    if (parsed?.version !== CONSENT_VERSION) return "none";
    return parsed.analytics === "accepted" || parsed.analytics === "rejected" ? parsed.analytics : "none";
  } catch {
    // Unreadable storage is treated as undecided.
    return "none";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export default function CookieBanner() {
  const pathname = usePathname() ?? "";
  const decision = useSyncExternalStore(subscribe, readDecision, () => "unknown" as const);
  // Hides the banner for this visit even where the choice cannot be stored.
  const [dismissed, setDismissed] = useState(false);

  const isExcluded = EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const visible = !isExcluded && !dismissed && decision === "none";

  function record(choice: "accepted" | "rejected") {
    setDismissed(true);
    // No persistent visitor identifier is stored: only the choice, its version and a timestamp.
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: CONSENT_VERSION, categories: ["necessary", "public_site_analytics"], analytics: choice, decidedAt: new Date().toISOString() }),
      );
    } catch {
      // Storage failure must not block the page.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  if (!visible) return null;

  return (
    <aside className="cookie-banner" role="region" aria-label="Cookie notice">
      <div className="cookie-banner-inner">
        <p>{BANNER_COPY}</p>
        <div className="cookie-banner-actions">
          <button type="button" className="cookie-accept" onClick={() => record("accepted")}>Accept optional analytics</button>
          <button type="button" className="cookie-reject" onClick={() => record("rejected")}>Reject optional analytics</button>
          <Link href="/cookies" className="cookie-manage">Manage choices</Link>
        </div>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const STORAGE_KEY = "roots_ai_analytics_consent";
const CONSENT_VERSION = "1.0.1";

const BANNER_COPY = "We use essential technologies to keep ROOTS-AI™ secure. With your permission, we may use limited analytics on public pages. We do not use advertising pixels or session replay on assessment, report, sign-in or admin pages.";

/** Routes where the banner must never appear (C-04: not used on protected routes). */
const EXCLUDED_PREFIXES = ["/assessment", "/report", "/admin", "/account", "/auth"];

export default function CookieBanner() {
  const pathname = usePathname() ?? "";
  // Consent is read lazily during initialisation so no setState is needed in an effect.
  const [decision, setDecision] = useState<"accepted" | "rejected" | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as { version?: string; analytics?: string };
      // A stale consent version is discarded and treated as undecided.
      if (parsed?.version !== CONSENT_VERSION) return null;
      return parsed.analytics === "accepted" || parsed.analytics === "rejected" ? parsed.analytics : null;
    } catch {
      // Unreadable storage is treated as undecided.
      return null;
    }
  });

  const isExcluded = EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const visible = !isExcluded && decision === null;

  function record(choice: "accepted" | "rejected") {
    setDecision(choice);

    // No persistent visitor identifier is stored: only the choice, its version and a timestamp.
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: CONSENT_VERSION, categories: ["necessary", "public_site_analytics"], analytics: choice, decidedAt: new Date().toISOString() }),
      );
    } catch {
      // Storage failure must not block the page.
    }
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

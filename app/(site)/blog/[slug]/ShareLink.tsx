'use client';

/**
 * PUB-12 zone 4 — "Share: copy link only unless approved".
 *
 * Copying the address is the only sharing C-05 permits: no social buttons, no third-party share
 * widgets, nothing that would load an external script or hand a reader's visit to another
 * service. The fallback selects the address so it can be copied by hand where the clipboard API
 * is unavailable or refused.
 */

import { useEffect, useRef, useState } from 'react';

export default function ShareLink() {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [href, setHref] = useState('');

  useEffect(() => setHref(window.location.href), []);

  // The confirmation is transient, but it must not linger and mislead on a later visit.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 4000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
    } catch {
      // Blocked clipboard, or an insecure context: select it so it can still be copied.
      inputRef.current?.select();
    }
  }

  return (
    <section className="article-share">
      <h2>Share</h2>
      <div className="article-share-row">
        <label className="sr-only" htmlFor="article-link">
          Link to this article
        </label>
        <input id="article-link" readOnly ref={inputRef} value={href} />
        <button className="secondary-button" onClick={copy} type="button">
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>
      <p aria-live="polite" className="article-share-status">
        {copied ? 'The link to this article has been copied.' : ''}
      </p>
    </section>
  );
}

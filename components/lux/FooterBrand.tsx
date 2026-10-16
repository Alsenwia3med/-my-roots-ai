"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { HOME_FOOTER } from "./chrome-data";
import type { VariantId } from "./footer-brand-variants";

/**
 * Ten brand-style footers (layout from the community-site reference): logo mark + name with a short
 * statement, four link columns, and the copyright centred under a rule.
 * Still at rest; light, colour and links respond only to the cursor.
 * The statement is a shortened version of HOME_FOOTER.notes[0] (same meaning, fewer words).
 */
const { columns, copyright } = HOME_FOOTER;
const SHORT =
  "An educational biological intelligence platform. It does not diagnose, treat or assess emergencies. Consult a qualified physician before clinical decisions.";


export default function BrandFooter({ variant }: { variant: VariantId }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--px", `${e.clientX - r.left}px`);
        el.style.setProperty("--py", `${e.clientY - r.top}px`);
        el.style.setProperty("--pn", "1");
      });
    };
    const enter = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--px", `${e.clientX - r.left}px`);
      el.style.setProperty("--py", `${e.clientY - r.top}px`);
    };
    const leave = () => el.style.setProperty("--pn", "0");
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <footer ref={root} className={`fb fb--${variant}`}>
      <span className="fb-wipe" aria-hidden="true" />
      <span className="fb-glow" aria-hidden="true" />
      <span className="fb-dots" aria-hidden="true" />
      <div className="fb-wrap">
        <div className="fb-main">
          <div className="fb-brand">
            <Link href="/" className="fb-id" aria-label="ROOTS-AI home">
              <span className="fb-mark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/roots-logo.svg" alt="" />
              </span>
              <span className="fb-name">
                <strong>ROOTS-AI™</strong>
                <em>BIOLOGICAL INTELLIGENCE</em>
              </span>
            </Link>
            <p>{SHORT}</p>
          </div>
          <nav className="fb-cols" aria-label="Footer">
            {columns.map((c, i) => (
              <div key={c.title} className="fb-col" data-n={`0${i + 1}`}>
                <h3>{c.title}</h3>
                <ul>
                  {c.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="fb-link">
                        <span>{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="fb-bottom">{copyright}</div>
      </div>
    </footer>
  );
}

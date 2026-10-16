"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { FooterData } from "./chrome-data";
import "./styles/footer-index.css";

/**
 * Site footer. Brand with a short statement on the left, four numbered link columns, copyright centred.
 * The turquoise tint is pure CSS on hover; on touch screens (no hover) it plays once as the footer
 * scrolls into view. The link columns and copyright come from `data`, so the homepage and inner pages
 * keep their own wording. The statement is a shortened form of data.notes[0] (same meaning).
 */
const STATEMENT =
  "An educational biological intelligence platform. It does not diagnose, treat or assess emergencies. Consult a qualified physician before clinical decisions.";

export default function LuxFooter({ data }: { data: FooterData }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !window.matchMedia("(hover: none)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer ref={root} className="ftx">
      <span className="ftx-wash" aria-hidden="true" />
      <span className="ftx-sheen" aria-hidden="true" />
      <div className="ftx-wrap">
        <div className="ftx-main">
          <div className="ftx-brand">
            <Link href="/" className="ftx-id" aria-label="ROOTS-AI home">
              <span className="ftx-mark" aria-hidden="true">
                <i />
              </span>
              <span className="ftx-name">
                <strong>ROOTS-AI™</strong>
                <em>BIOLOGICAL INTELLIGENCE</em>
              </span>
            </Link>
            <p>{STATEMENT}</p>
          </div>
          <nav className="ftx-cols" aria-label="Footer">
            {data.columns.map((col, i) => (
              <div className="ftx-col" data-n={`0${i + 1}`} key={col.title}>
                <h3>{col.title}</h3>
                <ul>
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link className="ftx-link" href={href}>
                        <span>{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="ftx-bottom">{data.copyright}</div>
      </div>
    </footer>
  );
}

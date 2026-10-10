"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* Presentation only: scroll-reveal + 3D tilt for the shared page shell.
   It never reads or writes application state; it only toggles data attributes and CSS variables. */
const REVEAL = [
  ".page-heading", ".route-shell > *", ".route-shell-wide > *", ".info-group", ".info-section-grid > article",
  ".info-bullet-list > li", ".method-page section", ".method-sequence-list > *", ".method-ai-grid > *", ".method-privacy-grid > *",
  ".legal-page-article > *", ".legal-article", ".legal-contents", ".legal-callout", ".contact-form", ".contact-emergency",
  ".enquiry-types > *", ".blog-page > *", ".example-report-hero", ".example-report-section", ".example-metrics > *",
  ".example-domain-list > *", ".example-section-list > *", ".example-report-cta", ".report-route-header", ".report-metrics > *",
  ".report-sections > *", ".report-domain-list > *", ".milestone-card", ".project-status-intro", ".assessment-entry-card",
  ".review-summary", ".review-module-list > *", ".resume-card", ".center-actions", ".submitted-page > *",
].join(",");
const TILT = [
  ".info-section-grid > article", ".info-bullet-list > li", ".method-ai-grid > *", ".method-privacy-grid > *", ".method-sequence-list > *",
  ".example-metrics > *", ".example-domain-list > *", ".report-metrics > *", ".report-sections > *", ".report-domain-list > *",
  ".milestone-card", ".enquiry-types > *", ".resume-card", ".review-module-list > *",
].join(",");

export default function DesignEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (document.querySelector(".v1")) return; // the homepage ships its own motion system
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    const targets = Array.from(document.querySelectorAll<HTMLElement>(`.site-content ${REVEAL.split(",").join(",.site-content ")}`));
    if (!reduce && "IntersectionObserver" in window) {
      root.classList.add("ds-js");
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).classList.add("is-in");
          io.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
      targets.forEach((el, i) => {
        el.setAttribute("data-reveal", "");
        el.style.setProperty("--rv-delay", `${(i % 4) * 70}ms`);
        io.observe(el);
      });
      cleanups.push(() => io.disconnect());
    } else {
      root.classList.remove("ds-js");
    }

    if (!reduce && window.matchMedia("(hover: hover)").matches) {
      const cards = Array.from(document.querySelectorAll<HTMLElement>(`.site-content ${TILT.split(",").join(",.site-content ")}`));
      cards.forEach((card) => {
        card.classList.add("ds-tilt");
        const move = (event: PointerEvent) => {
          const r = card.getBoundingClientRect();
          const x = (event.clientX - r.left) / r.width - 0.5;
          const y = (event.clientY - r.top) / r.height - 0.5;
          card.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
          card.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
          card.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
          card.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
        };
        const leave = () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        cleanups.push(() => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); });
      });
    }
    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}

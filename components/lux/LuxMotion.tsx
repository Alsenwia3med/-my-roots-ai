"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Page-wide motion for the Lux design (presentation only — it never touches application state):
 *   [data-reveal]      fades, un-blurs and rises into place the first time it enters the viewport;
 *                      children of [data-stagger] get an increasing delay.
 *   [data-tilt]        tilts toward the pointer, lifts, and carries a soft light under the cursor.
 *   [data-magnetic]    drifts a few pixels toward the pointer.
 *   [data-progress]    exposes --lx-progress (0 → 1) as the element scrolls through the viewport.
 * Everything is skipped under prefers-reduced-motion, and content is never left hidden: anything
 * not revealed after a few seconds is shown regardless.
 */
export default function LuxMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    /* ---------- reveal ---------- */
    const setupReveal = () => {
      const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
      if (reduce || !("IntersectionObserver" in window)) {
        targets.forEach((el) => el.classList.add("is-in"));
        return;
      }
      root.classList.add("lx-motion");
      document.querySelectorAll<HTMLElement>("[data-stagger]").forEach((group) => {
        const step = Number(group.dataset.stagger) || 80;
        Array.from(group.querySelectorAll<HTMLElement>(":scope > [data-reveal]")).forEach((child, i) => {
          if (!child.style.getPropertyValue("--d")) child.style.setProperty("--d", `${Math.min(i, 8) * step}ms`);
        });
      });
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -7% 0px", threshold: 0.06 },
      );
      targets.forEach((el) => io.observe(el));
      const failOpen = window.setTimeout(() => {
        document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-in");
        });
      }, 2600);
      cleanups.push(() => {
        io.disconnect();
        window.clearTimeout(failOpen);
      });
    };

    /* ---------- tilt + spotlight + magnetic (event delegation) ---------- */
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let active: HTMLElement | null = null;
    let magnet: HTMLElement | null = null;
    const onMove = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const card = target?.closest<HTMLElement>("[data-tilt]") ?? null;
      if (active && active !== card) {
        active.style.setProperty("--rx", "0deg");
        active.style.setProperty("--ry", "0deg");
      }
      active = card;
      if (card) {
        const r = card.getBoundingClientRect();
        const x = (event.clientX - r.left) / r.width;
        const y = (event.clientY - r.top) / r.height;
        const strength = Number(card.dataset.tilt) || 5;
        card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
        card.style.setProperty("--ry", `${((x - 0.5) * strength).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${(-(y - 0.5) * strength).toFixed(2)}deg`);
      }
      const m = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (magnet && magnet !== m) magnet.style.translate = "";
      magnet = m;
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = event.clientX - (r.left + r.width / 2);
        const dy = event.clientY - (r.top + r.height / 2);
        m.style.translate = `${(dx * 0.12).toFixed(1)}px ${(dy * 0.18).toFixed(1)}px`;
      }
    };
    const onLeaveDoc = () => {
      if (active) {
        active.style.setProperty("--rx", "0deg");
        active.style.setProperty("--ry", "0deg");
        active = null;
      }
      if (magnet) {
        magnet.style.translate = "";
        magnet = null;
      }
    };
    if (!reduce && fine) {
      document.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeaveDoc);
      cleanups.push(() => {
        document.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeaveDoc);
        onLeaveDoc();
      });
    }

    /* ---------- touch: the whole card answers the finger, wherever it lands ---------- */
    const PRESSABLE = "[data-tilt], [data-press]";
    let pressed: HTMLElement | null = null;
    const release = () => {
      const el = pressed;
      pressed = null;
      if (el) window.setTimeout(() => el.classList.remove("is-pressed"), 140);
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      const el = (event.target as Element | null)?.closest<HTMLElement>(PRESSABLE) ?? null;
      if (!el) return;
      pressed = el;
      el.classList.add("is-pressed");
    };
    if (!reduce) {
      document.addEventListener("pointerdown", onDown, { passive: true });
      document.addEventListener("pointerup", release, { passive: true });
      document.addEventListener("pointercancel", release, { passive: true });
      window.addEventListener("scroll", release, { passive: true });
      cleanups.push(() => {
        document.removeEventListener("pointerdown", onDown);
        document.removeEventListener("pointerup", release);
        document.removeEventListener("pointercancel", release);
        window.removeEventListener("scroll", release);
      });
    }

    /* ---------- scroll-linked progress ---------- */
    let frame = 0;
    const tracks = () => Array.from(document.querySelectorAll<HTMLElement>("[data-progress]"));
    const updateProgress = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of tracks()) {
        const r = el.getBoundingClientRect();
        const start = vh * 0.82;
        const p = (start - r.top) / (r.height + start - vh * 0.3);
        el.style.setProperty("--lx-progress", Math.min(1, Math.max(0, p)).toFixed(4));
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateProgress);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    });

    const t = window.setTimeout(() => {
      setupReveal();
      updateProgress();
    }, 30);
    cleanups.push(() => window.clearTimeout(t));

    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  FileText,
  FlaskConical,
  House,
  Info,
  Layers,
  Microscope,
  MessagesSquare,
  Newspaper,
  Scale,
  Cookie,
  ShieldCheck,
  Bot,
  Lock,
  Sprout,
  Stethoscope,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { CTA, MOBILE, MORE, NAV, NEWS } from "./chrome-data";
import { IconTile } from "./Icon";

const ICONS: Record<string, LucideIcon> = {
  "/": House,
  "/how-it-works": Workflow,
  "/platform": Layers,
  "/example-report": FileText,
  "/research": Microscope,
  "/about": Info,
  "/healthcare-professionals": Stethoscope,
  "/pilot": Sprout,
  "/contact": MessagesSquare,
  "/blog": Newspaper,
  "/privacy": Lock,
  "/terms": Scale,
  "/cookies": Cookie,
  "/medical-disclaimer": ShieldCheck,
  "/ai-disclaimer": Bot,
  "/assessment": FlaskConical,
};

/**
 * The site header: a fixed glass bar with the news ticker attached beneath it, so both stay in
 * view while the page scrolls. On the first scroll the bar eases into a compact height, and a
 * thin light line under the ticker traces how far through the page the reader is.
 */
export default function LuxHeader({
  hoverNavigate = false,
  ticker = true,
}: {
  hoverNavigate?: boolean;
  /** The news ticker travels with the header on every page. */
  ticker?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const moreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* scroll: compact state + reading progress, written straight to CSS (no re-render per frame) */
  useEffect(() => {
    let frame = 0;
    let glideFrame = 0;
    let target = 0;
    let shown = 0;
    /* the reading line eases toward the page position every frame, so it flows instead of stepping */
    const glideTo = () => {
      glideFrame = 0;
      shown += (target - shown) * 0.12;
      if (Math.abs(target - shown) < 0.0004) shown = target;
      shellRef.current?.style.setProperty("--p", shown.toFixed(4));
      if (shown !== target) glideFrame = requestAnimationFrame(glideTo);
    };
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (!glideFrame) glideFrame = requestAnimationFrame(glideTo);
      setCompact(y > 8);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      if (glideFrame) cancelAnimationFrame(glideFrame);
    };
  }, []);

  /* the fine line of light that glides beneath the hovered nav link */
  const glide = useCallback((target: HTMLElement | null) => {
    const nav = navRef.current;
    if (!nav) return;
    if (!target) {
      nav.style.setProperty("--pill-o", "0");
      return;
    }
    const n = nav.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    nav.style.setProperty("--pill-x", `${r.left - n.left + 14}px`);
    nav.style.setProperty("--pill-w", `${Math.max(0, r.width - 28)}px`);
    nav.style.setProperty("--pill-o", "1");
  }, []);

  /* inner pages keep their dwell-to-open navigation (hover ~280 ms on a link opens it) */
  const hoverGo = (href: string) => {
    if (!hoverNavigate || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (navTimer.current) clearTimeout(navTimer.current);
    if (href === pathname) return;
    router.prefetch(href);
    navTimer.current = setTimeout(() => router.push(href), 280);
  };
  const hoverCancel = () => {
    if (navTimer.current) clearTimeout(navTimer.current);
  };

  const openMore = () => {
    if (moreTimer.current) clearTimeout(moreTimer.current);
    setMoreOpen(true);
  };
  const closeMore = () => {
    if (moreTimer.current) clearTimeout(moreTimer.current);
    moreTimer.current = setTimeout(() => setMoreOpen(false), 160);
  };

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);


  /* mobile sheet: scroll lock, focus trap, Escape */
  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>("#mobile-navigation a[href], #mobile-navigation button:not([disabled])"),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, closeMenu]);

  const isActive = (href: string) => pathname === href;
  const moreActive = MORE.some(([, href]) => isActive(href));

  return (
    <header className="lxh" data-compact={compact ? "true" : "false"} data-ticker={ticker ? "true" : "false"}>
      <div className="lxh-shell" ref={shellRef}>
        <div className="lxh-bar">
          <div className="lxh-inner">
            <Link href="/" className="lxh-logo" aria-label="ROOTS-AI home" onClick={() => setMenuOpen(false)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/roots-logo.svg" alt="ROOTS-AI Biological Intelligence" width={603} height={792} />
            </Link>

            <nav className="lxh-nav" aria-label="Main navigation" ref={navRef} onMouseLeave={() => glide(null)}>
              <span className="lxh-pill" aria-hidden="true" />
              {NAV.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="lxh-link"
                  data-active={isActive(href) ? "true" : undefined}
                  aria-current={isActive(href) ? "page" : undefined}
                  onMouseEnter={(e) => {
                    glide(e.currentTarget);
                    hoverGo(href);
                  }}
                  onFocus={(e) => glide(e.currentTarget)}
                  onMouseLeave={hoverCancel}
                >
                  {label}
                </Link>
              ))}
              <div
                className="lxh-more"
                data-open={moreOpen}
                onMouseEnter={(e) => {
                  openMore();
                  glide(e.currentTarget.querySelector("button"));
                }}
                onMouseLeave={closeMore}
                onFocus={openMore}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeMore();
                }}
              >
                <button
                  type="button"
                  className="lxh-link lxh-more-btn"
                  data-active={moreActive ? "true" : undefined}
                  aria-expanded={moreOpen}
                  aria-controls="more-menu"
                  aria-haspopup="true"
                  onClick={() => setMoreOpen((open) => !open)}
                >
                  More
                  <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
                </button>
                <div id="more-menu" className="lxh-menu" data-open={moreOpen}>
                  {MORE.map(([label, href], i) => (
                    <Link
                      key={href}
                      href={href}
                      className="lxh-menu-item lx-ico-host"
                      tabIndex={moreOpen ? 0 : -1}
                      style={{ "--i": i } as CSSProperties}
                      data-active={isActive(href) ? "true" : undefined}
                      onMouseEnter={() => hoverGo(href)}
                      onMouseLeave={hoverCancel}
                      onClick={() => setMoreOpen(false)}
                    >
                      <IconTile icon={ICONS[href] ?? BookOpen} size="sm" />
                      <span>{label}</span>
                      <ArrowUpRight className="lxh-menu-arrow" size={16} strokeWidth={1.8} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            <Link href={CTA[1]} className="lx-btn lx-btn--primary lxh-cta">
              <span>{CTA[0]}</span>
            </Link>

            <button
              ref={menuButtonRef}
              className="lxh-burger"
              type="button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
        </div>

        {ticker ? (
          <div className="lxh-ticker" role="region" aria-label="News and announcements">
            <div className="lxh-ticker-inner">
              <div className="lxh-marquee">
                <div className="lxh-track">
                  {[0, 1].map((copy) => (
                    <div className="lxh-group" key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
                      {NEWS.map((text) => (
                        <span className="lxh-news" key={text}>
                          <span>{text}</span>
                          <span className="lxh-sep" aria-hidden="true" />
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="lxh-progress" aria-hidden="true">
          <span />
        </div>
      </div>

      <div className="lxh-spacer" aria-hidden="true" />

      {menuOpen ? (
        <div
          id="mobile-navigation"
          className="lxh-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <button className="lxh-scrim" type="button" aria-label="Close navigation" onClick={closeMenu} />
          <div className="lxh-sheet-panel">
            <div className="lxh-sheet-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/roots-logo.svg" alt="ROOTS-AI" width={603} height={792} />
              <button
                ref={closeButtonRef}
                type="button"
                className="lxh-close"
                aria-label="Close navigation"
                onClick={closeMenu}
              >
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </button>
            </div>
            <nav
              aria-label="Mobile main navigation"
              className="lxh-sheet-nav"
              onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--gx", `${e.clientX - r.left}px`);
                e.currentTarget.style.setProperty("--gy", `${e.clientY - r.top}px`);
                e.currentTarget.dataset.touch = "true";
              }}
              onPointerLeave={(e) => {
                delete e.currentTarget.dataset.touch;
              }}
            >
              {MOBILE.map(([label, href], i) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className="lxh-sheet-link"
                  style={{ "--i": i } as CSSProperties}
                  data-active={isActive(href) ? "true" : undefined}
                >
                  <IconTile icon={ICONS[href] ?? BookOpen} size="sm" tone={isActive(href) ? "teal" : "light"} />
                  <span>{label}</span>
                  <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              ))}
              <Link href={CTA[1]} className="lx-btn lx-btn--primary lxh-sheet-cta" onClick={closeMenu}>
                {CTA[0]}
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}

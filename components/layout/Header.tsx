"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const links = [
    ["How It Works", "/how-it-works"],
    ["Platform", "/platform"],
    ["Example Report", "/example-report"],
    ["Research", "/research"],
    ["About", "/about"],
  ];
  const moreLinks = [
    ["Healthcare Professionals", "/healthcare-professionals"],
    ["Pilot Program", "/pilot"],
    ["Contact", "/contact"],
    ["Blog", "/blog"],
  ];
  const mobileLinks = [
    ["Home", "/"],
    ...links,
    ...moreLinks,
    ["Privacy", "/privacy"],
    ["Terms", "/terms"],
    ["Cookies", "/cookies"],
    ["Medical Disclaimer", "/medical-disclaimer"],
    ["AI Disclaimer", "/ai-disclaimer"],
  ];

  const closeMenu = () => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  useEffect(() => {
    const handleScroll = () => document.querySelector(".site-header")?.classList.toggle("is-sticky", window.scrollY >= 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(document.querySelectorAll<HTMLElement>("#mobile-navigation a[href], #mobile-navigation button:not([disabled])"));
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
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo" aria-label="ROOTS-AI home" onClick={closeMenu}><Image src="/brand/roots-logo.png" alt="ROOTS-AI" width={214} height={34} priority /></Link>
        <nav className="site-nav" aria-label="Main navigation">
          {links.map(([label, href]) => <Link key={href} href={href} className={pathname === href ? "active" : ""} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
          <button type="button" className="more-nav-button" aria-expanded={moreOpen} aria-controls="more-menu" onClick={() => setMoreOpen((open) => !open)}>More</button>
          {moreOpen && <div id="more-menu" className="more-menu">{moreLinks.map(([label, href]) => <Link key={href} href={href} onClick={() => setMoreOpen(false)}>{label}</Link>)}</div>}
        </nav>
        <Link href="/assessment" className="header-cta">Start Your Assessment</Link>
        <button ref={menuButtonRef} className="mobile-menu-button" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? "×" : "☰"}</button>
      </div>
      {menuOpen && <div id="mobile-navigation" className="mobile-navigation" role="dialog" aria-modal="true" aria-label="Mobile navigation"><div className="mobile-navigation-panel"><div className="mobile-navigation-head"><strong>ROOTS-AI™</strong><button ref={closeButtonRef} type="button" aria-label="Close navigation" onClick={closeMenu}>×</button></div><nav aria-label="Mobile main navigation">{mobileLinks.map(([label, href]) => <Link key={href} href={href} onClick={closeMenu}>{label}</Link>)}<Link href="/assessment" className="mobile-navigation-cta" onClick={closeMenu}>Start Your Assessment</Link></nav></div><button className="mobile-navigation-scrim" type="button" aria-label="Close navigation" onClick={closeMenu} /></div>}
    </header>
  );
}

'use client';

/**
 * Wraps every page with the global header (PUB01-Z01) and footer (PUB01-Z09).
 * Assessment routes use their own shell instead (C-05 §3 "Assessment" shell: logo, progress,
 * Save & Exit; no marketing navigation), rendered by app/assessment/layout.tsx.
 */

import { usePathname } from 'next/navigation';
import CookieConsent from './CookieConsent';
import LuxuryEffects from './LuxuryEffects';
import Header from './SiteHeader';
import Footer from './layout/Footer';

/**
 * C-05 SYS-01 is a "Global public overlay" for "eligible public visitors", and C-04 §1 keeps
 * protected routes free of analytics entirely — so there is no consent to ask for on them.
 */
const PROTECTED = ['/assessment', '/report', '/admin', '/account', '/auth'];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/assessment' || pathname?.startsWith('/assessment/')) return <>{children}<LuxuryEffects /></>;

  const isPublic = !PROTECTED.some((route) => pathname === route || pathname?.startsWith(`${route}/`));

  return (
    <>
      <Header />
      {children}
      <Footer />
      {isPublic ? <CookieConsent /> : null}
      <LuxuryEffects />
    </>
  );
}

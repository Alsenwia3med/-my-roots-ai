'use client';

/**
 * Wraps every page with the global header (PUB01-Z01) and footer (PUB01-Z09).
 * Assessment routes use their own shell instead (C-05 §3 "Assessment" shell: logo, progress,
 * Save & Exit; no marketing navigation), rendered by app/assessment/layout.tsx.
 */

import { usePathname } from 'next/navigation';
import CookieConsent from './CookieConsent';
import LuxHeader from './lux/LuxHeader';
import LuxFooter from './lux/LuxFooter';
import LuxMotion from './lux/LuxMotion';
import { HOME_FOOTER } from './lux/chrome-data';

/**
 * C-05 SYS-01 is a "Global public overlay" for "eligible public visitors", and C-04 §1 keeps
 * protected routes free of analytics entirely — so there is no consent to ask for on them.
 */
const PROTECTED = ['/assessment', '/report', '/admin', '/account', '/auth'];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The assessment entry page is public and is where "Start Your Assessment" lands, so it keeps the
  // full site header and footer. The questionnaire screens (everything below it) keep the focused shell.
  if (pathname === '/assessment') {
    return (
      <>
        <LuxHeader hoverNavigate />
        <div data-assessment-entry="">{children}</div>
        <LuxFooter data={HOME_FOOTER} />
        <LuxMotion />
      </>
    );
  }
  if (pathname?.startsWith('/assessment/')) return <>{children}<LuxMotion /></>;

  const isPublic = !PROTECTED.some((route) => pathname === route || pathname?.startsWith(`${route}/`));

  return (
    <>
      <LuxHeader hoverNavigate />
      {children}
      <LuxFooter data={HOME_FOOTER} />
      {isPublic ? <CookieConsent /> : null}
      <LuxMotion />
    </>
  );
}

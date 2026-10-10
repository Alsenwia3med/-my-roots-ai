// Admin area root. The site header and footer come from SiteChrome as on every public page;
// this layout only keeps the area out of search results and caches.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administrator access — ROOTS-AI™',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

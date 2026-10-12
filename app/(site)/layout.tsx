// app/(site)/layout.tsx — root layout for every route except the locked homepage.
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import './zd-tokens.css';
// Lux design system: header, footer and every redesigned page (presentation only).
import '@/components/lux/lux.css';
import SiteChrome from '@/components/SiteChrome';

export const metadata: Metadata = {
  title: 'ROOTS-AI™ - Decode the Biology Before You Fight the Weight',
  description: 'ROOTS-AI™ turns a structured assessment into a governed biological intelligence report.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior: Next.js 16 opt-in so page changes jump to the top instantly.
    <html lang="en" data-scroll-behavior="smooth" className={`${GeistSans.variable} ${GeistMono.variable} lx-motion`}>
      <body className="lux-body lx-body">
        <a href="#main" className="skip-link">Skip to content</a>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}

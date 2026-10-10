// app/(site)/layout.tsx — root layout for every route except the locked homepage.
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './chrome.css'; // header/footer chrome identical to the homepage
import './globals.css';
import './zd-tokens.css';
import './clone-pages.css';
import './inner-pages-home-type.css';
import './legal-pages.css';
import './public-pages.css';
import './example-report.css';
import './luxury-clean.css'; // clean high-end skin for inner pages (presentation only)
import SiteChrome from '@/components/SiteChrome';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ROOTS-AI™ - Decode the Biology Before You Fight the Weight',
  description: 'ROOTS-AI™ turns a structured assessment into a governed biological intelligence report.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior: Next.js 16 opt-in so page changes jump to the top instantly.
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="lux-body">
        <a href="#main" className="skip-link">Skip to content</a>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}

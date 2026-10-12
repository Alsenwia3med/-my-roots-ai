import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "../globals.css";
import "../design-system.css";
// Lux design system: shared header (with the fixed news ticker), footer and homepage sections.
import "@/components/lux/lux.css";
import LuxHeader from "@/components/lux/LuxHeader";
import LuxMotion from "@/components/lux/LuxMotion";
import CookieBanner from "@/components/layout/CookieBanner";

const siteUrl = new URL("https://roots-ai-learning.vercel.app");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "ROOTS-AI™ | Biological Intelligence Platform",
    template: "%s | ROOTS-AI™",
  },
  description:
    "A governed biological assessment and educational reporting platform across seven connected domains.",
  applicationName: "ROOTS-AI™",
  keywords: [
    "biological intelligence",
    "educational assessment",
    "deterministic scoring",
    "wellness information",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "ROOTS-AI™",
    title: "ROOTS-AI™ | Biological Intelligence Platform",
    description:
      "A governed biological assessment and educational reporting platform across seven connected domains.",
  },
  twitter: {
    card: "summary",
    title: "ROOTS-AI™ | Biological Intelligence Platform",
    description:
      "A governed biological assessment and educational reporting platform across seven connected domains.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased lx-motion`}
    >
      <body className="min-h-full flex flex-col lx-body">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <LuxHeader ticker />
        <div id="main-content" className="site-content" tabIndex={-1}>
          {children}
        </div>
        {/* The homepage renders its own footer copy (components/RootsV1.tsx). */}
        <CookieBanner />
        <LuxMotion />
      </body>
    </html>
  );
}

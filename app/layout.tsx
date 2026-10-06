import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/layout/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <Header />
        <div id="main-content" className="site-content" tabIndex={-1}>
          {children}
        </div>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}

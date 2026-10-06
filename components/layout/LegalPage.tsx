import type { ReactNode } from "react";
import Link from "next/link";
import PrintButton from "@/components/layout/PrintButton";

export interface LegalSection {
  title: string;
  text: string;
}

export interface LegalLink {
  label: string;
  href: string;
}

export interface LegalPageProps {
  eyebrow: string;
  title: string;
  intro?: string;
  sections: LegalSection[];
  children?: ReactNode;
  relatedLinks?: LegalLink[];
  /**
   * "article" renders the notice as continuous prose inside a bordered card with a
   * leading callout and a trailing effective-date rule — the LEG-04/LEG-05 shape.
   * "indexed" keeps the sticky contents sidebar used by the long notices.
   */
  variant?: "indexed" | "article";
  callout?: string;
  relatedHeading?: string;
  showIntro?: boolean;
  showSectionHeadings?: boolean;
}

export default function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
  children,
  relatedLinks = [],
  variant = "indexed",
  callout,
  relatedHeading = "Related information",
  showIntro = true,
  showSectionHeadings = true,
}: LegalPageProps) {
  const effectiveDate = "Effective date: 21 July 2026 • Version: 1.0.1.";
  const isArticle = variant === "article";

  return <main className={`legal-page${isArticle ? " legal-page-article" : ""}`}>
    <section className="legal-heading"><p className="marketing-kicker">{eyebrow}</p><h1>{title}</h1><p className="legal-meta">{effectiveDate}</p><PrintButton /></section>
    {isArticle
      ? <article className="legal-article">
          {callout && <div className="legal-callout"><p>{callout}</p></div>}
          {showIntro && <p className="legal-intro">{intro}</p>}
          {sections.map((section, index) => <section id={`legal-section-${index}`} key={section.title}>{showSectionHeadings && <h2>{section.title}</h2>}<p>{section.text}</p></section>)}
          {children}
          <p className="legal-meta legal-meta-repeat">{effectiveDate}</p>
          {relatedLinks.length > 0 && <div className="legal-related"><h2>{relatedHeading}</h2>{relatedLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>}
        </article>
      : <div className={`legal-layout${sections.length === 0 ? " legal-layout-single" : ""}`}>{sections.length > 0 && <nav className="legal-contents" aria-label="On this page"><strong>Contents</strong>{sections.map((section, index) => <a key={section.title} href={`#legal-section-${index}`}>{index + 1}. {section.title}</a>)}</nav>}<article className="legal-article"><p className="legal-intro">{intro}</p>{sections.map((section, index) => <section id={`legal-section-${index}`} key={section.title}><h2>{index + 1}. {section.title}</h2><p>{section.text}</p></section>)}{children}{relatedLinks.length > 0 && <div className="legal-related"><h2>{relatedHeading}</h2>{relatedLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>}</article></div>}
  </main>;
}

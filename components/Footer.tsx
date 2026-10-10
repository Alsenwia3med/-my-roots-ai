'use client';

/**
 * Global footer, zone PUB01-Z09.
 *
 * Authority: PUB-01_1440_MASTER_CORRECTED_FINAL.svg / PUB-01_360_MASTER_CORRECTED_FINAL.svg
 * (v1.2.1), restyled to the light layout: wordmark, four link groups
 * (Product / Architecture / Governance / Legal), a divider, the boundary statement, copyright
 * and colour line. Centred at 360, left-aligned columns on desktop. Colours are tokens only.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

type FooterLink = { label: string; href: string | null; mono?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Biological Assessment', href: '/assessment' },
      { label: 'Sample 19-Section Report', href: '/example-report' },
      { label: 'How It Works', href: '/how-it-works' },
    ],
  },
  {
    title: 'Architecture',
    links: [
      { label: '7 Biological Domains', href: '/platform' },
      { label: 'Deterministic Logic Rules', href: '/platform' },
      { label: 'Clinical Uncertainty Engine', href: '/platform' },
    ],
  },
  {
    title: 'Governance',
    links: [
      { label: 'Beta Pilot Program', href: '/pilot' },
      { label: 'HIPAA / GDPR Protection', href: '/privacy' },
      { label: 'Zero Hallucination Bounds', href: '/ai-disclaimer' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Non-Diagnostic Educational Tool', href: '/medical-disclaimer' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

export default function Footer() {
  const pathname = usePathname();
  const current = (href: string) =>
    pathname === href || (href === '/blog' && pathname?.startsWith('/blog/')) ? 'page' : undefined;

  return (
    <footer className={styles.footer} data-zone="PUB01-Z09">
      <div className={styles.inner}>
        <div className={styles.top}>
          <Link href="/" className={styles.brand} aria-label="ROOTS-AI™ home">
            <span className={styles.wordmark}>ROOTS-AI™</span>
          </Link>
        </div>

        <nav className={styles.columns} aria-label="Footer">
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className={styles.columnTitle}>{column.title}</h2>
              <ul className={styles.list}>
                {column.links.map(({ label, href, mono }) => (
                  <li key={label}>
                    {href ? (
                      <Link href={href} className={styles.link} aria-current={current(href)}>
                        {label}
                      </Link>
                    ) : (
                      <span className={`${styles.link} ${mono ? styles.linkMono : ''}`}>{label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.legal}>
          <p className={styles.disclaimer}>
            ROOTS-AI™ is an educational and biological intelligence software platform developed to
            evaluate self-reported physiological patterns. It does not provide medical diagnoses,
            clinical treatment plans, or emergency health assessments. Always consult a qualified
            physician or endocrinologist before making clinical decisions.
          </p>
          <div className={styles.bottom}>
            <p className={styles.copyright}>© 2026 ROOTS-AI Health Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ASM-01 · Assessment Entry content. Copy is the v1.21 publication-candidate document
// (lib/content/website-v121-pages.ts, ASSESSMENT_PAGE); the form is ./EntryForm.tsx.
// Shared by /assessment and the design preview so the two cannot drift apart.

import Link from 'next/link';
import styles from '../assessment.module.css';
import EntryForm from './EntryForm';
import { ASSESSMENT_PAGE as PAGE } from '@/lib/content/website-v121-pages';

export default function EntryContent() {
  return (
    <>
      <p className={styles.eyebrow}>{PAGE.kicker}</p>
      <h1 className={styles.title}>{PAGE.headline}</h1>
      <p className={styles.lede}>
        <strong>{PAGE.tagline}</strong>
      </p>
      <p className={styles.lede}>{PAGE.intro}</p>
      {PAGE.introMore.map((text) => (
        <p className={styles.lede} key={text}>
          {text}
        </p>
      ))}

      <h2 className={styles.sectionTitle}>{PAGE.expect.heading}</h2>
      <ul className={styles.expectList}>
        {PAGE.expect.blocks.map((block) => (
          <li key={block.label}>
            <strong>{block.label}</strong>
            <span>{block.text}</span>
          </li>
        ))}
      </ul>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>{PAGE.form.heading}</h2>
        <EntryForm />
      </div>

      <h2 className={styles.sectionTitle}>{PAGE.boundaries.heading}</h2>
      {PAGE.boundaries.paragraphs.map((text) => (
        <p className={styles.body} key={text}>
          {text}
        </p>
      ))}

      <nav className={styles.legalLinks} aria-label="Legal">
        {PAGE.links.map((link) => (
          <Link className={styles.link} href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <p className={styles.body}>{PAGE.closing}</p>
    </>
  );
}

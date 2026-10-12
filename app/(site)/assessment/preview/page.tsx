/**
 * DESIGN PREVIEW ONLY — /assessment/preview
 *
 * Lets the redesigned assessment screens be reviewed without an account or a database:
 *   /assessment/preview?screen=entry   the entry screen (ASM-01), real copy and real form
 *   /assessment/preview?m=1 … 13       a real module with the real question controls
 * Nothing here is saved or sent. Remove this route before merging to production.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../assessment.module.css';
import EntryForm from '../_components/EntryForm';
import PreviewModule from './PreviewModule';
import { ASSESSMENT_ENTRY } from '@/lib/assessment/copy';
import { getModuleByOrder, getModuleQuestions } from '@/lib/assessment/questionBank';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AssessmentPreview({ searchParams }: { searchParams: Promise<{ m?: string; screen?: string }> }) {
  const { m, screen } = await searchParams;

  if (screen === 'entry') {
    return (
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>{ASSESSMENT_ENTRY.headline}</h1>
        <p className={styles.lede}>{ASSESSMENT_ENTRY.intro}</p>
        <ul className={styles.list}>
          {ASSESSMENT_ENTRY.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <div className={styles.card}>
          <EntryForm />
        </div>
        <nav className={styles.legalLinks} aria-label="Legal">
          <Link className={styles.link} href="/privacy">Privacy</Link>
          <Link className={styles.link} href="/terms">Terms</Link>
          <Link className={styles.link} href="/medical-disclaimer">Medical Disclaimer</Link>
          <Link className={styles.link} href="/ai-disclaimer">AI Disclaimer</Link>
        </nav>
      </main>
    );
  }

  const order = Math.min(13, Math.max(1, Number(m) || 1));
  const assessmentModule = getModuleByOrder(order)!;
  return (
    <main id="main" className={styles.main}>
      <PreviewModule module={assessmentModule} questions={getModuleQuestions(assessmentModule.module_id)} />
    </main>
  );
}

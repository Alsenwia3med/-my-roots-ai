/**
 * DESIGN PREVIEW ONLY — /assessment/preview
 *
 * Lets the redesigned assessment screens be reviewed without an account or a database:
 *   /assessment/preview?screen=entry   the entry screen (ASM-01), real copy and real form
 *   /assessment/preview?m=1 … 13       a real module with the real question controls
 * Nothing here is saved or sent. Remove this route before merging to production.
 */

import type { Metadata } from 'next';
import styles from '../assessment.module.css';
import EntryContent from '../_components/EntryContent';
import PreviewModule from './PreviewModule';
import { getModuleByOrder, getModuleQuestions } from '@/lib/assessment/questionBank';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AssessmentPreview({ searchParams }: { searchParams: Promise<{ m?: string; screen?: string }> }) {
  const { m, screen } = await searchParams;

  if (screen === 'entry') {
    return (
      <main id="main" className={styles.main}>
        <EntryContent />
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

// PUB-05 (C-05). Copy is C-04 §3 "/research"; the page only lays out lib/content/c04-pages.ts.

import type { Metadata } from 'next';
import PublicPage from '@/components/PublicPage';
import { RESEARCH } from '@/lib/content/c04-pages';

export const metadata: Metadata = {
  title: RESEARCH.meta!.title,
  description: RESEARCH.meta!.description,
};

export default function ResearchPage() {
  return <PublicPage page={RESEARCH} kicker="ROOTS / RESEARCH" />;
}

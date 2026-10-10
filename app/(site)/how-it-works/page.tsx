// PUB-02 (C-05). Copy is C-04 §3 "/how-it-works"; the page only lays out lib/content/c04-pages.ts.

import type { Metadata } from 'next';
import PublicPage from '@/components/PublicPage';
import { HOW_IT_WORKS } from '@/lib/content/c04-pages';

export const metadata: Metadata = {
  title: HOW_IT_WORKS.meta!.title,
  description: HOW_IT_WORKS.meta!.description,
};

export default function HowItWorksPage() {
  return <PublicPage page={HOW_IT_WORKS} kicker="ROOTS / HOW IT WORKS" />;
}

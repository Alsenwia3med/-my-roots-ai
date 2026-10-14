// PUB-02 (C-05). Copy is the v1.21 publication-candidate document; the page only lays out lib/content/website-v121.ts.

import type { Metadata } from 'next';
import PublicPage from '@/components/PublicPage';
import { HOW_IT_WORKS } from '@/lib/content/website-v121';

export const metadata: Metadata = {
  title: HOW_IT_WORKS.meta!.title,
  description: HOW_IT_WORKS.meta!.description,
};

export default function HowItWorksPage() {
  return <PublicPage page={HOW_IT_WORKS} kicker="ROOTS / HOW IT WORKS" />;
}

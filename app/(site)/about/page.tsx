// PUB-08 (C-05). Copy is the v1.21 publication-candidate document; the page only lays out lib/content/website-v121.ts.

import type { Metadata } from 'next';
import PublicPage from '@/components/PublicPage';
import { ABOUT } from '@/lib/content/website-v121';

export const metadata: Metadata = {
  title: ABOUT.meta!.title,
  description: ABOUT.meta!.description,
};

export default function AboutPage() {
  return <PublicPage page={ABOUT} kicker="ROOTS / ABOUT" />;
}

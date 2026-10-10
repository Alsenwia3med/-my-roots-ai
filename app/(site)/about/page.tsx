// PUB-08 (C-05). Copy is C-04 §3 "/about"; the page only lays out lib/content/c04-pages.ts.

import type { Metadata } from 'next';
import PublicPage from '@/components/PublicPage';
import { ABOUT } from '@/lib/content/c04-pages';

export const metadata: Metadata = {
  title: ABOUT.meta!.title,
  description: ABOUT.meta!.description,
};

export default function AboutPage() {
  return <PublicPage page={ABOUT} kicker="ROOTS / ABOUT" />;
}

// PUB-03 (C-05). Copy is C-04 §3 "/platform"; the page only lays out lib/content/c04-pages.ts.

import type { Metadata } from 'next';
import PublicPage from '@/components/PublicPage';
import { PLATFORM } from '@/lib/content/c04-pages';

export const metadata: Metadata = {
  title: PLATFORM.meta!.title,
  description: PLATFORM.meta!.description,
};

export default function PlatformPage() {
  return <PublicPage page={PLATFORM} kicker="ROOTS / PLATFORM" />;
}

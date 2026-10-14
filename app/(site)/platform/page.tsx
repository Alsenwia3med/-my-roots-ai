// PUB-03 (C-05). Copy is the v1.21 publication-candidate document; the page only lays out lib/content/website-v121.ts.

import type { Metadata } from 'next';
import PublicPage from '@/components/PublicPage';
import { PLATFORM } from '@/lib/content/website-v121';

export const metadata: Metadata = {
  title: PLATFORM.meta!.title,
  description: PLATFORM.meta!.description,
};

export default function PlatformPage() {
  return <PublicPage page={PLATFORM} kicker="ROOTS / PLATFORM" />;
}

// PUB-05 (C-05). Copy is the v1.21 publication-candidate document; the page only lays out lib/content/website-v121.ts.

import type { Metadata } from 'next';
import ResearchManifesto from '@/components/rp/ResearchManifesto';
import { RESEARCH } from '@/lib/content/website-v121';

export const metadata: Metadata = {
  title: RESEARCH.meta!.title,
  description: RESEARCH.meta!.description,
};

export default function ResearchPage() {
  return <ResearchManifesto page={RESEARCH} kicker="ROOTS / RESEARCH" />;
}

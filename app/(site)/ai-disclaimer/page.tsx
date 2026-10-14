// Legal copy is the v1.21 publication-candidate document; the page only lays out lib/content/legal-v121.ts.

import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { AI_DISCLAIMER } from '@/lib/content/legal-v121';

export const metadata: Metadata = {
  title: 'AI Disclaimer — ROOTS-AI™',
  description: 'How AI is used, and what it is never permitted to do.',
};

export default function AiDisclaimerPage() {
  return <LegalPage doc={AI_DISCLAIMER} />;
}

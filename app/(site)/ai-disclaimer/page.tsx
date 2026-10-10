// C-04 §§4-8 governed legal copy; the page only lays out lib/content/c04-legal.ts.

import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { AI_DISCLAIMER } from '@/lib/content/c04-legal';

export const metadata: Metadata = {
  title: 'AI Disclaimer — ROOTS-AI™',
  description: 'How AI is used, and what it is never permitted to do.',
};

export default function AiDisclaimerPage() {
  return <LegalPage doc={AI_DISCLAIMER} />;
}

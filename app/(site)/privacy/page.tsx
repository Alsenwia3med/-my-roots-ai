// C-04 §§4-8 governed legal copy; the page only lays out lib/content/c04-legal.ts.

import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { PRIVACY } from '@/lib/content/c04-legal';

export const metadata: Metadata = {
  title: 'Privacy Notice — ROOTS-AI™',
  description: 'How ROOTS-AI™ handles personal data across the Phase 1 web platform.',
};

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}

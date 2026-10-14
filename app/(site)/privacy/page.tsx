// Legal copy is the v1.21 publication-candidate document; the page only lays out lib/content/legal-v121.ts.

import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { PRIVACY } from '@/lib/content/legal-v121';

export const metadata: Metadata = {
  title: 'Privacy Notice — ROOTS-AI™',
  description: 'How ROOTS-AI™ handles personal data across the Phase 1 web platform.',
};

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}

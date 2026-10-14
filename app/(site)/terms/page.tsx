// Legal copy is the v1.21 publication-candidate document; the page only lays out lib/content/legal-v121.ts.

import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { TERMS } from '@/lib/content/legal-v121';

export const metadata: Metadata = {
  title: 'Terms of Service — ROOTS-AI™',
  description: 'The conditions for using the ROOTS-AI™ educational assessment and reporting service.',
};

export default function TermsPage() {
  return <LegalPage doc={TERMS} />;
}

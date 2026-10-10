// C-04 §§4-8 governed legal copy; the page only lays out lib/content/c04-legal.ts.

import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { TERMS } from '@/lib/content/c04-legal';

export const metadata: Metadata = {
  title: 'Terms of Service — ROOTS-AI™',
  description: 'The conditions for using the ROOTS-AI™ educational assessment and reporting service.',
};

export default function TermsPage() {
  return <LegalPage doc={TERMS} />;
}

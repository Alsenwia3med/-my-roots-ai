// C-04 §§4-8 governed legal copy; the page only lays out lib/content/c04-legal.ts.

import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { MEDICAL_DISCLAIMER } from '@/lib/content/c04-legal';

export const metadata: Metadata = {
  title: 'Medical Disclaimer — ROOTS-AI™',
  description: 'ROOTS-AI™ is educational and is not a medical device, diagnosis or treatment service.',
};

export default function MedicalDisclaimerPage() {
  return <LegalPage doc={MEDICAL_DISCLAIMER} />;
}

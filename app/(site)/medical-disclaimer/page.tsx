// Legal copy is the v1.21 publication-candidate document; the page only lays out lib/content/legal-v121.ts.

import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { MEDICAL_DISCLAIMER } from '@/lib/content/legal-v121';

export const metadata: Metadata = {
  title: 'Medical Disclaimer — ROOTS-AI™',
  description: 'ROOTS-AI™ is educational and is not a medical device, diagnosis or treatment service.',
};

export default function MedicalDisclaimerPage() {
  return <LegalPage doc={MEDICAL_DISCLAIMER} />;
}

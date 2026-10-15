// PUB-06 (C-05). Copy is the v1.21 publication-candidate document; the page only lays out lib/content/website-v121.ts.

import type { Metadata } from 'next';
import HealthcareBalance from '@/components/rp/HealthcareBalance';
import { HEALTHCARE_PROFESSIONALS } from '@/lib/content/website-v121';

// C-04 §10 supplies a metadata row for seven routes; this is not one of them. The page's own
// approved headline and intro are used rather than leaving the site-wide default title, which
// would name the home page.
export const metadata: Metadata = {
  title: `${HEALTHCARE_PROFESSIONALS.headline} — ROOTS-AI™`,
  description: HEALTHCARE_PROFESSIONALS.intro,
};

export default function HealthcareProfessionalsPage() {
  return <HealthcareBalance page={HEALTHCARE_PROFESSIONALS} kicker="ROOTS / FOR PROFESSIONALS" />;
}

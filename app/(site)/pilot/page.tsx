// PUB-07 (C-05). Copy is C-04 §3 "/pilot"; the page only lays out lib/content/c04-pages.ts.

import type { Metadata } from 'next';
import PublicPage from '@/components/PublicPage';
import { PILOT } from '@/lib/content/c04-pages';

// C-04 §10 supplies a metadata row for seven routes; this is not one of them. The page's own
// approved headline and intro are used rather than leaving the site-wide default title, which
// would name the home page.
export const metadata: Metadata = {
  title: `${PILOT.headline} — ROOTS-AI™`,
  description: PILOT.intro,
};

export default function PilotPage() {
  return <PublicPage page={PILOT} kicker="ROOTS / FREE BETA" />;
}

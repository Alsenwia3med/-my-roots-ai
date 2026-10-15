// PUB-11 Blog Landing (C-05). Copy is the v1.21 publication-candidate document ("Insights"); the layout is components/rp/BlogPage.tsx.

import type { Metadata } from 'next';
import BlogPage from '@/components/rp/BlogPage';
import { INSIGHTS_PAGE as PAGE } from '@/lib/content/website-v121-pages';

// Posts from LinkedIn arrive at any time, so the page is rendered per request.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${PAGE.headline} — ROOTS-AI™`,
  description: PAGE.intro,
};

export default function Page() {
  return <BlogPage />;
}

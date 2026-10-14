// DESIGN EXPLORATION ONLY — /design. Three flagship designs per page, for ROOTS to choose from.
// Nothing here replaces or changes an existing page; remove this folder (and components/design)
// before merging to production.

import type { Metadata } from 'next';
import '@/components/design/design.css';

export const metadata: Metadata = {
  title: 'Design options — ROOTS-AI™',
  robots: { index: false, follow: false },
};

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return children;
}

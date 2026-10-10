// C-04 §§4-8 governed legal copy; the page only lays out lib/content/c04-legal.ts.

import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { COOKIES } from '@/lib/content/c04-legal';

export const metadata: Metadata = {
  title: 'Cookie Notice — ROOTS-AI™',
  description: 'How each cookie category is treated, and what you can control.',
};

export default function CookiesPage() {
  return <LegalPage doc={COOKIES} />;
}

// PUB-09 / PUB-10 (C-05). Copy is the v1.21 publication-candidate document; the form is app/(site)/contact/ContactForm.tsx and the layout is components/rp/ContactPage.tsx.

import type { Metadata } from 'next';
import ContactPage from '@/components/rp/ContactPage';
import { CONTACT_PAGE as PAGE } from '@/lib/content/website-v121-pages';

export const metadata: Metadata = {
  title: `${PAGE.headline} — ROOTS-AI™`,
  description: PAGE.intro,
};

export default function Page() {
  return <ContactPage />;
}

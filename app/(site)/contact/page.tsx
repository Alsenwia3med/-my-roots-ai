// PUB-09 / PUB-10 (C-05). Copy is C-04 §3 "/contact"; the form is app/contact/ContactForm.tsx.

import type { Metadata } from 'next';
import { Suspense } from 'react';
import ContactForm from './ContactForm';
import { CONTACT } from '@/lib/content/c04-pages';

export const metadata: Metadata = {
  title: `${CONTACT.headline} — ROOTS-AI™`,
  description: CONTACT.intro,
};

export default function ContactPage() {
  return (
    <div className="clone-page">
      <main className="marketing-page inner-page public-page" id="main">
        {/* PUB-09 zone 1 — intro */}
        <section className="page-heading">
          <p className="marketing-kicker">ROOTS / CONTACT</p>
          <h1>{CONTACT.headline}</h1>
          <p>{CONTACT.intro}</p>
        </section>

        <div className="contact-body">
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

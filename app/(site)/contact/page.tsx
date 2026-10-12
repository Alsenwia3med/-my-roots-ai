// PUB-09 / PUB-10 (C-05). Copy is C-04 §3 "/contact"; the form is app/contact/ContactForm.tsx.

import type { Metadata } from 'next';
import { Suspense } from 'react';
import ContactForm from './ContactForm';
import { CONTACT } from '@/lib/content/c04-pages';
import PageHero from '@/components/lux/PageHero';

export const metadata: Metadata = {
  title: `${CONTACT.headline} — ROOTS-AI™`,
  description: CONTACT.intro,
};

export default function ContactPage() {
  return (
    <div className="lx lxc">
      <main id="main">
        {/* PUB-09 zone 1 — intro */}
        <PageHero kicker="ROOTS / CONTACT" title={CONTACT.headline} intro={CONTACT.intro} scene="dialog" />

        <div className="lxc-body lx-wrap" id="contact-form">
          <div className="lxc-card" data-reveal="scale">
            <Suspense fallback={null}>
              <ContactForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

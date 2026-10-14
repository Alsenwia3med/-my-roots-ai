// PUB-09 / PUB-10 (C-05). Copy is the v1.21 publication-candidate document; the form is app/contact/ContactForm.tsx.

import type { Metadata } from 'next';
import { Suspense } from 'react';
import ContactForm from './ContactForm';
import { CONTACT_PAGE as PAGE } from '@/lib/content/website-v121-pages';
import PageHero from '@/components/lux/PageHero';
import { ZoneSheet } from '@/components/PublicPage';

export const metadata: Metadata = {
  title: `${PAGE.headline} — ROOTS-AI™`,
  description: PAGE.intro,
};

export default function ContactPage() {
  return (
    <div className="lx lxc">
      <main id="main">
        {/* PUB-09 zone 1 — intro */}
        <PageHero
          kicker={PAGE.kicker}
          title={PAGE.headline}
          intro={
            <>
              <strong className="lxp-tagline">{PAGE.tagline}</strong>
              <p>{PAGE.intro}</p>
              {PAGE.introMore.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </>
          }
          scene="dialog"
        />

        <ZoneSheet zones={PAGE.help} />

        <div className="lxc-body lx-wrap" id="contact-form">
          <div className="lxc-card" data-reveal="scale">
            <h2 className="lx-h2">{PAGE.form.heading}</h2>
            <Suspense fallback={null}>
              <ContactForm />
            </Suspense>
          </div>
        </div>

        <ZoneSheet zones={PAGE.after} />

        <div className="lxd-footnote lx-wrap">
          {PAGE.corporate.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </main>
    </div>
  );
}

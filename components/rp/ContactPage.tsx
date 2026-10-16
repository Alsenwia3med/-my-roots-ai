/**
 * Contact — the same hero, rows and boxes as the other public pages, with the secure form set in
 * a teal-edged card. The form itself (app/(site)/contact/ContactForm.tsx) is unchanged. Copy:
 * lib/content/website-v121-pages.ts.
 */

import { Suspense } from 'react';
import CompanyOffices from '../CompanyOffices';
import type { PageContent } from '@/lib/content/c04-pages';
import { CONTACT_PAGE as PAGE } from '@/lib/content/website-v121-pages';
import ContactForm from '@/app/(site)/contact/ContactForm';
import { HeroL, Rows } from './shared';
import { RpRoot } from './RpClient';
import './rp.css';
import './rp-extra.css';

const page = {
  route: '/contact',
  headline: PAGE.headline,
  tagline: PAGE.tagline,
  intro: PAGE.intro,
  introMore: PAGE.introMore,
  kicker: PAGE.kicker,
  ctas: [],
  bullets: [],
} as PageContent;

export default function ContactPage() {
  return (
    <RpRoot slug="contact">
      <HeroL page={page} kicker={PAGE.kicker} />
      <div className="contact-help">
        <Rows zones={PAGE.help} />
      </div>
      <section className="sec" id="contact-form">
        <div className="wrap">
          <div className="cform tint r28 rv" data-glow="">
            <h2 className="h2" style={{ marginBottom: 18 }}>{PAGE.form.heading}</h2>
            <div className="lx lxc">
              <Suspense fallback={null}>
                <ContactForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
      <Rows zones={PAGE.after} />
      <section className="sec">
        <div className="wrap corp rv">
          <CompanyOffices />
        </div>
      </section>
    </RpRoot>
  );
}

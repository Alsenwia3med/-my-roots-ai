'use client';

/**
 * PUB-09 Contact and PUB-10 Contact Confirmation (C-05).
 *
 * PUB-09 zones, in the order C-05 lists them:
 *   1 Intro        contact purpose               (the page heading, rendered by the server page)
 *   2 Inquiry type REMOVED at ROOTS' instruction  (see the note below)
 *   3 Form         name, email, message, consent (C-04 §3 "Fields"; C-04 controls the field list)
 *   4 Safety note  do not submit emergency information
 *   5 Submit       protected, rate-limited
 *   6 Alternative  approved business contact, if provided
 *
 * PUB-10 replaces the form on success, at /contact?status=sent as C-05 specifies:
 *   1 Success    reference ID and a neutral confirmation
 *   2 Next steps expected response channel, with no time promised
 *   3 Actions    return home; send another enquiry
 *
 * The reference comes from the server. The enquiry itself is never stored, so that reference is
 * the only thread between this screen and the email the team receives — it is not invented here.
 *
 * ## The enquiry type, and why it is no longer here
 *
 * C-04 /contact lists the fields as "enquiry type, name, email, message, consent checkbox", and
 * C-05 PUB-09 gives the enquiry type its own zone. **ROOTS instructed that it be removed**, so it
 * is gone from the screen, the request schema and the notification email.
 *
 * Two things this leaves inconsistent, recorded here rather than left to be found:
 *
 *   - the approved C-04 intro on this page still reads "Use the secure form for product support,
 *     privacy requests, research collaboration or business enquiries", naming categories the form
 *     no longer asks about. That sentence is controlled copy and is unchanged;
 *   - the Privacy Notice's rights CTA (C-05 LEG-01 z4) routes data-rights requests here, and there
 *     is now no way for a sender to mark one as such. The team sees every enquiry undifferentiated.
 *
 * Both need a ROOTS decision. Raised separately.
 */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  CONTACT,
  CONTACT_CONFIRMATION,
  CONTACT_EMERGENCY_NOTICE,
  CONTACT_MESSAGE_LIMIT,
} from '@/lib/content/c04-pages';

type Status = 'idle' | 'sending';

/** PENDING — functional labels C-04 does not supply. */
const LABEL = {
  name: 'Name',
  email: 'Email',
  message: 'Message',
  consent:
    'I have read the Privacy Notice and agree to ROOTS-AI™ using these details to respond to my enquiry.',
  // 'en-GB' is explicit: an unpinned toLocaleString follows the runtime's default locale, so
  // the server and the browser can disagree about the thousands separator. Review point 34.
  remaining: (n: number) => `${n.toLocaleString('en-GB')} characters remaining`,
  sending: 'Sending…',
  received: 'Enquiry received',
  reference: 'Your reference',
  nextSteps: 'What happens next',
  nextStepsBody: 'We will respond by email, to the address you provided.',
  again: 'Send another enquiry',
  home: 'Return home',
};

export default function ContactForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(CONTACT_MESSAGE_LIMIT);
  const confirmationRef = useRef<HTMLDivElement>(null);

  const sent = params.get('status') === 'sent';
  const reference = params.get('ref');

  // Moving focus to the confirmation tells a screen-reader user the form was replaced.
  useEffect(() => {
    if (sent) confirmationRef.current?.focus();
  }, [sent]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const form = new FormData(event.currentTarget);
    setStatus('sending');
    setError(null);

    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          message: form.get('message'),
          consent: form.get('consent') === 'on',
          website: form.get('website'),
        }),
      });

      if (res.ok) {
        const body = (await res.json().catch(() => null)) as { reference?: string } | null;
        const query = body?.reference ? `?status=sent&ref=${encodeURIComponent(body.reference)}` : '?status=sent';
        router.replace(`/contact${query}`);
        return;
      }

      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? 'We could not send your message. Please try again later.');
    } catch {
      setError('We could not send your message. Check your connection and try again.');
    }
    setStatus('idle');
  }

  if (sent) {
    return (
      <div className="contact-confirmation" ref={confirmationRef} role="status" tabIndex={-1}>
        <p className="cf-eyebrow">{LABEL.received}</p>
        <h2>{CONTACT_CONFIRMATION}</h2>

        {reference ? (
          <p className="cf-reference">
            <span>{LABEL.reference}</span>
            <strong>{reference}</strong>
          </p>
        ) : null}

        <div className="cf-next">
          <h3>{LABEL.nextSteps}</h3>
          <p>{LABEL.nextStepsBody}</p>
        </div>

        <div className="cf-actions">
          <Link className="primary-button" href="/contact">
            {LABEL.again}
          </Link>
          <Link className="secondary-button" href="/">
            {LABEL.home}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="contact-form" noValidate={false} onSubmit={handleSubmit}>
      {/*
        zone 3 — the C-04 field list.

        Grouped so the zone is a zone. C-05 lists the enquiry type (z2) and the field list (z3) as
        separate zones; before this they rendered as one undifferentiated column of equal gaps, so
        the boundary C-05 draws was invisible. The wrapper carries that boundary and nothing else:
        no field, label, id or control type changes, so the keyboard order and the accessible names
        already evidenced are untouched.
      */}
      <div className="cf-fields">
        <div className="cf-field">
          <label htmlFor="name">{LABEL.name}</label>
          <input autoComplete="name" id="name" maxLength={100} name="name" required />
        </div>

        <div className="cf-field">
          <label htmlFor="contact-email">{LABEL.email}</label>
          <input autoComplete="email" id="contact-email" maxLength={254} name="email" required type="email" />
        </div>

        <div className="cf-field">
          <label htmlFor="message">{LABEL.message}</label>
          <textarea
            aria-describedby="message-remaining"
            id="message"
            maxLength={CONTACT_MESSAGE_LIMIT}
            minLength={10}
            name="message"
            onChange={(e) => setRemaining(CONTACT_MESSAGE_LIMIT - e.target.value.length)}
            required
            rows={7}
          />
          <p className="cf-counter" id="message-remaining">
            {LABEL.remaining(remaining)}
          </p>
        </div>

        <label className="cf-consent">
          <input name="consent" required type="checkbox" />
          <span>
            {LABEL.consent.split('Privacy Notice')[0]}
            <Link href="/privacy">Privacy Notice</Link>
            {LABEL.consent.split('Privacy Notice')[1]}
          </span>
        </label>
      </div>

      {/* zone 4 — safety note, in the approved C-04 wording */}
      <p className="cf-safety">{CONTACT_EMERGENCY_NOTICE}</p>

      {/* Honeypot: hidden from people and assistive technology; bots that fill it are dropped. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="website">Website</label>
        <input autoComplete="off" id="website" name="website" tabIndex={-1} />
      </div>

      {error ? (
        <p className="cf-error" role="alert">
          {error}
        </p>
      ) : null}

      {/* zone 5 — submit */}
      <button className="primary-button" disabled={status === 'sending'} type="submit">
        {status === 'sending' ? LABEL.sending : CONTACT.ctas[0].label}
      </button>
    </form>
  );
}

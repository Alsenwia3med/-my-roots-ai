/**
 * Contact-form input rules, shared by the API route and its tests. Pure: no server imports.
 */

import { z } from 'zod';
import { CONTACT_MESSAGE_LIMIT } from '../content/c04-pages';

/**
 * C-04 /contact: "Fields: enquiry type, name, email, message, consent checkbox" and
 * "Message limit: 2,000 characters".
 *
 * The enquiry type C-04 lists among the fields was removed at ROOTS' instruction, so it is not
 * accepted here either: a request carrying one is not rejected, the value is simply ignored.
 *
 * The consent box must be ticked — an unticked box is not consent, so the schema takes only
 * `true` rather than a boolean. C-05 PUB-09 also lists a "subject" field; C-04 controls the
 * field list and does not include one, so it is not collected. Raised with ROOTS.
 */
export const ContactBody = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  message: z.string().trim().min(10).max(CONTACT_MESSAGE_LIMIT),
  consent: z.literal(true),
});

export type ContactMessage = z.infer<typeof ContactBody>;

/**
 * A reference the sender can quote and the team can match against the email they received.
 * Generated server-side per enquiry: the message itself is never stored, so this is the only
 * thread between the two.
 */
export function newEnquiryReference(random: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from({ length: 6 }, () => alphabet[Math.floor(random() * alphabet.length)]).join('');
  return `ENQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${code}`;
}

/** Line breaks and control characters removed, so a name can never inject an email header. */
export const singleLine = (s: string) => s.replace(/[\x00-\x1f\x7f]+/g, ' ').replace(/\s+/g, ' ').trim();

export function parseContact(body: Record<string, unknown>): ContactMessage | null {
  const parsed = ContactBody.safeParse({
    name: typeof body.name === 'string' ? singleLine(body.name) : body.name,
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email,
    message: body.message,
    consent: body.consent,
  });
  return parsed.success ? parsed.data : null;
}

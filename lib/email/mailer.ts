/**
 * Transactional email. The messages are composed here; lib/email/transport.ts sends them through
 * Cloudflare Email Sending.
 *
 * Secure-link emails contain only the link: no answers or health data. Contact-form enquiries go
 * to the team inbox with the sender as Reply-To.
 */

import 'server-only';
import { fill, PENDING } from '@/lib/assessment/copy';
import { singleLine, type ContactMessage } from '@/lib/contact/message';
import { deliver, emailTransportAvailable } from './transport';

/** True when email can be sent from this environment. */
export function emailConfigured(): Promise<boolean> {
  return emailTransportAvailable();
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function sendSecureLinkEmail(to: string, link: string, expiryMinutes: number): Promise<void> {
  const text = fill(PENDING.magicLinkEmailBody, { minutes: expiryMinutes, link });
  const html = text
    .split('\n\n')
    .map((paragraph) =>
      paragraph === link
        ? `<p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>`
        : `<p>${escapeHtml(paragraph)}</p>`
    )
    .join('');

  await deliver({ to, subject: PENDING.magicLinkSubject, text, html });
}

/**
 * Contact-page enquiry to the team inbox (CONTACT_TO_EMAIL, else the sending address). Reply-To
 * is the sender, so the team answers them directly. The message itself is not stored anywhere.
 */
export async function sendContactEmail(msg: ContactMessage, reference: string): Promise<void> {
  const to = process.env.CONTACT_TO_EMAIL?.trim();
  if (!to) throw new Error('Contact email is not configured: CONTACT_TO_EMAIL is required.');
  const name = singleLine(msg.name);

  // The reference is the only thread between the sender's confirmation screen and this email:
  // the enquiry itself is never stored, so it travels in the subject where the team will see it.
  const text = `Reference: ${reference}
Name: ${name}\nEmail: ${msg.email}\n\n${msg.message}`;
  const html =
    `<p><strong>Reference:</strong> ${escapeHtml(reference)}<br>` +
    `<strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(msg.email)}</p>` +
    msg.message
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
      .join('');

  await deliver({
    to,
    subject: `ROOTS-AI enquiry ${reference}: ${name}`.slice(0, 150),
    text,
    html,
    replyTo: { name, address: msg.email },
  });
}

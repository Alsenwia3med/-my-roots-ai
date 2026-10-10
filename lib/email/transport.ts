/**
 * How email leaves the application — Cloudflare Email Sending only.
 *
 * Two ways in, one service:
 *   on Cloudflare Workers  the `EMAIL` binding declared in wrangler.jsonc. No credentials: the
 *                          Worker is recognised by the account that owns the sending domain.
 *   anywhere else          the same service's REST API, with CLOUDFLARE_ACCOUNT_ID and an API
 *                          token (CLOUDFLARE_EMAIL_API_TOKEN). Used for local development only.
 *
 * SMTP is not used anywhere: Workers cannot open SMTP connections.
 */

import 'server-only';

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Where a reply should go, when it is not the sending address. */
  replyTo?: { name?: string; address: string };
}

export type TransportName = 'cloudflare-binding' | 'cloudflare-api';

interface Address {
  email: string;
  name?: string;
}

interface CloudflareEmailSender {
  send(message: {
    to: string | Address;
    from: string | Address;
    subject: string;
    text?: string;
    html?: string;
    replyTo?: string | Address;
  }): Promise<{ messageId?: string }>;
}

/** "ROOTS-AI <no-reply@roots-ai.health>" -> { email, name }; a bare address works too. */
export function parseFrom(from: string): Address {
  const m = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(from);
  return m ? { email: m[2].trim(), ...(m[1] ? { name: m[1] } : {}) } : { email: from.trim() };
}

/** The Workers binding, or null when not running on Cloudflare. */
async function binding(): Promise<CloudflareEmailSender | null> {
  try {
    // Cloudflare-only adapter: not installed on Vercel/local, so resolve it at runtime (not bundled).
    const adapter = '@opennextjs/cloudflare';
    const { getCloudflareContext } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ adapter);
    const env = (await getCloudflareContext({ async: true }))?.env as { EMAIL?: CloudflareEmailSender } | undefined;
    return env?.EMAIL ?? null;
  } catch {
    return null; // not on Cloudflare (local development, or a unit test)
  }
}

const apiCredentials = () => {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_EMAIL_API_TOKEN?.trim();
  return account && token ? { account, token } : null;
};

function sender(): Address {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) throw new Error('Email is not configured: EMAIL_FROM is required.');
  return parseFrom(from);
}

/** Sends the message and returns which path carried it (for the audit trail). */
export async function deliver(email: OutgoingEmail): Promise<TransportName> {
  const from = sender();
  const replyTo = email.replyTo ? { email: email.replyTo.address, ...(email.replyTo.name ? { name: email.replyTo.name } : {}) } : undefined;

  const emailBinding = await binding();
  if (emailBinding) {
    await emailBinding.send({ to: email.to, from, subject: email.subject, text: email.text, html: email.html, ...(replyTo ? { replyTo } : {}) });
    return 'cloudflare-binding';
  }

  const credentials = apiCredentials();
  if (!credentials) {
    throw new Error('Email is not configured: no Cloudflare EMAIL binding, and CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_EMAIL_API_TOKEN are not set.');
  }
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${credentials.account}/email/sending/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${credentials.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email.to,
      from: from.name ? `${from.name} <${from.email}>` : from.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
      ...(replyTo ? { reply_to: replyTo.name ? `${replyTo.name} <${replyTo.email}>` : replyTo.email } : {}),
    }),
  });
  if (!response.ok) {
    // The body can carry the recipient address, so only the status is logged.
    throw new Error(`Cloudflare email API returned ${response.status}`);
  }
  return 'cloudflare-api';
}

/** True when a message can be sent from this environment. */
export async function emailTransportAvailable(): Promise<boolean> {
  if (!process.env.EMAIL_FROM?.trim()) return false;
  return apiCredentials() !== null || (await binding()) !== null;
}

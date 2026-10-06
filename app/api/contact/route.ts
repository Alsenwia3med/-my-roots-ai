import { NextResponse } from "next/server";

const enquiryTypes = new Set(["support", "privacy", "research", "business"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactBody = {
  enquiryType?: unknown;
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  website?: unknown;
  consent?: unknown;
};

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let body: ContactBody;
  try {
    body = await request.json() as ContactBody;
  } catch {
    return errorResponse("Enter a valid enquiry.", 400);
  }

  // Honeypot: bots fill every field they can see. The response mirrors a success
  // path so the submission is never confirmed to an automated client.
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  const enquiryType = typeof body.enquiryType === "string" ? body.enquiryType : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!enquiryTypes.has(enquiryType)) return errorResponse("Choose an enquiry type.", 400);
  if (name.length < 2 || name.length > 120) return errorResponse("Enter your name.", 400);
  if (!emailPattern.test(email) || email.length > 254) return errorResponse("Enter a valid email address.", 400);
  if (subject.length > 160) return errorResponse("Keep the subject under 160 characters.", 400);
  if (message.length < 10 || message.length > 2000) return errorResponse("Your message must be between 10 and 2,000 characters.", 400);
  if (body.consent !== true) return errorResponse("Acknowledge the privacy notice before sending.", 400);

  const webhook = process.env.CONTACT_WEBHOOK_URL?.trim();
  if (!webhook) {
    return errorResponse("Secure enquiry delivery is not configured yet. Your message was not sent.", 503);
  }

  let parsedWebhook: URL;
  try {
    parsedWebhook = new URL(webhook);
    if (parsedWebhook.protocol !== "https:") throw new Error("Webhook must use HTTPS");
  } catch {
    return errorResponse("Secure enquiry delivery is temporarily unavailable. Your message was not sent.", 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(parsedWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ enquiryType, name, email, subject, message, receivedAt: new Date().toISOString() }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return errorResponse("Secure enquiry delivery is temporarily unavailable. Your message was not sent.", 502);
    return NextResponse.json({ received: true }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch {
    return errorResponse("Secure enquiry delivery is temporarily unavailable. Your message was not sent.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

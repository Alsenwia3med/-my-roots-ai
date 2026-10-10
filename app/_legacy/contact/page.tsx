"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";

const ENQUIRY_TYPES = [
  { value: "support", label: "Product support" },
  { value: "privacy", label: "Privacy" },
  { value: "research", label: "Research collaboration" },
  { value: "business", label: "Business" },
];

const MESSAGE_LIMIT = 2000;

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enquiryType: data.get("enquiryType"), name: data.get("name"), email: data.get("email"), message: data.get("message"), website: data.get("website"), consent: data.get("consent") === "on" }) });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Your enquiry could not be sent.");
      setStatus("sent");
      setMessage("");
      form.reset();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Your enquiry could not be sent. Please try again.");
      setStatus("error");
    }
  }

  const remaining = MESSAGE_LIMIT - message.length;

  return <main className="route-shell contact-page"><p className="marketing-kicker">ROOTS / CONTACT</p><h1>Start the Right Conversation</h1><p className="route-lede">Use the secure form for product support, privacy requests, research collaboration or business enquiries. Do not send urgent medical information.</p>{status === "sent" ? <section className="success-message" role="status"><h2>Thank you. Your enquiry has been received.</h2><p>We will respond through the contact details you provided.</p><button type="button" className="secondary-button" onClick={() => setStatus("idle")}>Send another enquiry</button></section> : <form className="contact-form" onSubmit={submit}>
    <fieldset className="enquiry-types"><legend>Enquiry type</legend>{ENQUIRY_TYPES.map((type, index) => <label key={type.value} className="enquiry-chip"><input type="radio" name="enquiryType" value={type.value} defaultChecked={index === 0} /><span>{type.label}</span></label>)}</fieldset>
    <label htmlFor="contact-name">Name</label>
    <input id="contact-name" name="name" autoComplete="name" required />
    <label htmlFor="contact-email">Email</label>
    <input id="contact-email" name="email" type="email" autoComplete="email" required />
    <label htmlFor="contact-message">Message</label>
    <textarea id="contact-message" name="message" rows={6} maxLength={MESSAGE_LIMIT} value={message} onChange={(event) => setMessage(event.target.value)} required aria-describedby="message-counter" />
    <p id="message-counter" className="field-help">{remaining.toLocaleString("en-US")} characters remaining</p>
    <div className="honeypot-field" aria-hidden="true">
      <label htmlFor="contact-website">Website</label>
      <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
    <label className="consent-row" htmlFor="contact-consent"><input id="contact-consent" name="consent" type="checkbox" required /><span>I have read the <Link href="/privacy">Privacy Notice</Link> and agree to ROOTS-AI™ using these details to respond to my enquiry.</span></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <p className="contact-emergency" role="note">This form is not monitored for emergencies. Contact local emergency services if you may be in immediate danger.</p>
    <button className="primary-button" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending securely…" : "Send Enquiry"}</button>
  </form>}</main>;
}


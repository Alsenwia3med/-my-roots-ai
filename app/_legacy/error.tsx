"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="route-shell route-shell-wide"><p className="eyebrow">ROOTS / SERVICE ERROR</p><h1>We could not load this page.</h1><p className="route-lede">Your saved assessment is not affected. Try the request again, or return to the assessment entry page.</p><div className="form-actions"><button type="button" className="primary-button" onClick={() => reset()}>Try again</button><Link href="/assessment" className="secondary-button">Assessment entry</Link></div></main>;
}

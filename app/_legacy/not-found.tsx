import Link from "next/link";

export default function NotFound() {
  return <main className="route-shell route-shell-wide"><p className="eyebrow">ROOTS / NOT FOUND</p><h1>That page is not available.</h1><p className="route-lede">The address may have changed, or the page may not be part of the current ROOTS-AI experience.</p><div className="form-actions"><Link href="/" className="primary-button">Return home</Link><Link href="/assessment" className="secondary-button">Start your assessment</Link></div></main>;
}

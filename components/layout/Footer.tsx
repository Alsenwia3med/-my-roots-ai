
import Link from "next/link";

const COOKIE_COPY = "We use essential technologies to keep ROOTS-AI™ secure. With your permission, we may use limited analytics on public pages. We do not use advertising pixels or session replay on assessment, report, sign-in or admin pages.";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link href="/" className="footer-logo" aria-label="ROOTS-AI home">
          <span>ROOTS-AI<sup>™</sup></span>
        </Link>
        <div className="footer-grid">
          <div><strong>Product</strong><Link href="/assessment">Assessment</Link><Link href="/example-report">Example Report</Link><Link href="/how-it-works">How It Works</Link><Link href="/platform">Platform</Link></div>
          <div><strong>Company</strong><Link href="/about">About</Link><Link href="/research">Research</Link><Link href="/healthcare-professionals">Healthcare Professionals</Link><Link href="/pilot">Pilot Program</Link><Link href="/contact">Contact</Link><Link href="/blog">Blog</Link></div>
          <div><strong>Legal</strong><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/cookies">Cookies</Link><Link href="/medical-disclaimer">Medical Disclaimer</Link><Link href="/ai-disclaimer">AI Disclaimer</Link></div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>ROOTS-AI™ provides educational wellness information and does not diagnose or treat medical conditions.</p>
        <p>© 2026 ROOTS AI HEALTH SYSTEMS, Inc. All rights reserved.</p>
        <p className="footer-cookie-copy">{COOKIE_COPY}</p>
      </div>
    </footer>
  );
}

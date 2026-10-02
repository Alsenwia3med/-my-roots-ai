export default function Footer() {
  return (
    <footer className="site-footer py-[72px_30px] bg-ink text-white">
      <div className="shell">
        <div className="footer-top grid grid-cols-4fr 2fr 2fr 2fr gap-9 mb-12">
          <div className="footer-col">
            <h3 className="text-[#b9bec4] text-[12px] tracking-[0.1em] uppercase mb-4">
              ROOTS-AI™
            </h3>
            <p className="text-[#cdd1d5] text-sm leading-relaxed">
              Biological Intelligence Platform. Decode the biology before you fight the weight.
            </p>
          </div>
          <div className="footer-col">
            <h3 className="text-[#b9bec4] text-[12px] tracking-[0.1em] uppercase mb-4">
              Platform
            </h3>
            <a href="/how-it-works" className="min-h-[44px] flex items-center text-white no-underline hover:underline">
              How It Works
            </a>
            <a href="/platform" className="min-h-[44px] flex items-center text-white no-underline hover:underline">
              Platform
            </a>
            <a href="/research" className="min-h-[44px] flex items-center text-white no-underline hover:underline">
              Research
            </a>
          </div>
          <div className="footer-col">
            <h3 className="text-[#b9bec4] text-[12px] tracking-[0.1em] uppercase mb-4">
              Legal
            </h3>
            <a href="/terms" className="min-h-[44px] flex items-center text-white no-underline hover:underline">
              Terms of Service
            </a>
            <a href="/privacy" className="min-h-[44px] flex items-center text-white no-underline hover:underline">
              Privacy Policy
            </a>
            <a href="/healthcare-professionals" className="min-h-[44px] flex items-center text-white no-underline hover:underline">
              Healthcare Professionals
            </a>
          </div>
          <div className="footer-col">
            <h3 className="text-[#b9bec4] text-[12px] tracking-[0.1em] uppercase mb-4">
              Company
            </h3>
            <a href="/about" className="min-h-[44px] flex items-center text-white no-underline hover:underline">
              About
            </a>
            <a href="/contact" className="min-h-[44px] flex items-center text-white no-underline hover:underline">
              Contact
            </a>
          </div>
        </div>

        <div className="footer-boundary max-w-[460px] text-[#cdd1d5] text-sm mb-8">
          <p className="mb-4">
            This assessment is for informational purposes only and does not constitute medical advice. Please consult with a qualified healthcare professional for any health concerns.
          </p>
        </div>

        <div className="footer-bottom mt-12 pt-[22px] border-t border-[#3b3f44] text-[#cdd1d5] text-[13px]">
          <p>© {new Date().getFullYear()} ROOTS-AI™. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

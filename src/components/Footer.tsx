import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-roots-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-2xl font-bold mb-4">ROOTS.AI</div>
            <p className="text-roots-gray text-sm">
              Biological Intelligence Platform
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/how-it-works" className="text-roots-gray hover:text-roots-gold transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/platform" className="text-roots-gray hover:text-roots-gold transition-colors">
                  Platform
                </Link>
              </li>
              <li>
                <Link href="/research" className="text-roots-gray hover:text-roots-gold transition-colors">
                  Research
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-roots-gray hover:text-roots-gold transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-roots-gray hover:text-roots-gold transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-roots-gray hover:text-roots-gold transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-roots-gray hover:text-roots-gold transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-roots-blue pt-8 text-center text-roots-gray text-sm">
          <p>© {new Date().getFullYear()} ROOTS.AI. All rights reserved.</p>
          <p className="mt-2 text-xs">
            This assessment is for informational purposes only and does not constitute medical advice.
          </p>
        </div>
      </div>
    </footer>
  )
}

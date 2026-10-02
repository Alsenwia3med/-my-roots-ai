'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="bg-roots-dark text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold tracking-tight">ROOTS.AI</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/how-it-works" className="text-sm font-medium hover:text-roots-gold transition-colors">
                How It Works
              </Link>
              <Link href="/platform" className="text-sm font-medium hover:text-roots-gold transition-colors">
                Platform
              </Link>
              <Link href="/example-report" className="text-sm font-medium hover:text-roots-gold transition-colors">
                Example Report
              </Link>
              <Link href="/research" className="text-sm font-medium hover:text-roots-gold transition-colors">
                Research
              </Link>
              <Link href="/about" className="text-sm font-medium hover:text-roots-gold transition-colors">
                About
              </Link>
              <Link href="/more" className="text-sm font-medium hover:text-roots-gold transition-colors">
                More
              </Link>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:block">
              <Link
                href="/assessment/start"
                className="px-6 py-2 bg-roots-gold text-roots-dark font-semibold rounded-full hover:bg-roots-gold-light transition-colors"
              >
                Start Your Assessment
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-roots-blue transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-roots-blue">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/how-it-works" className="block px-3 py-2 text-sm font-medium hover:bg-roots-blue-light rounded-md">
                How It Works
              </Link>
              <Link href="/platform" className="block px-3 py-2 text-sm font-medium hover:bg-roots-blue-light rounded-md">
                Platform
              </Link>
              <Link href="/example-report" className="block px-3 py-2 text-sm font-medium hover:bg-roots-blue-light rounded-md">
                Example Report
              </Link>
              <Link href="/research" className="block px-3 py-2 text-sm font-medium hover:bg-roots-blue-light rounded-md">
                Research
              </Link>
              <Link href="/about" className="block px-3 py-2 text-sm font-medium hover:bg-roots-blue-light rounded-md">
                About
              </Link>
              <Link href="/more" className="block px-3 py-2 text-sm font-medium hover:bg-roots-blue-light rounded-md">
                More
              </Link>
              <Link
                href="/assessment/start"
                className="block px-3 py-2 text-sm font-medium bg-roots-gold text-roots-dark rounded-md mt-4"
              >
                Start Your Assessment
              </Link>
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <style jsx global>{`
          body { overflow: hidden; }
        `}</style>
      )}
    </>
  )
}

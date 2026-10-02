'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="site-header relative z-40 border-b border-line bg-white/97 backdrop-blur">
        <div className="shell mx-auto min-h-[78px] flex items-center justify-between gap-[22px] px-5 lg:px-10">
          <Link href="/" className="brand inline-flex items-center min-h-[44px] text-[21px] font-[850] tracking-[-0.035em] whitespace-nowrap no-underline">
            ROOTS-AI™ <small className="ml-2 text-muted text-[10px] font-[700] tracking-[0.08em]">HEALTH</small>
          </Link>

          <nav className="desktop-nav hidden md:flex items-center gap-1" aria-label="Primary navigation">
            <Link href="/how-it-works" className="min-h-[44px] inline-flex items-center px-[10px] py-2 rounded-lg text-[14px] font-[650] hover:bg-soft no-underline">
              How It Works
            </Link>
            <Link href="/platform" className="min-h-[44px] inline-flex items-center px-[10px] py-2 rounded-lg text-[14px] font-[650] hover:bg-soft no-underline">
              Platform
            </Link>
            <Link href="/research" className="min-h-[44px] inline-flex items-center px-[10px] py-2 rounded-lg text-[14px] font-[650] hover:bg-soft no-underline">
              Research
            </Link>
            <Link href="/healthcare-professionals" className="min-h-[44px] inline-flex items-center px-[10px] py-2 rounded-lg text-[14px] font-[650] hover:bg-soft no-underline">
              Healthcare Professionals
            </Link>
            <Link href="/example-report" className="min-h-[44px] inline-flex items-center px-[10px] py-2 rounded-lg text-[14px] font-[650] hover:bg-soft no-underline">
              Example Report
            </Link>
            <Link href="/assessment/start" className="button min-h-[48px] inline-flex items-center justify-center px-[18px] py-[11px] border border-ink rounded-[10px] bg-ink text-white no-underline font-[750] cursor-pointer compact min-h-[44px] px-4 py-2">
              Start Your Assessment
            </Link>
          </nav>

          <button
            className="menu-button md:hidden w-[46px] h-[46px] border border-line rounded-[10px] bg-white cursor-pointer text-[22px]"
            type="button"
            aria-label="Open navigation"
            aria-controls="mobile-navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className={`mobile-layer ${mobileMenuOpen ? 'open' : ''}`} id="mobile-navigation" aria-hidden={!mobileMenuOpen}>
        <button
          className="mobile-scrim absolute inset-0 border-0 bg-black/38"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
        <aside className="mobile-panel absolute top-0 right-0 w-[min(88vw,370px)] h-full p-5 bg-white shadow-roots overflow-y-auto" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div className="mobile-panel-head flex items-center justify-between mb-4">
            <strong>ROOTS-AI™</strong>
            <button
              className="close-menu w-[46px] h-[46px] border border-line rounded-[10px] bg-white text-[24px] cursor-pointer"
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
            >
              ×
            </button>
          </div>
          <nav className="mobile-nav grid gap-1" aria-label="Mobile primary navigation">
            <Link href="/" className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-[14px] font-[650] hover:bg-soft no-underline" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link href="/how-it-works" className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-[14px] font-[650] hover:bg-soft no-underline" onClick={() => setMobileMenuOpen(false)}>
              How It Works
            </Link>
            <Link href="/platform" className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-[14px] font-[650] hover:bg-soft no-underline" onClick={() => setMobileMenuOpen(false)}>
              Platform
            </Link>
            <Link href="/research" className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-[14px] font-[650] hover:bg-soft no-underline" onClick={() => setMobileMenuOpen(false)}>
              Research
            </Link>
            <Link href="/healthcare-professionals" className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-[14px] font-[650] hover:bg-soft no-underline" onClick={() => setMobileMenuOpen(false)}>
              Healthcare Professionals
            </Link>
            <Link href="/example-report" className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-[14px] font-[650] hover:bg-soft no-underline" onClick={() => setMobileMenuOpen(false)}>
              Example Report
            </Link>
            <Link href="/about" className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-[14px] font-[650] hover:bg-soft no-underline" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <Link href="/assessment/start" className="button min-h-[48px] inline-flex items-center justify-center px-[18px] py-[11px] border border-ink rounded-[10px] bg-ink text-white no-underline font-[750] cursor-pointer mt-2" onClick={() => setMobileMenuOpen(false)}>
              Start Your Assessment
            </Link>
          </nav>
        </aside>
      </div>

      {mobileMenuOpen && (
        <style jsx global>{`
          body { overflow: hidden; }
        `}</style>
      )}
    </>
  )
}

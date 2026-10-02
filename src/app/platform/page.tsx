import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function Platform() {
  return (
    <>
      <Header />

      <main className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-section-title font-bold text-roots-dark mb-6">Platform Overview</h1>
          <p className="text-lg text-roots-text-light mb-8">
            ROOTS-AI™ is a governed biological intelligence platform designed to help you understand patterns in your biology.
          </p>

          <div className="space-y-6">
            <div className="bg-roots-gray rounded-lg p-6">
              <h2 className="text-xl font-bold text-roots-dark mb-4">Deterministic Scoring</h2>
              <p className="text-roots-text-light">
                Our scoring engine is deterministic and governed by canonical rules from C-02 v1.0.1. No AI has authority over scoring—scores are calculated using pure mathematical functions.
              </p>
            </div>

            <div className="bg-roots-gray rounded-lg p-6">
              <h2 className="text-xl font-bold text-roots-dark mb-4">Seven-Domain System</h2>
              <p className="text-roots-text-light">
                We assess seven interconnected biological domains: Hunger & Appetite, Metabolism, Safety & Immunity, Sleep & Recovery, Circadian Timing, Stress Response, and Inflammation.
              </p>
            </div>

            <div className="bg-roots-gray rounded-lg p-6">
              <h2 className="text-xl font-bold text-roots-dark mb-4">Privacy by Design</h2>
              <p className="text-roots-text-light">
                Your data is protected with Row Level Security (RLS) policies. We never sell your data, and you can delete it at any time.
              </p>
            </div>

            <div className="bg-roots-gray rounded-lg p-6">
              <h2 className="text-xl font-bold text-roots-dark mb-4">Educational, Not Diagnostic</h2>
              <p className="text-roots-text-light">
                ROOTS-AI™ is an educational platform. Our reports are governed biological intelligence, not medical diagnoses. Always consult with healthcare professionals for medical advice.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/assessment/start"
              className="px-8 py-4 bg-roots-gold text-roots-dark font-semibold rounded-full hover:bg-roots-gold-light transition-colors inline-block"
            >
              Start Your Assessment
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

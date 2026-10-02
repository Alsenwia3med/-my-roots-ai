import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function HowItWorks() {
  return (
    <>
      <Header />

      <main className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-section-title font-bold text-roots-dark mb-6">How It Works</h1>
          <p className="text-lg text-roots-text-light mb-8">
            ROOTS-AI™ uses a structured assessment approach to decode biological patterns and provide governed intelligence.
          </p>

          <div className="space-y-6">
            <div className="bg-roots-gray rounded-lg p-6">
              <h2 className="text-xl font-bold text-roots-dark mb-4">1. Create Your Account</h2>
              <p className="text-roots-text-light">
                Sign up with your email and verify your account. Your data is encrypted and protected by Row Level Security.
              </p>
            </div>

            <div className="bg-roots-gray rounded-lg p-6">
              <h2 className="text-xl font-bold text-roots-dark mb-4">2. Complete the Assessment</h2>
              <p className="text-roots-text-light">
                Answer 73 carefully designed questions across 13 modules covering metabolism, hunger, sleep, circadian timing, stress, and inflammation-related signals.
              </p>
            </div>

            <div className="bg-roots-gray rounded-lg p-6">
              <h2 className="text-xl font-bold text-roots-dark mb-4">3. Receive Your Report</h2>
              <p className="text-roots-text-light">
                Get your governed biological intelligence report with scores across 7 domains, biological state assessment, recovery potential, and primary drivers.
              </p>
            </div>

            <div className="bg-roots-gray rounded-lg p-6">
              <h2 className="text-xl font-bold text-roots-dark mb-4">4. Track Your Progress</h2>
              <p className="text-roots-text-light">
                Complete repeat assessments over time to track changes and monitor your biological patterns.
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

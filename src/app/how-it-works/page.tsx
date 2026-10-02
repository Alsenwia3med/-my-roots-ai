import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function HowItWorks() {
  return (
    <>
      <Header />

      <main className="section-pad">
        <div className="shell max-w-4xl">
          <h1 className="mb-6">How It Works</h1>
          <p className="lead mb-8">
            ROOTS-AI™ uses a structured assessment approach to decode biological patterns and provide governed intelligence.
          </p>

          <div className="space-y-8">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">1. Create Your Account</h2>
              <p className="text-muted">
                Sign up with your email and verify your account. Your data is encrypted and protected by Row Level Security.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">2. Complete the Assessment</h2>
              <p className="text-muted">
                Answer 73 carefully designed questions across 13 modules covering metabolism, hunger, sleep, circadian timing, stress, and inflammation-related signals.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">3. Receive Your Report</h2>
              <p className="text-muted">
                Get your governed biological intelligence report with scores across 7 domains, biological state assessment, recovery potential, and primary drivers.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">4. Track Your Progress</h2>
              <p className="text-muted">
                Complete repeat assessments over time to track changes and monitor your biological patterns.
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <a href="/assessment/start" className="button">
              Start Your Assessment
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

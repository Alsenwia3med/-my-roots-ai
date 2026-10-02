import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Platform() {
  return (
    <>
      <Header />

      <main className="section-pad">
        <div className="shell max-w-4xl">
          <h1 className="mb-6">Platform Overview</h1>
          <p className="lead mb-8">
            ROOTS-AI™ is a governed biological intelligence platform designed to help you understand patterns in your biology.
          </p>

          <div className="space-y-8">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Deterministic Scoring</h2>
              <p className="text-muted">
                Our scoring engine is deterministic and governed by canonical rules from C-02 v1.0.1. No AI has authority over scoring—scores are calculated using pure mathematical functions.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Seven-Domain System</h2>
              <p className="text-muted">
                We assess seven interconnected biological domains: Metabolic Resistance, Hunger & Satiety, Sleep Recovery, Circadian Health, Stress Load, Inflammation, and Biological Safety Signals.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Privacy by Design</h2>
              <p className="text-muted">
                Your data is protected with Row Level Security (RLS) policies. We never sell your data, and you can delete it at any time.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Educational, Not Diagnostic</h2>
              <p className="text-muted">
                ROOTS-AI™ is an educational platform. Our reports are governed biological intelligence, not medical diagnoses. Always consult with healthcare professionals for medical advice.
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

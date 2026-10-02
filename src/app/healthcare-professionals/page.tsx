import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function HealthcareProfessionals() {
  return (
    <>
      <Header />

      <main className="section-pad">
        <div className="shell max-w-4xl">
          <h1 className="mb-6">Healthcare Professionals</h1>
          <p className="lead mb-8">
            ROOTS-AI™ provides governed biological intelligence reports that can support patient education and engagement.
          </p>

          <div className="space-y-8">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Educational Tool</h2>
              <p className="text-muted">
                ROOTS-AI™ is designed as an educational platform to help patients understand their biological patterns.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Governed Intelligence</h2>
              <p className="text-muted">
                Our reports are based on deterministic scoring governed by canonical requirements, not AI speculation.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Not a Diagnostic Tool</h2>
              <p className="text-muted">
                ROOTS-AI™ does not provide medical diagnoses. Healthcare professionals should use it as a supplementary educational tool.
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

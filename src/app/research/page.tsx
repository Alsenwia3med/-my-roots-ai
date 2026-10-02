import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Research() {
  return (
    <>
      <Header />

      <main className="section-pad">
        <div className="shell max-w-4xl">
          <h1 className="mb-6">Research & Development</h1>
          <p className="lead mb-8">
            ROOTS-AI™ is built on governed canonical requirements and validated through golden test cases.
          </p>

          <div className="space-y-8">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Canonical Requirements</h2>
              <p className="text-muted">
                Our platform is built from controlled documents including C-01 Canonical Question Bank v1.0.1 and C-02 Canonical Scoring Rules v1.0.1.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Golden Tests</h2>
              <p className="text-muted">
                Our scoring engine has been validated against 30 golden test cases to ensure deterministic and accurate scoring across all scenarios.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Governed AI</h2>
              <p className="text-muted">
                When AI features are added, they will be read-only with respect to all deterministic outputs, with clear boundaries and fallback mechanisms.
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

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AssessmentStart() {
  return (
    <>
      <Header />

      <main className="section-pad">
        <div className="shell max-w-2xl">
          <h1 className="mb-6">Start Your Assessment</h1>
          <p className="lead mb-8">
            This assessment consists of 73 questions across 13 modules and takes approximately 15-20 minutes to complete.
          </p>

          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4">Before You Begin</h2>
            <ul className="list-disc list-inside space-y-2 text-muted">
              <li>Ensure you have 15-20 minutes of uninterrupted time</li>
              <li>Answer honestly to receive accurate results</li>
              <li>Your data is private and secure</li>
              <li>This is educational, not diagnostic</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4">What You'll Receive</h2>
            <ul className="list-disc list-inside space-y-2 text-muted">
              <li>Scores across 7 biological domains</li>
              <li>Biological State assessment</li>
              <li>Recovery Potential metrics</li>
              <li>Driver identification</li>
              <li>Personalized insights</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <a href="/assessment" className="button">
              Start Assessment
            </a>
            <a href="/example-report" className="button secondary">
              View Example Report
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

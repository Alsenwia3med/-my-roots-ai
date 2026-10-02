import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function AssessmentStart() {
  return (
    <>
      <Header />

      <main className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-section-title font-bold text-roots-dark mb-6">Start Your Assessment</h1>
          <p className="text-lg text-roots-text-light mb-8">
            This assessment consists of 73 questions across 13 modules and takes approximately 15-20 minutes to complete.
          </p>

          <div className="bg-roots-gray rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-roots-dark mb-4">Before You Begin</h2>
            <ul className="list-disc list-inside space-y-2 text-roots-text-light">
              <li>Ensure you have 15-20 minutes of uninterrupted time</li>
              <li>Answer honestly to receive accurate results</li>
              <li>Your data is private and secure</li>
              <li>This is educational, not diagnostic</li>
            </ul>
          </div>

          <div className="bg-roots-gray rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-roots-dark mb-4">What You'll Receive</h2>
            <ul className="list-disc list-inside space-y-2 text-roots-text-light">
              <li>Scores across 7 biological domains</li>
              <li>Biological State assessment</li>
              <li>Recovery Potential metrics</li>
              <li>Driver identification</li>
              <li>Personalized insights</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/assessment"
              className="px-8 py-4 bg-roots-gold text-roots-dark font-semibold rounded-full hover:bg-roots-gold-light transition-colors"
            >
              Start Assessment
            </Link>
            <Link
              href="/example-report"
              className="px-8 py-4 bg-roots-blue text-white font-semibold rounded-full hover:bg-roots-blue-light transition-colors border border-roots-blue-light"
            >
              View Example Report
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

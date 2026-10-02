import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function About() {
  return (
    <>
      <Header />

      <main className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-section-title font-bold text-roots-dark mb-6">About ROOTS-AI</h1>
          <p className="text-lg text-roots-text-light mb-8">
            ROOTS-AI™ is a biological intelligence platform designed to help individuals understand patterns in their biology related to weight management and metabolic health.
          </p>

          <div className="space-y-6">
            <div className="bg-roots-gray rounded-lg p-6">
              <h2 className="text-xl font-bold text-roots-dark mb-4">Our Mission</h2>
              <p className="text-roots-text-light">
                To provide governed, educational biological intelligence that helps people understand the patterns behind their health struggles and make informed decisions.
              </p>
            </div>

            <div className="bg-roots-gray rounded-lg p-6">
              <h2 className="text-xl font-bold text-roots-dark mb-4">Our Approach</h2>
              <p className="text-roots-text-light">
                We use deterministic scoring governed by canonical requirements, not AI speculation. Our platform is designed to be educational, not diagnostic.
              </p>
            </div>

            <div className="bg-roots-gray rounded-lg p-6">
              <h2 className="text-xl font-bold text-roots-dark mb-4">Privacy First</h2>
              <p className="text-roots-text-light">
                Your data is private by design. We implement Row Level Security and never sell your data. You have full control over your information.
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

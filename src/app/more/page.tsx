import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function More() {
  return (
    <>
      <Header />

      <main className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-section-title font-bold text-roots-dark mb-6">More</h1>
          <p className="text-lg text-roots-text-light mb-8">
            Explore more about ROOTS-AI
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/healthcare-professionals" className="bg-roots-gray rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold text-roots-dark mb-2">Healthcare Professionals</h2>
              <p className="text-roots-text-light">
                Information for healthcare providers
              </p>
            </Link>

            <Link href="/research" className="bg-roots-gray rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold text-roots-dark mb-2">Research</h2>
              <p className="text-roots-text-light">
                Our research and development approach
              </p>
            </Link>

            <Link href="/platform" className="bg-roots-gray rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold text-roots-dark mb-2">Platform</h2>
              <p className="text-roots-text-light">
                Platform overview and features
              </p>
            </Link>

            <Link href="/about" className="bg-roots-gray rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold text-roots-dark mb-2">About</h2>
              <p className="text-roots-text-light">
                Learn more about ROOTS-AI
              </p>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

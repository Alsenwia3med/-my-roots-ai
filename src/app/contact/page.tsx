import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function Contact() {
  return (
    <>
      <Header />

      <main className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-section-title font-bold text-roots-dark mb-6">Contact Us</h1>
          <p className="text-lg text-roots-text-light mb-8">
            Have questions about ROOTS-AI? We'd love to hear from you.
          </p>

          <div className="bg-roots-gray rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-roots-dark mb-4">Get in Touch</h2>
            <p className="text-roots-text-light mb-4">
              For general inquiries, please email us at:
            </p>
            <a href="mailto:contact@roots-ai.health" className="text-roots-accent hover:underline">
              contact@roots-ai.health
            </a>
          </div>

          <div className="bg-roots-gray rounded-lg p-6">
            <h2 className="text-xl font-bold text-roots-dark mb-4">Healthcare Professionals</h2>
            <p className="text-roots-text-light">
              For partnership inquiries or healthcare professional questions, please visit our healthcare professionals page.
            </p>
            <Link
              href="/healthcare-professionals"
              className="text-roots-accent hover:underline mt-2 inline-block"
            >
              Healthcare Professionals →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

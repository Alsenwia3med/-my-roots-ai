import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Privacy() {
  return (
    <>
      <Header />

      <main className="section-pad">
        <div className="shell max-w-4xl">
          <h1 className="mb-6">Privacy Policy</h1>
          <p className="lead mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose max-w-none space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">1. Data Collection</h2>
              <p className="text-muted">
                We collect information you provide directly, including assessment responses and account information.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">2. Data Usage</h2>
              <p className="text-muted">
                Your data is used to generate your biological intelligence report and improve our platform.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">3. Data Security</h2>
              <p className="text-muted">
                We implement Row Level Security (RLS) and encryption to protect your data.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">4. Your Rights</h2>
              <p className="text-muted">
                You have the right to access, correct, or delete your personal data at any time.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

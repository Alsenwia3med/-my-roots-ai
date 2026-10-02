import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Terms() {
  return (
    <>
      <Header />

      <main className="section-pad">
        <div className="shell max-w-4xl">
          <h1 className="mb-6">Terms of Service</h1>
          <p className="lead mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose max-w-none space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted">
                By accessing or using ROOTS-AI™, you agree to be bound by these Terms of Service.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">2. Educational Purpose</h2>
              <p className="text-muted">
                ROOTS-AI™ is an educational platform and does not provide medical advice, diagnosis, or treatment.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">3. Privacy</h2>
              <p className="text-muted">
                Your use of ROOTS-AI™ is also governed by our Privacy Policy.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">4. User Responsibilities</h2>
              <p className="text-muted">
                You are responsible for maintaining the confidentiality of your account and password.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

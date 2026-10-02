import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function ExampleReport() {
  return (
    <>
      <Header />

      <main>
        {/* Biological State Score Section */}
        <section className="bg-roots-dark text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-section-title font-bold mb-4">EXAMPLE REPORT</h1>
              <p className="text-roots-gray">
                This is an example of what your biological intelligence report will look like
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {/* Main Score Card */}
              <div className="bg-roots-blue rounded-2xl p-8 mb-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="text-roots-gray text-sm uppercase tracking-wider mb-2">
                      BIOLOGICAL STATE
                    </div>
                    <div className="text-6xl font-bold mb-2">61/100</div>
                    <div className="text-roots-gold text-xl font-semibold">STRAINED</div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Stress Load</span>
                        <span className="text-sm font-bold">75</span>
                      </div>
                      <div className="h-2 bg-roots-dark rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Sleep Recovery</span>
                        <span className="text-sm font-bold">68</span>
                      </div>
                      <div className="h-2 bg-roots-dark rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Metabolic Resistance</span>
                        <span className="text-sm font-bold">62</span>
                      </div>
                      <div className="h-2 bg-roots-dark rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-roots-blue-light rounded-lg p-4 text-center text-sm text-roots-gray">
                This is a questionnaire summary, not a medical risk probability.
              </div>
            </div>
          </div>
        </section>

        {/* Domain Scores Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-section-title font-bold text-roots-dark mb-4">
                Domain Scores
              </h2>
              <p className="text-roots-text-light">
                Your scores across seven biological domains
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { domain: 'HU', name: 'Hunger & Appetite', score: 65 },
                { domain: 'ME', name: 'Metabolism', score: 62 },
                { domain: 'SA', name: 'Safety & Immunity', score: 58 },
                { domain: 'SL', name: 'Sleep & Recovery', score: 68 },
                { domain: 'CI', name: 'Circadian Timing', score: 55 },
                { domain: 'ST', name: 'Stress Response', score: 75 },
                { domain: 'IN', name: 'Inflammation', score: 50 },
              ].map((item) => (
                <div key={item.domain} className="p-6 bg-roots-gray rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                        {item.domain}
                      </div>
                      <div>
                        <div className="font-bold text-roots-dark">{item.name}</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-roots-dark">{item.score}</div>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.score >= 70 ? 'bg-red-500' :
                        item.score >= 50 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-roots-blue text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-section-title font-bold mb-6">
              Ready to see your biological intelligence report?
            </h2>
            <p className="text-lg mb-8 text-roots-gray">
              Start your assessment today and receive your personalized report.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/assessment/start"
                className="px-8 py-4 bg-roots-gold text-roots-dark font-semibold rounded-full hover:bg-roots-gold-light transition-colors"
              >
                Start Your Assessment
              </Link>
              <Link
                href="/"
                className="px-8 py-4 bg-roots-dark text-white font-semibold rounded-full hover:bg-roots-blue-light transition-colors border border-roots-blue-light"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

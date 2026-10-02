import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-roots-dark text-white py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-hero font-bold mb-6">
                  Decode the Biology Before You Fight the Weight
                </h1>
                <p className="text-lg text-roots-gray mb-8 leading-relaxed">
                  ROOTS-AI™ turns a structured assessment into a governed biological intelligence report—helping you understand patterns in metabolism, hunger, sleep, circadian timing, stress, inflammation-related signals and perceived biological resistance.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/assessment/start"
                    className="px-8 py-4 bg-roots-gold text-roots-dark font-semibold rounded-full hover:bg-roots-gold-light transition-colors"
                  >
                    Start Your Assessment
                  </Link>
                  <Link
                    href="/example-report"
                    className="px-8 py-4 bg-roots-blue text-white font-semibold rounded-full hover:bg-roots-blue-light transition-colors border border-roots-blue-light"
                  >
                    View Example Report
                  </Link>
                </div>
              </div>

              {/* Biological State Diagram */}
              <div className="relative">
                <div className="w-full aspect-square max-w-md mx-auto relative">
                  {/* Outer circle */}
                  <div className="absolute inset-0 border-4 border-roots-blue-light rounded-full pulse-glow"></div>

                  {/* Inner circle */}
                  <div className="absolute inset-8 border-2 border-roots-accent rounded-full"></div>

                  {/* Center label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-roots-gold">BIOLOGICAL</div>
                      <div className="text-2xl font-bold text-roots-gold">STATE</div>
                    </div>
                  </div>

                  {/* Orbiting elements */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-center">
                    <div className="text-sm font-medium">Hunger</div>
                  </div>
                  <div className="absolute top-1/4 right-0 translate-x-2 text-center">
                    <div className="text-sm font-medium">Sleep</div>
                  </div>
                  <div className="absolute bottom-1/4 right-0 translate-x-2 text-center">
                    <div className="text-sm font-medium">Circadian</div>
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-center">
                    <div className="text-sm font-medium">Stress</div>
                  </div>
                  <div className="absolute bottom-1/4 left-0 -translate-x-2 text-center">
                    <div className="text-sm font-medium">Inflammation</div>
                  </div>
                  <div className="absolute top-1/4 left-0 -translate-x-2 text-center">
                    <div className="text-sm font-medium">Safety</div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-sm font-medium">Metabolic</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Strip */}
        <section className="bg-roots-blue text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="text-sm font-semibold">Educational, not diagnostic</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-sm font-semibold">Deterministic scoring</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-sm font-semibold">Governed AI explanation</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-sm font-semibold">Private by design</div>
              </div>
            </div>
          </div>
        </section>

        {/* What Changes Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="text-roots-accent font-semibold text-sm uppercase tracking-wider mb-4">
                WHAT CHANGES
              </div>
              <h2 className="text-section-title font-bold text-roots-dark mb-6">
                A connected view of the patterns behind the struggle
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 bg-roots-gray rounded-lg hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-roots-dark mb-3">
                  Beyond a number on the scale
                </h3>
                <p className="text-roots-text-light">
                  See the pattern behind the struggle.
                </p>
              </div>

              <div className="p-6 bg-roots-gray rounded-lg hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-roots-dark mb-3">
                  Seven biological domains
                </h3>
                <p className="text-roots-text-light">
                  One connected view.
                </p>
              </div>

              <div className="p-6 bg-roots-gray rounded-lg hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-roots-dark mb-3">
                  Deterministic scores
                </h3>
                <p className="text-roots-text-light">
                  AI assists with explanation, not calculation.
                </p>
              </div>

              <div className="p-6 bg-roots-gray rounded-lg hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-roots-dark mb-3">
                  Your report
                </h3>
                <p className="text-roots-text-light">
                  19 transparent sections with your answers and limitations.
                </p>
              </div>

              <div className="p-6 bg-roots-gray rounded-lg hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-roots-dark mb-3">
                  Private by design
                </h3>
                <p className="text-roots-text-light">
                  Controlled access, versioning and audit.
                </p>
              </div>

              <div className="p-6 bg-roots-gray rounded-lg hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-roots-dark mb-3">
                  Educational, not diagnostic
                </h3>
                <p className="text-roots-text-light">
                  Designed to support informed conversations and realistic next steps.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seven Connected Domains Section */}
        <section className="py-20 bg-roots-dark text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="text-roots-gold font-semibold text-sm uppercase tracking-wider mb-4">
                SEVEN CONNECTED DOMAINS
              </div>
              <h2 className="text-section-title font-bold mb-6">
                One biological intelligence framework
              </h2>
            </div>

            <div className="relative">
              {/* Body silhouette placeholder */}
              <div className="flex justify-center mb-12">
                <div className="w-64 h-96 bg-roots-blue rounded-full relative flex items-center justify-center">
                  <div className="w-48 h-80 bg-roots-blue-light rounded-full pulse-glow"></div>
                </div>
              </div>

              {/* Domain cards around the body */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-roots-blue rounded-lg border border-roots-blue-light">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                      HU
                    </div>
                    <div>
                      <div className="font-bold">Hunger & Appetite</div>
                      <div className="text-xs text-roots-gray">Signals, Reward, Eating behaviour</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-roots-blue rounded-lg border border-roots-blue-light">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                      ME
                    </div>
                    <div>
                      <div className="font-bold">Metabolism</div>
                      <div className="text-xs text-roots-gray">Energy, Insulin, Storage</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-roots-blue rounded-lg border border-roots-blue-light">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                      SA
                    </div>
                    <div>
                      <div className="font-bold">Safety & Immunity</div>
                      <div className="text-xs text-roots-gray">Inflammation, Defense, Repair</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-roots-blue rounded-lg border border-roots-blue-light">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                      SL
                    </div>
                    <div>
                      <div className="font-bold">Sleep & Recovery</div>
                      <div className="text-xs text-roots-gray">Rhythms, Hormones, Restoration</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-roots-blue rounded-lg border border-roots-blue-light">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                      CI
                    </div>
                    <div>
                      <div className="font-bold">Circadian Timing</div>
                      <div className="text-xs text-roots-gray">Biological Clock, Hormonal Rhythm</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-roots-blue rounded-lg border border-roots-blue-light">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                      ST
                    </div>
                    <div>
                      <div className="font-bold">Stress Response</div>
                      <div className="text-xs text-roots-gray">HPA Axis, Resilience, Adaptation</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-roots-blue rounded-lg border border-roots-blue-light md:col-span-2 lg:col-span-3">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark font-bold mr-3">
                      IN
                    </div>
                    <div>
                      <div className="font-bold">Inflammation</div>
                      <div className="text-xs text-roots-gray">Microbiome, Gut Barrier, Systemic Signals</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="mt-12 text-center italic text-roots-gray">
                "The body is not a collection of parts, but a network of conversations."
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="text-roots-accent font-semibold text-sm uppercase tracking-wider mb-4">
                HOW IT WORKS
              </div>
              <h2 className="text-section-title font-bold text-roots-dark mb-6">
                From structured answers to governed explanation
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-roots-dark mb-3">Assess</h3>
                <p className="text-roots-text-light">
                  Complete the structured questionnaire
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-roots-dark mb-3">Validate</h3>
                <p className="text-roots-text-light">
                  Server-side validation of responses
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-roots-dark mb-3">Analyse</h3>
                <p className="text-roots-text-light">
                  Deterministic scoring across 7 domains
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-roots-gold rounded-full flex items-center justify-center text-roots-dark text-2xl font-bold mx-auto mb-4">
                  4
                </div>
                <h3 className="text-xl font-bold text-roots-dark mb-3">Explain & Render</h3>
                <p className="text-roots-text-light">
                  Governed AI explanation and report generation
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-roots-blue text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-section-title font-bold mb-6">
              Ready to understand your biology?
            </h2>
            <p className="text-lg mb-8 text-roots-gray">
              Start your assessment today and receive your governed biological intelligence report.
            </p>
            <Link
              href="/assessment/start"
              className="px-8 py-4 bg-roots-gold text-roots-dark font-semibold rounded-full hover:bg-roots-gold-light transition-colors inline-block"
            >
              Start Your Assessment
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

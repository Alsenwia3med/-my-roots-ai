import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Header />

      <main>
        {/* Hero Section */}
        <section className="min-h-[690px] grid grid-cols-7fr 5fr items-center gap-[54px] py-[84px] px-5 lg:px-10">
          <div className="shell mx-auto">
            <p className="eyebrow">Biological Intelligence Platform</p>
            <h1>Decode the Biology Before You Fight the Weight</h1>
            <p className="lead">
              ROOTS-AI™ turns a structured assessment into a governed biological intelligence report—helping you understand patterns in metabolism, hunger, sleep, circadian timing, stress, inflammation-related signals and perceived biological resistance.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <a href="/assessment/start" className="button">
                Start Your Assessment
              </a>
              <a href="/example-report" className="button secondary">
                View Example Report
              </a>
            </div>
          </div>

          <div className="signature-zone min-h-[430px] grid content-between p-[26px] border border-dashed border-[#858b92] rounded-[28px] bg-gradient-to-br from-[#fafafa] to-[#eef0f3]">
            <strong className="max-w-[260px] text-[18px] leading-[1.2]">
              Vendor design zone: create an original ROOTS-AI™ signature expression of Biological Intelligence.
            </strong>
            <div className="signature-orbit relative w-[min(100%,330px)] aspect-square mx-2 my-auto border border-[#a9afb6] rounded-full">
              <div className="absolute inset-[16%] border border-[#bfc4c9] rounded-full"></div>
              <div className="absolute inset-[33%] bg-white shadow-[0_0_0_1px_#c8ccd1] rounded-full"></div>
            </div>
            <p className="signature-note text-muted text-[13px]">
              Functional placeholder only. Do not reproduce this geometry as the final design.
            </p>
          </div>
        </section>

        {/* Trust Strip */}
        <section aria-label="Trust principles">
          <div className="trust-list min-h-[94px] grid grid-cols-4 items-center gap-px bg-line">
            <div className="trust-item h-full flex items-center justify-center p-[18px] bg-white text-center font-[750]">
              Educational, not diagnostic
            </div>
            <div className="trust-item h-full flex items-center justify-center p-[18px] bg-white text-center font-[750]">
              Deterministic scoring
            </div>
            <div className="trust-item h-full flex items-center justify-center p-[18px] bg-white text-center font-[750]">
              Governed AI explanation
            </div>
            <div className="trust-item h-full flex items-center justify-center p-[18px] bg-white text-center font-[750]">
              Private by design
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section-pad">
          <div className="shell">
            <div className="section-head max-w-[760px] mb-10">
              <h2>Six-Pattern Assessment Architecture</h2>
              <p className="text-muted">
                Our structured questionnaire captures signals across six interconnected biological patterns.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="card feature-card min-h-[190px]">
                <h3 className="text-[16px] font-bold mb-2">Metabolic Resistance</h3>
                <p className="text-muted text-[13px]">
                  Weight-change patterns, diet response, and metabolic context.
                </p>
              </div>
              <div className="card feature-card min-h-[190px]">
                <h3 className="text-[16px] font-bold mb-2">Hunger & Satiety</h3>
                <p className="text-muted text-[13px]">
                  Appetite signals, fullness patterns, and meal response.
                </p>
              </div>
              <div className="card feature-card min-h-[190px]">
                <h3 className="text-[16px] font-bold mb-2">Sleep Recovery</h3>
                <p className="text-muted text-[13px]">
                  Sleep duration, continuity, and restoration quality.
                </p>
              </div>
              <div className="card feature-card min-h-[190px]">
                <h3 className="text-[16px] font-bold mb-2">Circadian Health</h3>
                <p className="text-muted text-[13px]">
                  Timing of light, screens, meals, and sleep patterns.
                </p>
              </div>
              <div className="card feature-card min-h-[190px]">
                <h3 className="text-[16px] font-bold mb-2">Stress Load</h3>
                <p className="text-muted text-[13px]">
                  Perceived tension, stress-eating, and cognitive activation.
                </p>
              </div>
              <div className="card feature-card min-h-[190px]">
                <h3 className="text-[16px] font-bold mb-2">Inflammation Signals</h3>
                <p className="text-muted text-[13px]">
                  Contextual inflammation-related markers and burden.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seven Domains Section */}
        <section className="section-pad soft-section">
          <div className="shell">
            <div className="section-head max-w-[760px] mb-10">
              <h2>Seven-Domain Scoring System</h2>
              <p className="text-muted">
                Each domain receives a governed score from 0-100, with confidence and recovery potential metrics.
              </p>
            </div>

            <div className="grid grid-cols-7 gap-4">
              <div className="card domain-card min-h-[255px] p-[18px]">
                <div className="domain-code w-[46px] h-[46px] grid place-items-center mb-7 border border-ink rounded-full text-[12px] font-[850]">
                  MR
                </div>
                <h3 className="text-[16px] font-bold mb-2">Metabolic Resistance</h3>
                <p className="text-muted text-[13px]">
                  Self-reported weight-change resistance
                </p>
              </div>
              <div className="card domain-card min-h-[255px] p-[18px]">
                <div className="domain-code w-[46px] h-[46px] grid place-items-center mb-7 border border-ink rounded-full text-[12px] font-[850]">
                  HS
                </div>
                <h3 className="text-[16px] font-bold mb-2">Hunger & Satiety</h3>
                <p className="text-muted text-[13px]">
                  Hunger, cravings, fullness signals
                </p>
              </div>
              <div className="card domain-card min-h-[255px] p-[18px]">
                <div className="domain-code w-[46px] h-[46px] grid place-items-center mb-7 border border-ink rounded-full text-[12px] font-[850]">
                  SR
                </div>
                <h3 className="text-[16px] font-bold mb-2">Sleep Recovery</h3>
                <p className="text-muted text-[13px]">
                  Sleep duration and continuity
                </p>
              </div>
              <div className="card domain-card min-h-[255px] p-[18px]">
                <div className="domain-code w-[46px] h-[46px] grid place-items-center mb-7 border border-ink rounded-full text-[12px] font-[850]">
                  CH
                </div>
                <h3 className="text-[16px] font-bold mb-2">Circadian Health</h3>
                <p className="text-muted text-[13px]">
                  Timing of light, screens, meals
                </p>
              </div>
              <div className="card domain-card min-h-[255px] p-[18px]">
                <div className="domain-code w-[46px] h-[46px] grid place-items-center mb-7 border border-ink rounded-full text-[12px] font-[850]">
                  SL
                </div>
                <h3 className="text-[16px] font-bold mb-2">Stress Load</h3>
                <p className="text-muted text-[13px]">
                  Perceived tension and stress-eating
                </p>
              </div>
              <div className="card domain-card min-h-[255px] p-[18px]">
                <div className="domain-code w-[46px] h-[46px] grid place-items-center mb-7 border border-ink rounded-full text-[12px] font-[850]">
                  IB
                </div>
                <h3 className="text-[16px] font-bold mb-2">Inflammation</h3>
                <p className="text-muted text-[13px]">
                  Inflammation-related burden
                </p>
              </div>
              <div className="card domain-card min-h-[255px] p-[18px]">
                <div className="domain-code w-[46px] h-[46px] grid place-items-center mb-7 border border-ink rounded-full text-[12px] font-[850]">
                  BS
                </div>
                <h3 className="text-[16px] font-bold mb-2">Biological Safety</h3>
                <p className="text-muted text-[13px]">
                  Overall biological state signals
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="section-pad">
          <div className="shell">
            <div className="section-head max-w-[760px] mb-10">
              <h2>How It Works</h2>
              <p className="text-muted">
                Complete the assessment in about 15-20 minutes and receive your governed biological intelligence report.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-5">
              <div className="card step relative min-h-[250px] bg-white">
                <div className="absolute grid place-items-center w-[38px] h-[38px] mb-[46px] mt-6 rounded-full bg-ink text-white font-[800]">
                  1
                </div>
                <h3 className="text-[16px] font-bold mb-2">Create Account</h3>
                <p className="text-muted text-[13px]">
                  Sign up and verify your email to get started.
                </p>
              </div>
              <div className="card step relative min-h-[250px] bg-white">
                <div className="absolute grid place-items-center w-[38px] h-[38px] mb-[46px] mt-6 rounded-full bg-ink text-white font-[800]">
                  2
                </div>
                <h3 className="text-[16px] font-bold mb-2">Complete Assessment</h3>
                <p className="text-muted text-[13px]">
                  Answer 73 questions across 13 modules.
                </p>
              </div>
              <div className="card step relative min-h-[250px] bg-white">
                <div className="absolute grid place-items-center w-[38px] h-[38px] mb-[46px] mt-6 rounded-full bg-ink text-white font-[800]">
                  3
                </div>
                <h3 className="text-[16px] font-bold mb-2">Receive Report</h3>
                <p className="text-muted text-[13px]">
                  Get your governed biological intelligence report.
                </p>
              </div>
              <div className="card step relative min-h-[250px] bg-white">
                <div className="absolute grid place-items-center w-[38px] h-[38px] mb-[46px] mt-6 rounded-full bg-ink text-white font-[800]">
                  4
                </div>
                <h3 className="text-[16px] font-bold mb-2">Track Progress</h3>
                <p className="text-muted text-[13px]">
                  Monitor changes over time with repeat assessments.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-pad soft-section">
          <div className="shell text-center">
            <h2 className="mb-6">Ready to Understand Your Biology?</h2>
            <p className="lead mb-8">
              Start your assessment today and receive your governed biological intelligence report.
            </p>
            <a href="/assessment/start" className="button">
              Start Your Assessment
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

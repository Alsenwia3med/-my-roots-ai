import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ExampleReport() {
  return (
    <>
      <Header />

      <main className="section-pad">
        <div className="shell">
          <h1 className="mb-6">Example Report</h1>
          <p className="lead mb-8">
            This is an example of what your biological intelligence report will look like after completing the assessment.
          </p>

          <div className="card mb-8">
            <div className="flex justify-between items-end gap-5 pb-6 border-b border-line">
              <div>
                <div className="text-[54px] font-[850] leading-none tracking-[-0.05em]">67</div>
                <div className="text-muted text-[18px] font-[700]">Biological State</div>
              </div>
              <div className="px-3 py-2 border border-ink rounded-full font-[800]">
                Strained
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-bold mb-4">Domain Scores</h3>
              <div className="space-y-4">
                {[
                  { domain: 'MR', name: 'Metabolic Resistance', score: 72 },
                  { domain: 'HS', name: 'Hunger & Satiety', score: 65 },
                  { domain: 'SR', name: 'Sleep Recovery', score: 58 },
                  { domain: 'CH', name: 'Circadian Health', score: 70 },
                  { domain: 'SL', name: 'Stress Load', score: 45 },
                  { domain: 'IB', name: 'Inflammation', score: 55 },
                  { domain: 'BS', name: 'Biological Safety', score: 67 },
                ].map((d) => (
                  <div key={d.domain}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{d.name}</span>
                      <span className="text-sm text-muted">{d.score}</span>
                    </div>
                    <div className="h-2 mt-1 overflow-hidden rounded-full bg-[#e5e7e9]">
                      <div className="h-full bg-[#34383d]" style={{ width: `${d.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-line">
              <h3 className="text-xl font-bold mb-4">Primary Drivers</h3>
              <div className="space-y-2">
                <div className="flex justify-between gap-3 text-[14px] font-[700]">
                  <span>Metabolic Resistance + Hunger & Satiety (co-primary)</span>
                  <span>68.5</span>
                </div>
                <div className="flex justify-between gap-3 text-[14px] font-[700]">
                  <span>Sleep Recovery</span>
                  <span>58</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <a href="/assessment/start" className="button">
              Start Your Assessment
            </a>
            <a href="/" className="button secondary">
              Back to Home
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

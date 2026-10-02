'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { calculateScores, getClassification } from '@/lib/scoring/engine'

export default function ReportPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const mockInput = {
      age: 40,
      diseaseCount: 0,
      medicationCount: 0,
      P1: true,
      P2: true,
      P3: true,
      P4: true,
      P5: true,
      answerConfidence: 75,
      Q9: 2,
      Q10: 2,
      Q11: 2,
      Q12: 2,
      Q46: 2,
      Q47: 2,
      Q48: 2,
      Q16: 2,
      Q17: 2,
      Q18: 2,
      Q19: 2,
      Q20: 2,
      Q21: 2,
      Q22: 2,
      Q23: 2,
      Q24: 2,
      Q25: 2,
      Q26: 2,
      Q27: 2,
      Q28: 2,
      Q29: 2,
      Q30: 2,
      Q31: 2,
      Q32: 2,
      Q33: 2,
      Q34: 2,
      Q35: 2,
      Q36: 2,
      Q37: 2,
      Q38: 2,
      Q39: 2,
      Q40: 2,
      Q41: 2,
      Q42: 2,
      Q43: 2,
      Q44: 2,
      Q45: 2,
      Q49: 2,
      Q50: 2,
      Q51: 2
    }

    const scoringResults = calculateScores(mockInput)
    setResults(scoringResults)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <>
        <Header />
        <main className="section-pad">
          <div className="shell text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted">Generating your report...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const domainLabels: Record<string, string> = {
    MR: 'Metabolic Resistance',
    HS: 'Hunger & Satiety',
    SR: 'Sleep Recovery',
    CH: 'Circadian Health',
    SL: 'Stress Load',
    IB: 'Inflammation',
    BS: 'Biological Safety'
  }

  return (
    <>
      <Header />

      <main className="section-pad">
        <div className="shell max-w-6xl">
          <div className="mb-8">
            <Link href="/" className="text-accent hover:underline mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="mb-2">Your Biological Intelligence Report</h1>
            <p className="text-muted">
              Based on your responses across 7 health domains
            </p>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="text-sm text-muted mb-2">Biological State</div>
              <div className="text-[54px] font-[850] leading-none tracking-[-0.05em]">
                {results.biological_state !== null ? results.biological_state : 'N/A'}
              </div>
              <div className="text-sm text-muted mt-1">
                {results.biological_state !== null ? getClassification(results.biological_state, 'DOMAIN') : 'Insufficient Data'}
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-muted mb-2">Opportunity</div>
              <div className="text-[54px] font-[850] leading-none tracking-[-0.05em]">
                {results.opportunity}
              </div>
              <div className="text-sm text-muted mt-1">Potential for improvement</div>
            </div>

            <div className="card">
              <div className="text-sm text-muted mb-2">Recovery Potential</div>
              <div className="text-[54px] font-[850] leading-none tracking-[-0.05em]">
                {results.recovery_potential}
              </div>
              <div className="text-sm text-muted mt-1">Overall outlook</div>
            </div>

            <div className="card">
              <div className="text-sm text-muted mb-2">Confidence</div>
              <div className="text-[54px] font-[850] leading-none tracking-[-0.05em]">
                {results.confidence}
              </div>
              <div className="text-sm text-muted mt-1">
                {getClassification(results.confidence, 'CONFIDENCE')}
              </div>
            </div>
          </div>

          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-6">Domain Scores</h2>
            <div className="space-y-4">
              {Object.entries(results.domains).map(([domain, score]) => (
                <div key={domain}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{domainLabels[domain] || domain}</span>
                    <span className="text-sm text-muted">
                      {score as number} - {getClassification(score as number, 'DOMAIN')}
                    </span>
                  </div>
                  <div className="h-2 mt-1 overflow-hidden rounded-full bg-[#e5e7e9]">
                    <div
                      className={`h-3 rounded-full ${
                        (score as number) >= 75 ? 'bg-danger' :
                        (score as number) >= 50 ? 'bg-orange-500' :
                        (score as number) >= 25 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${score as number}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {results.drivers.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-2xl font-bold mb-4">Primary Drivers</h2>
              <div className="space-y-2">
                {results.drivers.map((driver: string, idx: number) => (
                  <div key={idx} className="flex items-center p-3 bg-soft rounded-lg">
                    <div className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center mr-3 font-bold">
                      {idx + 1}
                    </div>
                    <span className="font-medium">{driver}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4">Protective Factors</h2>
            <div className="text-[54px] font-[850] leading-none tracking-[-0.05em] text-green-600 mb-2">
              {results.protective_count} / 5
            </div>
            <p className="text-muted">
              You have {results.protective_count} protective factors working in your favor.
            </p>
          </div>

          <div className="card mb-8 bg-yellow-50 border-yellow-200">
            <h3 className="font-bold text-yellow-800 mb-2">Important Disclaimer</h3>
            <p className="text-yellow-700 text-sm">
              This assessment is for informational purposes only and does not constitute medical advice. Please consult with a qualified healthcare professional for any health concerns.
            </p>
          </div>

          <div className="flex gap-4">
            <Link
              href="/assessment"
              className="button"
            >
              Retake Assessment
            </Link>
            <button
              onClick={() => window.print()}
              className="button secondary"
            >
              Print Report
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

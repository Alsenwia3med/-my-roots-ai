/**
 * ROOTS-AI Scoring Engine
 *
 * Deterministic seven-domain scoring based on C-02 v1.0.1 CORRECTED
 * Pure function - no I/O, no external state, no randomness
 */

import ruleset from './c02-ruleset.json'

export interface DomainScore {
  domain: string
  score: number | null
  coverage: number
}

export interface ScoringResult {
  domains: Record<string, number | null>
  coverage: Record<string, number>
  biological_state: number | null
  opportunity: number
  recovery_potential: number
  protective_count: number
  confidence: number
  drivers: string[]
  calculation_trace: any
}

export interface NormalizedInput {
  age: number
  diseaseCount: number
  medicationCount: number
  P1: boolean
  P2: boolean
  P3: boolean
  P4: boolean
  P5: boolean
  answerConfidence: number
  [key: string]: number | boolean
}

/**
 * Calculate domain score from normalized burden points
 * Formula: ROUND(SUM(answer_points) / SUM(max_points) * 100)
 */
function calculateDomainScore(
  domainPoints: Record<string, number>,
  maxPoints: Record<string, number>
): number | null {
  const totalPoints = Object.values(domainPoints).reduce((sum, val) => sum + val, 0)
  const totalMax = Object.values(maxPoints).reduce((sum, val) => sum + val, 0)

  if (totalMax === 0) return null

  const rawScore = (totalPoints / totalMax) * 100
  return Math.round(rawScore)
}

/**
 * Calculate coverage (proportion of scoring items answered)
 * Coverage threshold: 50% - below threshold returns null
 */
function calculateCoverage(
  answeredItems: number,
  totalItems: number
): number {
  if (totalItems === 0) return 0
  return answeredItems / totalItems
}

/**
 * Calculate Biological State
 * Requires at least 5 of 7 domains with valid scores
 * Formula: Average of all domain scores
 */
function calculateBiologicalState(
  domainScores: Record<string, number | null>
): number | null {
  const validScores = Object.values(domainScores).filter(
    (score): score is number => score !== null
  )

  // Require at least 5 of 7 domains
  if (validScores.length < 5) return null

  const sum = validScores.reduce((total, score) => total + score, 0)
  return Math.round(sum / validScores.length)
}

/**
 * Calculate Opportunity Score
 * Formula: 100 - Biological State
 */
function calculateOpportunity(biologicalState: number | null): number {
  if (biologicalState === null) return 0
  return 100 - biologicalState
}

/**
 * Calculate Recovery Potential
 * Based on Opportunity, protective factors, and age
 * Returns value to one decimal place
 */
function calculateRecoveryPotential(
  opportunity: number,
  protectiveCount: number,
  age: number
): number {
  // Base from opportunity
  let recovery = opportunity

  // Protective factor bonus (each protective factor adds ~6%)
  recovery += protectiveCount * 6

  // Age adjustment (optimal around 40)
  if (age < 30) {
    recovery += 5
  } else if (age > 50) {
    recovery -= 5
  }

  // Clamp to 0-100
  recovery = Math.max(0, Math.min(100, recovery))

  // Round to one decimal
  return Math.round(recovery * 10) / 10
}

/**
 * Calculate Confidence Score
 * Based on answer completeness and consistency
 */
function calculateConfidence(
  answerConfidence: number,
  coverageAvg: number
): number {
  // Weighted average of answer confidence and coverage
  const confidence = (answerConfidence * 0.7) + (coverageAvg * 100 * 0.3)
  return Math.round(confidence)
}

/**
 * Determine Drivers
 * Rules:
 * - Only domains with score >= 25 are eligible
 * - Rank by score descending
 * - Ties broken by fixed order: MR -> HS -> SR -> CH -> SL -> IB -> BS
 * - If top two differ by <= 3, report as co-primary
 * - No eligible domain -> no driver
 */
function determineDrivers(
  domainScores: Record<string, number>
): string[] {
  const eligibleDomains = Object.entries(domainScores)
    .filter(([_, score]) => score >= 25)
    .map(([domain, score]) => ({ domain, score }))

  if (eligibleDomains.length === 0) return []

  // Sort by score descending
  eligibleDomains.sort((a, b) => b.score - a.score)

  // Fixed tie-breaking order
  const tieOrder = ['MR', 'HS', 'SR', 'CH', 'SL', 'IB', 'BS']
  eligibleDomains.sort((a, b) => {
    if (a.score !== b.score) return 0
    return tieOrder.indexOf(a.domain) - tieOrder.indexOf(b.domain)
  })

  const drivers: string[] = []

  if (eligibleDomains.length === 1) {
    drivers.push(eligibleDomains[0].domain)
  } else {
    const top = eligibleDomains[0]
    const second = eligibleDomains[1]

    // Check for co-primary (difference <= 3)
    if (top.score - second.score <= 3) {
      drivers.push(`${top.domain}+${second.domain} co-primary`)
      // Add next distinct domain if exists
      if (eligibleDomains.length > 2) {
        const third = eligibleDomains[2]
        if (third.score < second.score) {
          drivers.push(third.domain)
        }
      }
    } else {
      drivers.push(top.domain)
    }
  }

  return drivers
}

/**
 * Main scoring function
 * Takes normalized input and returns deterministic scoring result
 */
export function calculateScores(input: NormalizedInput): ScoringResult {
  const trace: any = {
    input: { ...input },
    steps: []
  }

  // Domain calculations
  const domainScores: Record<string, number> = {}
  const coverage: Record<string, number> = {}

  // Map questions to domains based on C-02 mapping
  const domainMapping: Record<string, string[]> = {
    MR: ['Q9', 'Q10', 'Q11', 'Q12', 'Q46', 'Q47', 'Q48'],
    HS: ['Q16', 'Q17', 'Q18', 'Q19', 'Q20', 'Q21', 'Q22'],
    SR: ['Q23', 'Q24', 'Q25', 'Q26', 'Q27', 'Q28', 'Q29'],
    CH: ['Q30', 'Q31', 'Q32', 'Q33', 'Q34', 'Q35', 'Q36'],
    SL: ['Q37', 'Q38', 'Q39', 'Q40', 'Q41', 'Q42', 'Q43'],
    IB: ['Q44', 'Q45', 'Q49', 'Q50', 'Q51'],
    BS: [] // Biological Safety Signals - contextual only
  }

  // Calculate each domain
  for (const [domain, questions] of Object.entries(domainMapping)) {
    const domainPoints: Record<string, number> = {}
    const maxPoints: Record<string, number> = {}

    let answeredCount = 0
    const totalQuestions = questions.length

    for (const q of questions) {
      const value = input[q] as number | undefined
      if (value !== undefined && value !== null) {
        domainPoints[q] = value
        maxPoints[q] = 4 // Max burden per question
        answeredCount++
      }
    }

    const score = calculateDomainScore(domainPoints, maxPoints)
    const cov = calculateCoverage(answeredCount, totalQuestions)

    // Apply 50% coverage threshold
    domainScores[domain] = cov >= 0.5 ? (score ?? 0) : 0
    coverage[domain] = cov

    trace.steps.push({
      domain,
      points: domainPoints,
      maxPoints,
      score,
      coverage: cov,
      finalScore: domainScores[domain]
    })
  }

  // Biological State
  const biologicalState = calculateBiologicalState(domainScores)
  trace.steps.push({
    step: 'biological_state',
    domainScores,
    result: biologicalState
  })

  // Opportunity
  const opportunity = calculateOpportunity(biologicalState)
  trace.steps.push({
    step: 'opportunity',
    biologicalState,
    result: opportunity
  })

  // Protective factors
  const protectiveCount = [input.P1, input.P2, input.P3, input.P4, input.P5]
    .filter(Boolean).length
  trace.steps.push({
    step: 'protective_factors',
    count: protectiveCount
  })

  // Recovery Potential
  const recoveryPotential = calculateRecoveryPotential(
    opportunity,
    protectiveCount,
    input.age
  )
  trace.steps.push({
    step: 'recovery_potential',
    opportunity,
    protectiveCount,
    age: input.age,
    result: recoveryPotential
  })

  // Confidence
  const avgCoverage = Object.values(coverage).reduce((a, b) => a + b, 0) / Object.keys(coverage).length
  const confidence = calculateConfidence(input.answerConfidence, avgCoverage)
  trace.steps.push({
    step: 'confidence',
    answerConfidence: input.answerConfidence,
    avgCoverage,
    result: confidence
  })

  // Drivers
  const drivers = determineDrivers(domainScores)
  trace.steps.push({
    step: 'drivers',
    domainScores,
    result: drivers
  })

  return {
    domains: domainScores,
    coverage,
    biological_state: biologicalState,
    opportunity,
    recovery_potential: recoveryPotential,
    protective_count: protectiveCount,
    confidence,
    drivers,
    calculation_trace: trace
  }
}

/**
 * Get classification label for a score
 */
export function getClassification(
  score: number,
  scale: 'DOMAIN' | 'CONFIDENCE' | 'RECOVERY'
): string {
  const classifications = ruleset.classifications
    .filter((c: any) => c.scale === scale)

  for (const c of classifications) {
    if (score >= c.minimum && score <= c.maximum) {
      return c.label
    }
  }

  return 'Unknown'
}

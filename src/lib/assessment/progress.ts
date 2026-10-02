/**
 * ROOTS-AI Progress Tracking
 *
 * Computes assessment progress from saved answers
 * Progress is computed on the server, never from client values
 */

import questionBank from './c01-question-bank.json'

export interface ModuleProgress {
  module_id: string
  module_order: number
  state: 'not_started' | 'needs_attention' | 'complete'
  required_answered: number
  required_total: number
  percent: number
}

export interface OverallProgress {
  percent: number
  modules: ModuleProgress[]
  resume_module: string | null
}

/**
 * Calculate progress for a single module
 */
function calculateModuleProgress(
  moduleId: string,
  answers: Record<string, any>
): ModuleProgress {
  const moduleQuestions = questionBank.questions.filter(
    (q: any) => q.module_id === moduleId && q.required === true
  )

  const requiredTotal = moduleQuestions.length
  let requiredAnswered = 0

  for (const question of moduleQuestions) {
    const value = answers[question.question_id]
    const allowNa = question.allow_na === true

    if (value !== null && value !== undefined && value !== '') {
      requiredAnswered++
    } else if (allowNa && value === 'N/A') {
      requiredAnswered++
    }
  }

  const percent = requiredTotal > 0 ? (requiredAnswered / requiredTotal) * 100 : 0

  let state: 'not_started' | 'needs_attention' | 'complete' = 'not_started'
  if (percent === 100) {
    state = 'complete'
  } else if (percent > 0) {
    state = 'needs_attention'
  }

  return {
    module_id: moduleId,
    module_order: moduleQuestions[0]?.module_order || 0,
    state,
    required_answered: requiredAnswered,
    required_total: requiredTotal,
    percent
  }
}

/**
 * Calculate overall assessment progress
 */
export function calculateProgress(answers: Record<string, any>): OverallProgress {
  const modules = questionBank.modules.map((module: any) => {
    return calculateModuleProgress(module.module_id, answers)
  })

  // Calculate overall percent (based on required questions only)
  const totalRequired = questionBank.questions.filter((q: any) => q.required === true).length
  let totalAnswered = 0

  for (const question of questionBank.questions) {
    if (question.required === true) {
      const value = answers[question.question_id]
      const allowNa = question.allow_na === true

      if (value !== null && value !== undefined && value !== '') {
        totalAnswered++
      } else if (allowNa && value === 'N/A') {
        totalAnswered++
      }
    }
  }

  const percent = totalRequired > 0 ? (totalAnswered / totalRequired) * 100 : 0

  // Find resume point (first module with unanswered required question)
  const resumeModule = modules
    .filter(m => m.state !== 'complete')
    .sort((a, b) => a.module_order - b.module_order)[0]?.module_id || null

  return {
    percent,
    modules,
    resume_module: resumeModule
  }
}

/**
 * Get module state for display
 */
export function getModuleStateLabel(state: string): string {
  switch (state) {
    case 'not_started':
      return 'Not Started'
    case 'needs_attention':
      return 'In Progress'
    case 'complete':
      return 'Complete'
    default:
      return 'Unknown'
  }
}

/**
 * Check if assessment can be submitted
 */
export function canSubmit(answers: Record<string, any>): boolean {
  const progress = calculateProgress(answers)
  return progress.percent === 100
}

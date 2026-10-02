/**
 * ROOTS-AI Validation System
 *
 * Server-authoritative validation based on C-01 v1.0.1 CORRECTED
 * The browser runs the same functions for immediate feedback
 */

import questionBank from './c01-question-bank.json'

export interface ValidationError {
  question_id: string
  error: string
  severity: 'Block' | 'Warning' | 'Safety'
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  canProceed: boolean
}

/**
 * Validate a single answer against C-01 rules
 */
export function validateAnswer(
  questionId: string,
  value: any,
  allowNa: boolean = false
): ValidationError | null {
  const question = questionBank.questions.find((q: any) => q.question_id === questionId)
  if (!question) {
    return { question_id: questionId, error: 'Unknown question', severity: 'Block' }
  }

  const validationRule = questionBank.validation_rules.find(
    (r: any) => r.applies_to === questionId || r.applies_to === question.question_type
  )

  // Check required questions
  if (question.required && !allowNa && (value === null || value === undefined || value === '')) {
    return {
      question_id: questionId,
      error: 'This question is required',
      severity: 'Block'
    }
  }

  // Type-specific validation
  switch (question.question_type) {
    case 'integer':
      if (value !== null && value !== undefined && value !== '') {
        const num = Number(value)
        if (isNaN(num)) {
          return {
            question_id: questionId,
            error: 'Please enter a valid number',
            severity: 'Block'
          }
        }
        // Q1: Age 16-110
        if (questionId === 'Q1' && (num < 16 || num > 110)) {
          return {
            question_id: questionId,
            error: 'Enter an age between 16 and 110',
            severity: 'Block'
          }
        }
        // Q69/Q70: 0-10
        if ((questionId === 'Q69' || questionId === 'Q70') && (num < 0 || num > 10)) {
          return {
            question_id: questionId,
            error: 'Select a number from 0 to 10',
            severity: 'Block'
          }
        }
      }
      break

    case 'decimal':
      if (value !== null && value !== undefined && value !== '') {
        const num = Number(value)
        if (isNaN(num)) {
          return {
            question_id: questionId,
            error: 'Please enter a valid number',
            severity: 'Block'
          }
        }
        // Q3: Height 100-250 cm
        if (questionId === 'Q3' && (num < 100 || num > 250)) {
          return {
            question_id: questionId,
            error: 'Enter a height between 100 and 250 cm',
            severity: 'Block'
          }
        }
        // Q4/Q5: Weight 25-350 kg
        if ((questionId === 'Q4' || questionId === 'Q5') && (num < 25 || num > 350)) {
          return {
            question_id: questionId,
            error: 'Enter a weight between 25 and 350 kg',
            severity: 'Block'
          }
        }
      }
      break

    case 'single_select':
      if (value !== null && value !== undefined && value !== '') {
        const optionSet = question.option_set_id ? (questionBank.option_sets as any)[question.option_set_id] : null
        if (optionSet) {
          const validOption = optionSet.find((o: any) => o.option_id === value)
          if (!validOption) {
            return {
              question_id: questionId,
              error: 'Select one of the available answers',
              severity: 'Block'
            }
          }
        }
      }
      break

    case 'multi_select':
      if (value !== null && value !== undefined && value !== '') {
        if (!Array.isArray(value)) {
          return {
            question_id: questionId,
            error: 'Please select one or more options',
            severity: 'Block'
          }
        }
        if (value.length === 0) {
          return {
            question_id: questionId,
            error: 'Choose at least one valid option',
            severity: 'Block'
          }
        }
        // Check NONE/NA exclusivity
        const hasNone = value.includes('NONE') || value.includes('N/A')
        const hasOther = value.some((v: any) => v !== 'NONE' && v !== 'N/A')
        if (hasNone && hasOther) {
          return {
            question_id: questionId,
            error: 'None/Not applicable cannot be combined with other options',
            severity: 'Block'
          }
        }
        // Validate each option
        const optionSet = question.option_set_id ? (questionBank.option_sets as any)[question.option_set_id] : null
        if (optionSet) {
          for (const v of value) {
            const validOption = optionSet.find((o: any) => o.option_id === v)
            if (!validOption && v !== 'NONE' && v !== 'N/A') {
              return {
                question_id: questionId,
                error: 'Invalid option selected',
                severity: 'Block'
              }
            }
          }
        }
      }
      break

    case 'likert':
      if (value !== null && value !== undefined && value !== '') {
        const num = Number(value)
        if (isNaN(num) || num < 0 || num > 4) {
          return {
            question_id: questionId,
            error: 'Select one of the available answers',
            severity: 'Block'
          }
        }
      }
      break

    case 'decimal_with_unit':
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object' && value.value !== undefined) {
          const num = Number(value.value)
          if (isNaN(num)) {
            return {
              question_id: questionId,
              error: 'Please enter a valid number',
              severity: 'Block'
            }
          }
          // Q6: Waist 40-200 cm after conversion
          if (questionId === 'Q6') {
            const converted = value.unit === 'in' ? num * 2.54 : num
            if (converted < 40 || converted > 200) {
              return {
                question_id: questionId,
                error: 'Please verify the waist measurement',
                severity: 'Block'
              }
            }
          }
        }
      }
      break

    case 'text':
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value !== 'string') {
          return {
            question_id: questionId,
            error: 'Please enter text',
            severity: 'Block'
          }
        }
        // Q73: 0-1000 characters
        if (questionId === 'Q73' && value.length > 1000) {
          return {
            question_id: questionId,
            error: 'Keep the response within 1,000 characters',
            severity: 'Block'
          }
        }
      }
      break
  }

  return null
}

/**
 * Validate all answers for submission
 */
export function validateSubmission(answers: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = []

  for (const question of questionBank.questions) {
    const qId = question.question_id
    const value = answers[qId]
    const allowNa = question.allow_na === true

    const error = validateAnswer(qId, value, allowNa)
    if (error) {
      errors.push(error)
    }
  }

  // Check age eligibility (launch defaults to 18+)
  const age = answers['Q1']
  if (age !== undefined && age !== null && age !== '') {
    const ageNum = Number(age)
    if (ageNum < 18) {
      errors.push({
        question_id: 'Q1',
        error: 'This version is currently available to adults aged 18 or older',
        severity: 'Block'
      })
    }
  }

  // Safety warning for Q73
  if (answers['Q73'] && typeof answers['Q73'] === 'string') {
    const lowerText = answers['Q73'].toLowerCase()
    const emergencyKeywords = ['suicide', 'kill', 'hurt', 'die', 'emergency']
    if (emergencyKeywords.some(kw => lowerText.includes(kw))) {
      errors.push({
        question_id: 'Q73',
        error: 'If you may be in immediate danger, contact local emergency services now',
        severity: 'Safety'
      })
    }
  }

  const blockErrors = errors.filter(e => e.severity === 'Block')
  const canProceed = blockErrors.length === 0

  return {
    valid: errors.length === 0,
    errors,
    canProceed
  }
}

/**
 * Check if a module can proceed to next
 * All required questions in module must be answered
 */
export function canProceedToNext(
  moduleId: string,
  answers: Record<string, any>
): boolean {
  const moduleQuestions = questionBank.questions.filter(
    (q: any) => q.module_id === moduleId && q.required === true
  )

  for (const question of moduleQuestions) {
    const value = answers[question.question_id]
    const allowNa = question.allow_na === true

    if (value === null || value === undefined || value === '') {
      if (!allowNa) {
        return false
      }
    }
  }

  return true
}

/**
 * Get validation error message for display
 */
export function getErrorMessage(error: ValidationError): string {
  return error.error
}

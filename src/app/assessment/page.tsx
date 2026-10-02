'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import questionBank from '@/lib/assessment/c01-question-bank.json'
import { validateAnswer, canProceedToNext } from '@/lib/assessment/validation'
import { calculateProgress, getModuleStateLabel } from '@/lib/assessment/progress'

export default function AssessmentPage() {
  const [currentModule, setCurrentModule] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState<any>(null)

  const modules = questionBank.modules
  const currentModuleData = modules[currentModule]
  const currentQuestions = questionBank.questions.filter(
    (q: any) => q.module_id === currentModuleData.module_id
  )

  useEffect(() => {
    const prog = calculateProgress(answers)
    setProgress(prog)
  }, [answers])

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))

    // Validate on change
    const error = validateAnswer(questionId, value, false)
    if (error) {
      setErrors(prev => ({ ...prev, [questionId]: error.error }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  const handleNext = () => {
    if (canProceedToNext(currentModuleData.module_id, answers)) {
      if (currentModule < modules.length - 1) {
        setCurrentModule(prev => prev + 1)
      }
    } else {
      // Show errors for incomplete required questions
      const moduleQuestions = currentQuestions.filter((q: any) => q.required === true)
      const newErrors: Record<string, string> = {}
      for (const q of moduleQuestions) {
        if (!answers[q.question_id] && !q.allow_na) {
          newErrors[q.question_id] = 'This question is required'
        }
      }
      setErrors(newErrors)
    }
  }

  const handlePrevious = () => {
    if (currentModule > 0) {
      setCurrentModule(prev => prev - 1)
    }
  }

  const renderQuestion = (question: any) => {
    const value = answers[question.question_id]
    const error = errors[question.question_id]

    return (
      <div key={question.question_id} className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="mb-2">
          <span className="text-sm font-medium text-indigo-600">
            {question.question_id}
          </span>
          {question.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
          {question.allow_na && (
            <span className="text-gray-400 ml-1">(Optional)</span>
          )}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {question.question_text}
        </h3>
        {question.help_text && (
          <p className="text-sm text-gray-600 mb-4">{question.help_text}</p>
        )}

        {renderInput(question, value)}

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    )
  }

  const renderInput = (question: any, value: any) => {
    const optionSet = question.option_set_id ? (questionBank.option_sets as any)[question.option_set_id] : null

    switch (question.question_type) {
      case 'integer':
      case 'decimal':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            step={question.question_type === 'decimal' ? '0.1' : '1'}
          />
        )

      case 'single_select':
        return (
          <div className="space-y-2">
            {optionSet?.map((opt: any) => (
              <label key={opt.option_id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={question.question_id}
                  value={opt.option_id}
                  checked={value === opt.option_id}
                  onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                  className="mr-3"
                />
                <span>{opt.option_text}</span>
              </label>
            ))}
          </div>
        )

      case 'multi_select':
        return (
          <div className="space-y-2">
            {optionSet?.map((opt: any) => (
              <label key={opt.option_id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt.option_id}
                  checked={Array.isArray(value) && value.includes(opt.option_id)}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? value : []
                    if (e.target.checked) {
                      handleAnswerChange(question.question_id, [...current, opt.option_id])
                    } else {
                      handleAnswerChange(question.question_id, current.filter((v: any) => v !== opt.option_id))
                    }
                  }}
                  className="mr-3"
                />
                <span>{opt.option_text}</span>
              </label>
            ))}
          </div>
        )

      case 'likert':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2, 3, 4].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleAnswerChange(question.question_id, val)}
                className={`flex-1 p-3 border rounded-lg ${
                  value === val ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-50'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        )

      case 'decimal_with_unit':
        return (
          <div className="flex space-x-2">
            <input
              type="number"
              value={value?.value || ''}
              onChange={(e) => handleAnswerChange(question.question_id, {
                ...value,
                value: e.target.value
              })}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              step="0.1"
            />
            <select
              value={value?.unit || 'cm'}
              onChange={(e) => handleAnswerChange(question.question_id, {
                ...value,
                unit: e.target.value
              })}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>
        )

      case 'text':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={4}
            maxLength={question.question_id === 'Q73' ? 1000 : undefined}
          />
        )

      default:
        return <div className="text-gray-500">Unknown question type</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentModuleData.module_title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Module {currentModule + 1} of {modules.length}</span>
              {progress && (
                <span>Overall Progress: {Math.round(progress.percent)}%</span>
              )}
            </div>
            {/* Progress bar */}
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${progress?.percent || 0}%` }}
              />
            </div>
          </div>

          {/* Module Progress */}
          {progress && (
            <div className="mb-6 grid grid-cols-13 gap-2">
              {progress.modules.map((mod: any, idx: number) => (
                <div
                  key={mod.module_id}
                  className={`h-2 rounded-full ${
                    mod.state === 'complete' ? 'bg-green-500' :
                    mod.state === 'needs_attention' ? 'bg-yellow-500' :
                    'bg-gray-300'
                  }`}
                  title={`${mod.module_id}: ${getModuleStateLabel(mod.state)}`}
                />
              ))}
            </div>
          )}

          {/* Questions */}
          <div className="space-y-4 mb-8">
            {currentQuestions.map(renderQuestion)}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentModule === 0}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentModule < modules.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Next
              </button>
            ) : (
              <Link
                href="/report"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Submit & View Results
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

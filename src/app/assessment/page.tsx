'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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
      <div key={question.question_id} className="card mb-6">
        <div className="mb-4">
          <span className="text-accent text-sm font-bold tracking-wider uppercase">
            {question.question_id}
          </span>
          {question.required && (
            <span className="text-danger ml-1">*</span>
          )}
          {question.allow_na && (
            <span className="text-muted ml-1">(Optional)</span>
          )}
        </div>
        <h3 className="text-xl font-bold mb-2">
          {question.question_text}
        </h3>
        {question.help_text && (
          <p className="text-muted text-sm mb-4">{question.help_text}</p>
        )}

        {renderInput(question, value)}

        {error && (
          <p className="text-danger text-sm mt-2">{error}</p>
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
            className="w-full p-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            step={question.question_type === 'decimal' ? '0.1' : '1'}
          />
        )

      case 'single_select':
        return (
          <div className="space-y-2">
            {optionSet?.map((opt: any) => (
              <label key={opt.option_id} className="flex items-center p-3 border border-line rounded-lg hover:bg-soft cursor-pointer">
                <input
                  type="radio"
                  name={question.question_id}
                  value={opt.option_id}
                  checked={value === opt.option_id}
                  onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                  className="mr-3"
                />
                <span>{opt.display_label || opt.option_id}</span>
              </label>
            ))}
          </div>
        )

      case 'multi_select':
        return (
          <div className="space-y-2">
            {optionSet?.map((opt: any) => (
              <label key={opt.option_id} className="flex items-center p-3 border border-line rounded-lg hover:bg-soft cursor-pointer">
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
                <span>{opt.display_label || opt.option_id}</span>
              </label>
            ))}
          </div>
        )

      case 'likert':
        return (
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleAnswerChange(question.question_id, val)}
                className={`flex-1 p-3 border border-line rounded-lg ${
                  value === val ? 'bg-accent text-white' : 'bg-white hover:bg-soft'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        )

      case 'decimal_with_unit':
        return (
          <div className="flex gap-2">
            <input
              type="number"
              value={value?.value || ''}
              onChange={(e) => handleAnswerChange(question.question_id, {
                ...value,
                value: e.target.value
              })}
              className="flex-1 p-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              step="0.1"
            />
            <select
              value={value?.unit || 'cm'}
              onChange={(e) => handleAnswerChange(question.question_id, {
                ...value,
                unit: e.target.value
              })}
              className="p-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
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
            className="w-full p-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            rows={4}
            maxLength={question.question_id === 'Q73' ? 1000 : undefined}
          />
        )

      default:
        return <div className="text-muted">Unknown question type</div>
    }
  }

  return (
    <>
      <Header />

      <main className="section-pad">
        <div className="shell max-w-4xl">
          <div className="mb-8">
            <Link href="/" className="text-accent hover:underline mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="mb-2">{currentModuleData.module_title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted">
              <span>Module {currentModule + 1} of {modules.length}</span>
              {progress && (
                <span>Overall Progress: {Math.round(progress.percent)}%</span>
              )}
            </div>
            <div className="mt-4 bg-line rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all"
                style={{ width: `${progress?.percent || 0}%` }}
              />
            </div>
          </div>

          {progress && (
            <div className="mb-6 grid grid-cols-13 gap-1">
              {progress.modules.map((mod: any, idx: number) => (
                <div
                  key={mod.module_id}
                  className={`h-2 rounded-full ${
                    mod.state === 'complete' ? 'bg-green-500' :
                    mod.state === 'needs_attention' ? 'bg-yellow-500' :
                    'bg-line'
                  }`}
                  title={`${mod.module_id}: ${getModuleStateLabel(mod.state)}`}
                />
              ))}
            </div>
          )}

          <div className="space-y-4 mb-8">
            {currentQuestions.map(renderQuestion)}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentModule === 0}
              className="px-6 py-3 bg-soft text-ink rounded-lg hover:bg-line disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentModule < modules.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90"
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
      </main>

      <Footer />
    </>
  )
}

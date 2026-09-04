'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { type QuizTheme } from '@/app/lib/quizTheme'

export type { QuizTheme }
export type QuestionType = 'choice' | 'rating' | 'text'

export interface Question {
  id: string
  type: QuestionType
  text: string
  options?: string[]
  maxRating?: number
  optional?: boolean
  placeholder?: string
}

interface QuestionnaireProps {
  title: string
  description?: string
  questions: Question[]
  onSubmit: (answers: Record<string, string | number>) => Promise<void>
  accentColor?: 'fuchsia' | 'emerald' | 'indigo' | 'rose' | 'amber' | 'cyan' | 'orange' | 'blue' | 'sky'
  theme?: QuizTheme
  captureLead?: {
    title: string
    body: string
    cta: string
    onSubmit: (info: { email: string; phone: string }) => Promise<void>
  }
}

export function Questionnaire({ title, description, questions, onSubmit, accentColor = 'indigo', theme = 'dark', captureLead }: QuestionnaireProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadStatus, setLeadStatus] = useState<'idle' | 'saving' | 'saved' | 'skipped'>('idle')
  const [ratingPick, setRatingPick] = useState<number | null>(null)
  const [choicePick, setChoicePick] = useState<string | null>(null)
  const keyboardInset = useKeyboardInset()

  const currentQ = questions[currentIndex]
  const progress = (currentIndex / questions.length) * 100

  const colorMap = {
    fuchsia: 'bg-fuchsia-500',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    cyan: 'bg-cyan-500',
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    sky: 'bg-sky-500',
  }
  const bgClass = colorMap[accentColor]
  const isDark = theme === 'dark'

  const shellClasses = isDark ? 'bg-slate-950' : 'bg-slate-50'
  const progressBgClasses = isDark ? 'bg-slate-800' : 'bg-slate-200'
  const titleClasses = isDark ? 'text-white' : 'text-slate-900'
  const descClasses = isDark ? 'text-slate-400' : 'text-slate-500'
  const footerClasses = isDark
    ? 'bg-slate-900 border-t border-slate-800'
    : 'bg-white border-t border-slate-200'
  const choiceBtnClasses = isDark
    ? 'bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-700 text-slate-200'
    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
  const textAreaClasses = isDark
    ? 'bg-slate-900 border border-slate-800 text-white placeholder:text-slate-600 focus:border-slate-600'
    : 'bg-white border border-slate-200 text-slate-700 focus:border-slate-400'
  const inputClasses = isDark
    ? 'w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600'
    : 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-slate-400'

  const handleAnswer = async (value: string | number) => {
    const newAnswers = { ...answers, [currentQ.id]: value }
    setAnswers(newAnswers)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setTextInput('')
      setRatingPick(null)
      setChoicePick(null)
    } else {
      setIsSubmitting(true)
      await onSubmit(newAnswers)
      setIsSubmitting(false)
      setIsDone(true)
    }
  }

  const handleLeadSubmit = async () => {
    if (!captureLead || (!leadEmail.trim() && !leadPhone.trim())) return
    setLeadStatus('saving')
    await captureLead.onSubmit({ email: leadEmail.trim(), phone: leadPhone.trim() })
    setLeadStatus('saved')
  }

  const canContinueText = Boolean(textInput.trim()) || Boolean(currentQ?.optional)

  const submitText = () => {
    if (!canContinueText || isSubmitting) return
    void handleAnswer(textInput)
  }

  const footer = (content: ReactNode) => (
    <div className={`flex-none p-6 ${footerClasses} z-10 pb-safe`}>
      {content}
    </div>
  )

  if (isDone) {
    const showLeadForm = captureLead && leadStatus !== 'saved' && leadStatus !== 'skipped'

    return (
      <div className={`flex flex-col h-full min-h-0 ${shellClasses}`} style={{ paddingBottom: keyboardInset }}>
        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
          <div className="p-6 md:p-10 text-center animate-fade-in-up">
            <div className={`w-16 h-16 ${bgClass} text-white rounded-full flex items-center justify-center mb-6 shadow-lg mx-auto`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className={`text-2xl font-black mb-2 ${titleClasses}`}>Thank you!</h2>
            <p className={descClasses}>Your answers were submitted. I really appreciate your time.</p>

            {showLeadForm && (
              <div className="mt-8 text-left space-y-3">
                <h3 className={`text-lg font-black ${titleClasses}`}>{captureLead.title}</h3>
                <p className={`text-sm leading-relaxed ${descClasses}`}>{captureLead.body}</p>
                <input
                  type="email"
                  value={leadEmail}
                  onChange={e => setLeadEmail(e.target.value)}
                  placeholder="Email"
                  enterKeyHint="done"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleLeadSubmit()
                    }
                  }}
                  className={inputClasses}
                />
                <input
                  type="tel"
                  value={leadPhone}
                  onChange={e => setLeadPhone(e.target.value)}
                  placeholder="Cell (optional if you left email)"
                  enterKeyHint="done"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleLeadSubmit()
                    }
                  }}
                  className={inputClasses}
                />
              </div>
            )}

            {leadStatus === 'saved' && (
              <p className={`mt-6 text-sm font-bold ${titleClasses}`}>You&apos;re on the list. I&apos;ll send the monthly snapshot — nothing salesy.</p>
            )}
          </div>
        </div>

        {showLeadForm && footer(
          <div className="space-y-2">
            <button
              onClick={handleLeadSubmit}
              disabled={leadStatus === 'saving' || (!leadEmail.trim() && !leadPhone.trim())}
              className={`w-full py-4 rounded-xl font-black text-white transition-all ${!leadEmail.trim() && !leadPhone.trim() ? (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400') : bgClass}`}
            >
              {leadStatus === 'saving' ? 'Saving...' : captureLead.cta}
            </button>
            <button
              onClick={() => setLeadStatus('skipped')}
              className={`w-full text-sm font-bold ${descClasses} hover:underline py-2`}
            >
              No thanks
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full min-h-0 ${shellClasses}`} style={{ paddingBottom: keyboardInset }}>
      <div className={`flex-none h-1.5 w-full relative ${progressBgClasses}`}>
        <div className={`absolute top-0 left-0 h-full ${bgClass} transition-all duration-500 ease-out`} style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        <div className="p-6 md:p-10 min-h-full flex flex-col">
          {currentIndex === 0 && description && (
            <p className={`text-xs font-bold tracking-widest uppercase mb-4 ${descClasses}`}>{title}</p>
          )}
          <h2 className={`text-2xl md:text-3xl font-black leading-tight ${titleClasses}`}>
            {currentQ.text}
          </h2>
          {currentIndex === 0 && description && (
            <p className={`mt-4 leading-relaxed ${descClasses}`}>{description}</p>
          )}

          {currentQ.type === 'rating' && (
            <div className="flex-1 flex items-center justify-center py-8">
              <StarPicker
                max={currentQ.maxRating || 5}
                value={ratingPick}
                onChange={setRatingPick}
                disabled={isSubmitting}
              />
            </div>
          )}

          {currentQ.type === 'choice' && (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="w-full space-y-3">
                {currentQ.options?.map((opt, i) => {
                  const selected = choicePick === opt
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setChoicePick(opt)}
                      disabled={isSubmitting}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all font-bold active:scale-[0.98] ${
                        selected
                          ? `${bgClass} border-transparent text-white`
                          : choiceBtnClasses
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {currentQ.type === 'text' && (
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder={currentQ.placeholder || 'Type your answer here...'}
              rows={4}
              className={`w-full rounded-xl p-4 mt-8 focus:outline-none resize-none ${textAreaClasses}`}
            ></textarea>
          )}
        </div>
      </div>

      {currentQ.type === 'choice' && footer(
        <button
          type="button"
          onClick={() => choicePick !== null && handleAnswer(choicePick)}
          disabled={choicePick === null || isSubmitting}
          className={`w-full py-4 rounded-xl font-black text-white transition-all active:scale-95 ${choicePick === null ? (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400') : bgClass} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Submitting...' : 'Continue'}
        </button>
      )}

      {currentQ.type === 'rating' && footer(
        <button
          type="button"
          onClick={() => ratingPick !== null && handleAnswer(ratingPick)}
          disabled={ratingPick === null || isSubmitting}
          className={`w-full py-4 rounded-xl font-black text-white transition-all active:scale-95 ${ratingPick === null ? (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400') : bgClass} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Submitting...' : 'Next'}
        </button>
      )}

      {currentQ.type === 'text' && footer(
        <button
          onClick={submitText}
          disabled={!canContinueText || isSubmitting}
          className={`w-full py-4 rounded-xl font-black text-white transition-all active:scale-95 ${!canContinueText ? (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400') : bgClass} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Submitting...' : 'Continue'}
        </button>
      )}
    </div>
  )
}

function useKeyboardInset() {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const update = () => {
      const covered = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      setInset(covered)
    }

    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    window.addEventListener('focusin', update)
    window.addEventListener('focusout', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      window.removeEventListener('focusin', update)
      window.removeEventListener('focusout', update)
    }
  }, [])

  return inset
}

const STAR_PATH = 'M12 2.4l2.85 6.42 7.03.66-5.31 4.64 1.56 6.88L12 17.86l-6.13 3.14 1.56-6.88-5.31-4.64 7.03-.66L12 2.4z'

function StarPicker({
  max,
  value,
  onChange,
  disabled,
}: {
  max: number
  value: number | null
  onChange: (n: number) => void
  disabled?: boolean
}) {
  const compact = max > 5
  const sizeClass = compact
    ? 'w-10 h-10'
    : 'w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] md:w-20 md:h-20'

  return (
    <div className={`flex items-center justify-center ${compact ? 'flex-wrap gap-1' : 'gap-1 sm:gap-2'}`}>
      {Array.from({ length: max }).map((_, i) => {
        const n = i + 1
        const filled = value !== null && n <= value
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            disabled={disabled}
            aria-label={`Rate ${n} out of ${max}`}
            aria-pressed={filled}
            className={`relative ${sizeClass} shrink-0 rounded-xl transition-transform active:scale-90 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg viewBox="-1 -1 26 26" className="absolute inset-0 w-full h-full text-amber-400" aria-hidden="true">
              <path
                d={STAR_PATH}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
            <svg
              viewBox="-1 -1 26 26"
              className={`absolute inset-0 w-full h-full text-amber-400 origin-center transition-all duration-300 ease-out ${filled ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
              style={{ transitionDelay: filled ? `${i * 50}ms` : '0ms' }}
              aria-hidden="true"
            >
              <path d={STAR_PATH} fill="currentColor" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

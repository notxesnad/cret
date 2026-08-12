'use client'

import { useState } from 'react'

export type QuestionType = 'choice' | 'rating' | 'text'

export interface Question {
  id: string
  type: QuestionType
  text: string
  options?: string[]
  maxRating?: number
}

interface QuestionnaireProps {
  title: string
  description?: string
  questions: Question[]
  onSubmit: (answers: Record<string, any>) => Promise<void>
  accentColor?: 'fuchsia' | 'emerald' | 'indigo' | 'rose' | 'amber' | 'cyan' | 'orange' | 'blue' | 'sky'
}

export function Questionnaire({ title, description, questions, onSubmit, accentColor = 'indigo' }: QuestionnaireProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [textInput, setTextInput] = useState('')

  const currentQ = questions[currentIndex]
  const progress = ((currentIndex) / questions.length) * 100

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

  const handleAnswer = async (value: any) => {
    const newAnswers = { ...answers, [currentQ.id]: value }
    setAnswers(newAnswers)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setTextInput('')
    } else {
      setIsSubmitting(true)
      await onSubmit(newAnswers)
      setIsSubmitting(false)
      setIsDone(true)
    }
  }

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 animate-fade-in-up h-full min-h-[300px] bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className={`w-16 h-16 ${bgClass} text-white rounded-full flex items-center justify-center mb-6 shadow-lg`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Thank you!</h2>
        <p className="text-slate-500">Your feedback has been submitted successfully. I really appreciate your time!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[75vh] min-h-[500px] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full max-w-xl mx-auto">
      {/* Progress Bar */}
      <div className="h-1.5 bg-slate-100 w-full relative">
        <div className={`absolute top-0 left-0 h-full ${bgClass} transition-all duration-500 ease-out`} style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto">
        <div className="mb-8">
          {currentIndex === 0 && description && (
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-4">{title}</p>
          )}
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
            {currentQ.text}
          </h2>
          {currentIndex === 0 && description && (
            <p className="text-slate-500 mt-4 leading-relaxed">{description}</p>
          )}
        </div>

        <div className="mt-auto space-y-3 pb-4">
          {currentQ.type === 'choice' && currentQ.options?.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={isSubmitting}
              className={`w-full text-left p-4 rounded-xl border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all font-bold text-slate-700 active:scale-[0.98] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {opt}
            </button>
          ))}

          {currentQ.type === 'rating' && (
            <div className="flex justify-between gap-2">
              {Array.from({ length: currentQ.maxRating || 5 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i + 1)}
                  disabled={isSubmitting}
                  className={`flex-1 aspect-square rounded-xl border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all font-black text-xl text-slate-700 active:scale-95 flex items-center justify-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {currentQ.type === 'text' && (
            <div className="flex flex-col gap-3">
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 focus:outline-none focus:border-slate-400 resize-none"
              ></textarea>
              <button
                onClick={() => handleAnswer(textInput)}
                disabled={!textInput.trim() || isSubmitting}
                className={`w-full p-4 rounded-xl font-black text-white transition-all active:scale-95 ${!textInput.trim() ? 'bg-slate-300' : bgClass} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Submitting...' : 'Continue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
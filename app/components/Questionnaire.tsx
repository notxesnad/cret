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
  theme?: 'light' | 'dark'
}

export function Questionnaire({ title, description, questions, onSubmit, accentColor = 'indigo', theme = 'light' }: QuestionnaireProps) {
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

  const isDark = theme === 'dark'

  const containerClasses = isDark 
    ? "bg-slate-900 border-slate-800" 
    : "bg-white border-slate-100"
  
  const progressBgClasses = isDark ? "bg-slate-800" : "bg-slate-100"
  
  const titleClasses = isDark ? "text-white" : "text-slate-900"
  const descClasses = isDark ? "text-slate-400" : "text-slate-500"

  const choiceBtnClasses = isDark
    ? "bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-700 text-slate-200"
    : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
  
  const textAreaClasses = isDark
    ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-slate-600"
    : "bg-slate-50 border-slate-200 text-slate-700 focus:border-slate-400"

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
      <div className={`flex flex-col items-center justify-center text-center p-8 animate-fade-in-up h-full min-h-[300px] rounded-3xl shadow-sm border ${containerClasses}`}>
        <div className={`w-16 h-16 ${bgClass} text-white rounded-full flex items-center justify-center mb-6 shadow-lg`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className={`text-2xl font-black mb-2 ${titleClasses}`}>Thank you!</h2>
        <p className={descClasses}>Your feedback has been submitted successfully. I really appreciate your time!</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-[75vh] min-h-[500px] rounded-3xl shadow-sm border overflow-hidden w-full max-w-xl mx-auto ${containerClasses}`}>
      {/* Progress Bar */}
      <div className={`h-1.5 w-full relative ${progressBgClasses}`}>
        <div className={`absolute top-0 left-0 h-full ${bgClass} transition-all duration-500 ease-out`} style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto">
        <div className="mb-8">
          {currentIndex === 0 && description && (
            <p className={`text-xs font-bold tracking-widest uppercase mb-4 ${descClasses}`}>{title}</p>
          )}
          <h2 className={`text-2xl md:text-3xl font-black leading-tight ${titleClasses}`}>
            {currentQ.text}
          </h2>
          {currentIndex === 0 && description && (
            <p className={`mt-4 leading-relaxed ${descClasses}`}>{description}</p>
          )}
        </div>

        <div className="mt-auto space-y-3 pb-4">
          {currentQ.type === 'choice' && currentQ.options?.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={isSubmitting}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all font-bold active:scale-[0.98] ${choiceBtnClasses} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  className={`flex-1 aspect-square rounded-xl border-2 transition-all font-black text-xl active:scale-95 flex items-center justify-center ${choiceBtnClasses} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                className={`w-full rounded-xl p-4 focus:outline-none resize-none ${textAreaClasses}`}
              ></textarea>
              <button
                onClick={() => handleAnswer(textInput)}
                disabled={!textInput.trim() || isSubmitting}
                className={`w-full p-4 rounded-xl font-black text-white transition-all active:scale-95 ${!textInput.trim() ? (isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-300 text-white') : bgClass} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
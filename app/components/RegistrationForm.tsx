'use client'

import { useState } from 'react'
import { Questionnaire, type Question } from '@/app/components/Questionnaire'
import { registrationQuestionsForForm } from '@/app/lib/openhouseRegistration'

export function RegistrationExperience({
  address,
  title,
  description,
  questions,
  qrDataUrl,
  onSubmit,
}: {
  address?: string
  title: string
  description?: string
  questions: Question[]
  qrDataUrl?: string
  onSubmit: (answers: Record<string, string | number>) => Promise<void>
}) {
  const [started, setStarted] = useState(false)
  const [quizKey, setQuizKey] = useState(0)
  const listing = address || title

  if (!started) {
    return (
      <div className="relative flex flex-col h-full min-h-0 bg-slate-50 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 w-64 h-64 bg-blue-900/20 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute bottom-24 -left-16 w-56 h-56 bg-slate-400/20 blur-3xl rounded-full" />

        <div className="relative flex-1 min-h-0 overflow-y-auto hide-scrollbar">
          <div className="min-h-full flex flex-col justify-center px-6 py-10 text-center">
            <p className="text-[11px] font-bold tracking-[0.28em] text-blue-900 uppercase">Welcome</p>
            <h1 className="font-openhouse text-4xl md:text-5xl text-slate-900 leading-tight mt-4">
              {listing}
            </h1>
            <p className="text-base text-slate-500 mt-5 leading-relaxed max-w-sm mx-auto">
              {description || 'Please sign in. It takes about 20 seconds, and it helps the hosting agent follow up.'}
            </p>
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="mt-10 w-full max-w-sm mx-auto bg-blue-900 hover:bg-blue-800 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-900/30 transition active:scale-[0.98]"
            >
              Register
            </button>
          </div>
        </div>

        <div className="relative flex-none px-6 pb-8 pt-2">
          <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-3xl p-4 shadow-sm flex items-center gap-4">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Scan to register on your phone" className="w-24 h-24 rounded-2xl bg-white shrink-0 ring-1 ring-slate-100" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-slate-100 shrink-0" />
            )}
            <div className="text-left">
              <p className="font-black text-slate-900">Prefer your own device?</p>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">Scan this QR and register on your phone.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Questionnaire
      key={quizKey}
      title={title}
      questions={registrationQuestionsForForm(questions)}
      onSubmit={onSubmit}
      accentColor="navy"
      theme="light"
      doneTitle="You're on the list"
      doneBody="Thanks for signing in. Enjoy the open house."
      doneAction={{
        label: 'Next guest',
        onClick: () => {
          setStarted(false)
          setQuizKey((k) => k + 1)
        },
      }}
    />
  )
}

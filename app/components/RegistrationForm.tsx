'use client'

import { useState, type FormEvent } from 'react'
import type { Question } from '@/app/components/Questionnaire'
import { extraRegistrationQuestions } from '@/app/lib/openhouseRegistration'

export type RegistrationValues = {
  name: string
  phone: string
  email: string
  isRealtor: string
  withRealtor: string
  extras: Record<string, string>
}

const emptyValues = (): RegistrationValues => ({
  name: '',
  phone: '',
  email: '',
  isRealtor: '',
  withRealtor: '',
  extras: {},
})

export function RegistrationForm({
  address,
  title,
  description,
  questions,
  qrDataUrl,
  submitting,
  onSubmit,
}: {
  address?: string
  title: string
  description?: string
  questions: Question[]
  qrDataUrl?: string
  submitting?: boolean
  onSubmit: (values: RegistrationValues) => Promise<void> | void
}) {
  const [values, setValues] = useState<RegistrationValues>(emptyValues)
  const [error, setError] = useState('')
  const extras = extraRegistrationQuestions(questions)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!values.name.trim() || !values.phone.trim()) {
      setError('Name and phone are required.')
      return
    }
    if (!values.isRealtor || !values.withRealtor) {
      setError('Please answer both realtor questions.')
      return
    }
    for (const q of extras) {
      if (!q.optional && !String(values.extras[q.id] || '').trim()) {
        setError('Please complete every question.')
        return
      }
    }
    await onSubmit(values)
  }

  const fieldClass = 'w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500'
  const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2'

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="px-6 pb-10 space-y-6">
      <div className="pt-2">
        <p className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">Open house sign-in</p>
        <h1 className="text-3xl font-black text-slate-900 leading-tight mt-1">
          {address || title}
        </h1>
        {address && title !== address ? (
          <p className="text-base font-bold text-slate-600 mt-2">{title}</p>
        ) : null}
        {description ? (
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">{description}</p>
        ) : (
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            Sign in so the hosting agent has your info. Takes about 20 seconds.
          </p>
        )}
      </div>

      {qrDataUrl ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
          <img src={qrDataUrl} alt="Scan to sign in on your phone" className="w-28 h-28 rounded-xl bg-white shrink-0" />
          <div>
            <p className="font-black text-slate-900">Prefer your phone?</p>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">Scan this QR code and fill the form on your own device.</p>
          </div>
        </div>
      ) : null}

      <div>
        <label className={labelClass}>Full name</label>
        <input
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className={fieldClass}
          placeholder="Your name"
        />
      </div>

      <div>
        <label className={labelClass}>Cell phone</label>
        <input
          type="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
          className={fieldClass}
          placeholder="(555) 555-5555"
        />
      </div>

      <div>
        <label className={labelClass}>Email <span className="normal-case tracking-normal font-medium text-slate-400">(optional)</span></label>
        <input
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          className={fieldClass}
          placeholder="you@email.com"
        />
      </div>

      <ChoiceField
        label="Are you a licensed realtor?"
        options={['Yes, I am a realtor', 'No']}
        value={values.isRealtor}
        onChange={(isRealtor) => setValues((v) => ({ ...v, isRealtor }))}
      />

      <ChoiceField
        label="Are you currently working with a realtor?"
        options={['Yes, I am', "No, I'm looking on my own"]}
        value={values.withRealtor}
        onChange={(withRealtor) => setValues((v) => ({ ...v, withRealtor }))}
      />

      {extras.map((q) => (
        <ExtraField
          key={q.id}
          question={q}
          value={values.extras[q.id] || ''}
          onChange={(value) => setValues((v) => ({ ...v, extras: { ...v.extras, [q.id]: value } }))}
        />
      ))}

      {error ? <p className="text-sm font-bold text-rose-500">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow"
      >
        {submitting ? 'Saving...' : "I'm here"}
      </button>
    </form>
  )
}

function ChoiceField({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <p className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <div className="space-y-2">
        {options.map((opt) => {
          const selected = value === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`w-full text-left font-bold py-3 px-4 rounded-xl border-2 transition ${
                selected
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ExtraField({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string
  onChange: (value: string) => void
}) {
  const label = (
    <p className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
      {question.text}
      {question.optional ? <span className="normal-case tracking-normal font-medium text-slate-400"> (optional)</span> : null}
    </p>
  )

  if (question.type === 'choice' && question.options?.length) {
    return (
      <ChoiceField
        label={question.text}
        options={question.options}
        value={value}
        onChange={onChange}
      />
    )
  }

  if (question.type === 'rating') {
    const max = question.maxRating || 5
    return (
      <div>
        {label}
        <div className="flex gap-2">
          {Array.from({ length: max }, (_, i) => String(i + 1)).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex-1 font-black py-3 rounded-xl border-2 ${
                value === n ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        rows={3}
        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
      />
    </div>
  )
}

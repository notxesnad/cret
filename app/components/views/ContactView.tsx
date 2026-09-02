'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'
import { submitContact, type ContactCategory } from '@/app/actions/contact'

const SUBJECTS: Record<ContactCategory, string> = {
  help: 'Help me',
  'idea-better': 'I want to make a current tool better',
  'idea-new': 'I would like a new tool',
  other: 'My request is different',
}

export function ContactView({
  switchView,
  signedIn,
  onNeedAuth,
}: {
  switchView: (view: string) => void
  signedIn: boolean
  onNeedAuth: () => void
}) {
  const [step, setStep] = useState<'pick' | 'idea' | 'compose'>('pick')
  const [category, setCategory] = useState<ContactCategory | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const openCompose = (next: ContactCategory) => {
    setCategory(next)
    setSubject(SUBJECTS[next])
    setError('')
    setStep('compose')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || busy) return
    setError('')
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      onNeedAuth()
      return
    }
    setBusy(true)
    try {
      const result = await submitContact({
        accessToken: token,
        category,
        subject,
        message,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      setSent(true)
    } catch (err) {
      console.error(err)
      setError('Could not send that just now. Try again in a minute.')
    } finally {
      setBusy(false)
    }
  }

  if (!signedIn) {
    return (
      <div id="view-contact" className="app-view active space-y-6">
        <div className="text-center">
          <span className="text-xs font-bold tracking-widest text-fuchsia-400 uppercase">Support</span>
          <h1 className="text-2xl font-black mt-1">We are here</h1>
          <p className="text-base text-slate-400 mt-2">Sign in so we know who we are talking to.</p>
        </div>
        <button
          type="button"
          onClick={onNeedAuth}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition"
        >
          Sign In
        </button>
      </div>
    )
  }

  if (sent) {
    return (
      <div id="view-contact" className="app-view active space-y-6 text-center">
        <div className="text-4xl">🙌</div>
        <h1 className="text-2xl font-black">Got it</h1>
        <p className="text-base text-slate-400">We will take a look and get back to you.</p>
        <button
          type="button"
          onClick={() => switchView('home')}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition"
        >
          Back to tools
        </button>
      </div>
    )
  }

  return (
    <div id="view-contact" className="app-view active space-y-4">
      <div className="text-center mb-2">
        <span className="text-xs font-bold tracking-widest text-fuchsia-400 uppercase">Support</span>
        <h1 className="text-2xl font-black mt-1">What do you need?</h1>
        <p className="text-base text-slate-400 mt-1">Tap one and tell us the rest.</p>
      </div>

      {step === 'pick' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => openCompose('help')}
            className="w-full text-left group relative bg-rose-600 hover:bg-rose-500 text-white p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl min-h-[120px]"
          >
            <span className="text-xs font-bold tracking-wider uppercase opacity-70">A</span>
            <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">Help me</h2>
          </button>
          <button
            type="button"
            onClick={() => setStep('idea')}
            className="w-full text-left group relative bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl min-h-[120px]"
          >
            <span className="text-xs font-bold tracking-wider uppercase opacity-70">B</span>
            <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">Have a tool idea</h2>
          </button>
          <button
            type="button"
            onClick={() => openCompose('other')}
            className="w-full text-left group relative bg-slate-800 hover:bg-slate-700 text-white p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl min-h-[120px] border-2 border-slate-700"
          >
            <span className="text-xs font-bold tracking-wider uppercase opacity-70">C</span>
            <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">My request is different</h2>
          </button>
        </div>
      )}

      {step === 'idea' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setStep('pick')}
            className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => openCompose('idea-better')}
            className="w-full text-left group relative bg-sky-500 hover:bg-sky-400 text-slate-950 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl min-h-[120px]"
          >
            <span className="text-xs font-bold tracking-wider uppercase opacity-70">I</span>
            <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">I want to make a current tool better</h2>
          </button>
          <button
            type="button"
            onClick={() => openCompose('idea-new')}
            className="w-full text-left group relative bg-amber-400 hover:bg-amber-300 text-slate-950 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl min-h-[120px]"
          >
            <span className="text-xs font-bold tracking-wider uppercase opacity-70">II</span>
            <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">I would like a new tool</h2>
          </button>
        </div>
      )}

      {step === 'compose' && category && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep(category.startsWith('idea') ? 'idea' : 'pick')}
            className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider"
          >
            ← Back
          </button>
          <label className="block">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white font-medium focus:outline-none focus:border-fuchsia-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">Tell us more</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              placeholder="What is going on?"
              className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white font-medium focus:outline-none focus:border-fuchsia-400 resize-y min-h-[160px]"
            />
          </label>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black py-4 rounded-2xl transition"
          >
            {busy ? 'Sending…' : 'Send'}
          </button>
        </form>
      )}
    </div>
  )
}

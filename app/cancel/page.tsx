'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'
import { startPortal } from '@/app/actions/billing'

export default function CancelPage() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const continueCancel = async () => {
    if (busy) return
    setMessage('')
    setBusy(true)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        window.location.href = '/?billing=portal'
        return
      }
      const result = await startPortal({ accessToken: token })
      if ('url' in result && result.url) {
        window.location.href = result.url
        return
      }
      if (result.error?.includes('No billing account')) {
        setMessage("You're not subscribed yet, so there is nothing to cancel.")
        return
      }
      setMessage(result.error || 'Could not open billing.')
    } catch (err) {
      console.error(err)
      setMessage('Could not open billing. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-['Inter',sans-serif] flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-4">
        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          Cool<span className="text-emerald-400">RealEstate</span>Tools
        </p>
        <h1 className="text-2xl font-black">Wait a second</h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          We think you&apos;re nuts, but that&apos;s okay.{' '}
          <a href="/t/contact" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 font-bold">
            Click here
          </a>
          {' '}if you just need our moral support or we can lend our best and brightest to help you create something great.
        </p>
        {message && <p className="text-sm text-rose-400">{message}</p>}
        <button
          type="button"
          onClick={continueCancel}
          disabled={busy}
          className="block w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white font-black py-3 rounded-xl transition"
        >
          {busy ? 'Opening billing…' : 'Still cancel'}
        </button>
        <a href="/" className="block text-sm text-slate-500 hover:text-slate-300">Back to tools</a>
      </div>
    </div>
  )
}

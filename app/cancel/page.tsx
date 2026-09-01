'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { startPortal } from '@/app/actions/billing'

export default function CancelPage() {
  const [message, setMessage] = useState('Checking your account…')
  const [needsSignIn, setNeedsSignIn] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (!token) {
          if (!cancelled) {
            setNeedsSignIn(true)
            setMessage('Sign in to cancel or manage billing. It takes one email link, then Stripe handles the rest.')
          }
          return
        }

        const result = await startPortal({ accessToken: token })
        if (cancelled) return
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
        if (!cancelled) setMessage('Could not open billing. Try again in a moment.')
      }
    }

    run()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-['Inter',sans-serif] flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-4">
        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          Cool<span className="text-emerald-400">RealEstate</span>Tools
        </p>
        <h1 className="text-2xl font-black">Simple to cancel</h1>
        <p className="text-sm text-slate-400">{message}</p>
        {needsSignIn && (
          <a
            href="/?billing=portal"
            className="block w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition"
          >
            Sign in
          </a>
        )}
        <a href="/" className="block text-sm text-slate-500 hover:text-slate-300">Back to tools</a>
      </div>
    </div>
  )
}

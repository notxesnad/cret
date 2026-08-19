'use client'

import { useEffect, useState } from 'react'
import { sendPdfEmail } from '@/app/actions/email'
import { supabase } from '@/utils/supabase'

export function AutoPrint() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('print') === 'true') {
      setTimeout(() => window.print(), 1000)
    }
  }, [])
  return null
}

export function PrintButtons({ userEmail, listingAddress }: { userEmail?: string, listingAddress: string }) {
  const [emailStatus, setEmailStatus] = useState<'idle' | 'form' | 'sending' | 'success' | 'error'>('idle')
  const [toEmail, setToEmail] = useState(userEmail || '')
  const [errorMsg, setErrorMsg] = useState('')
  const [sentTo, setSentTo] = useState('')

  useEffect(() => {
    if (toEmail) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setToEmail(session.user.email)
    })
  }, [toEmail])

  const handleEmail = async () => {
    if (emailStatus === 'idle') {
      setEmailStatus('form')
      return
    }

    setErrorMsg('')
    setEmailStatus('sending')
    const reportUrl = window.location.href.replace('?print=true', '')
    
    try {
      const result = await sendPdfEmail(toEmail, listingAddress, reportUrl)
      
      if (result.error) {
        setErrorMsg(result.error)
        setEmailStatus('error')
      } else {
        setSentTo(result.to || toEmail)
        setEmailStatus('success')
        setTimeout(() => { setEmailStatus('idle') }, 4000)
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to send email')
      setEmailStatus('error')
    }
  }

  return (
    <div className="flex flex-col items-stretch md:items-end gap-3 no-print">
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => window.print()}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Print
        </button>
        <button 
          onClick={handleEmail}
          disabled={emailStatus === 'sending'}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-5 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm min-w-[140px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          {emailStatus === 'sending' ? 'Sending...' : emailStatus === 'success' ? 'Sent!' : emailStatus === 'idle' ? 'Email PDF' : 'Send'}
        </button>
      </div>

      {(emailStatus === 'form' || emailStatus === 'error') && (
        <div className="w-full md:w-80 text-left">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Send this report to</label>
          <input
            type="email"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
          />
          {errorMsg && <p className="text-xs text-rose-500 font-bold mt-2">{errorMsg}</p>}
        </div>
      )}

      {emailStatus === 'success' && (
        <p className="text-xs text-emerald-600 font-bold">Sent to {sentTo}. Check inbox and spam.</p>
      )}
    </div>
  )
}

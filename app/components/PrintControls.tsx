'use client'

import { useEffect, useState } from 'react'
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

export function PrintButtons({ listingAddress }: { listingAddress: string }) {
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')

  const handleEmail = async () => {
    setStatusMsg('')
    setEmailStatus('sending')

    const { data: { session } } = await supabase.auth.getSession()
    const email = session?.user?.email
    if (!email) {
      setStatusMsg('You must be logged in to email this report.')
      setEmailStatus('error')
      return
    }

    try {
      const res = await fetch('/api/send-report-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          listingAddress,
          reportUrl: window.location.href.replace('?print=true', '')
        })
      })
      const result = await res.json()

      if (!res.ok || result.error) {
        setStatusMsg(result.error || 'Failed to send email.')
        setEmailStatus('error')
        return
      }

      setStatusMsg(`Sent to ${result.to || email}. Check inbox and spam.`)
      setEmailStatus('success')
      setTimeout(() => { setEmailStatus('idle'); setStatusMsg('') }, 5000)
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Failed to send email')
      setEmailStatus('error')
    }
  }

  return (
    <div className="flex flex-col items-stretch md:items-end gap-2 no-print">
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
          {emailStatus === 'sending' ? 'Sending...' : emailStatus === 'success' ? 'Sent!' : 'Email PDF'}
        </button>
      </div>
      {statusMsg && (
        <p className={`text-xs font-bold max-w-xs ${emailStatus === 'error' ? 'text-rose-500' : 'text-emerald-600'}`}>
          {statusMsg}
        </p>
      )}
    </div>
  )
}

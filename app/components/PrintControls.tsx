'use client'

import { useEffect, useState } from 'react'
import { sendPdfEmail } from '@/app/actions/email'

export function AutoPrint() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('print') === 'true') {
      setTimeout(() => window.print(), 1000)
    }
  }, [])
  return null
}

export function PrintButtons({ userEmail, listingAddress }: { userEmail: string, listingAddress: string }) {
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const handleEmail = async () => {
    setEmailStatus('sending')
    const reportUrl = window.location.href.replace('?print=true', '')
    
    try {
      const result = await sendPdfEmail(userEmail, listingAddress, reportUrl)
      
      if (result.error) {
        alert(result.error)
        setEmailStatus('error')
      } else {
        setEmailStatus('success')
      }
      
      setTimeout(() => { setEmailStatus('idle') }, 3000)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to send email')
      setEmailStatus('error')
      setTimeout(() => { setEmailStatus('idle') }, 3000)
    }
  }

  return (
    <div className="flex flex-wrap gap-3 no-print">
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
        {emailStatus === 'sending' ? 'Sending...' : emailStatus === 'success' ? 'Sent!' : emailStatus === 'error' ? 'Error' : 'Email PDF'}
      </button>
    </div>
  )
}

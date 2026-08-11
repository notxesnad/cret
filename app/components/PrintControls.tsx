'use client'

import { useEffect } from 'react'

export function AutoPrint() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('print') === 'true') {
      setTimeout(() => window.print(), 1000)
    }
  }, [])
  return null
}

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="no-print bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 text-sm max-w-fit"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
      Print / Save as PDF
    </button>
  )
}

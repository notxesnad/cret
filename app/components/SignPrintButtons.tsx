'use client'

import { useState } from 'react'

export function SignPrintButtons({ filename }: { filename: string }) {
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const handleSavePdf = async () => {
    setStatusMsg('')
    setSaving(true)
    const pages = Array.from(document.querySelectorAll('.sign-sheet')) as HTMLElement[]
    if (pages.length === 0) {
      setStatusMsg('Could not find the signs to save.')
      setSaving(false)
      return
    }

    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' })
      const slug = filename.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'open-house-signs'

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        if (i > 0) pdf.addPage()
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: getComputedStyle(page).backgroundColor || '#ffffff',
          logging: false,
          width: page.scrollWidth,
          windowWidth: page.scrollWidth,
        })
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 8.5, 11)
      }

      pdf.save(`${slug}.pdf`)
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Failed to save PDF')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-stretch md:items-end gap-2 no-print">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Print
        </button>
        <button
          type="button"
          onClick={() => void handleSavePdf()}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-5 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm min-w-[140px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          {saving ? 'Saving...' : 'Save PDF'}
        </button>
      </div>
      {statusMsg && <p className="text-xs font-bold max-w-xs text-rose-500">{statusMsg}</p>}
    </div>
  )
}

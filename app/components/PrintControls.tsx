'use client'

import { useState } from 'react'

export function PrintButtons({ listingAddress }: { listingAddress: string }) {
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const handleSavePdf = async () => {
    setStatusMsg('')
    setSaving(true)

    const element = document.getElementById('report-print-root')
    if (!element) {
      setStatusMsg('Could not find the report to save.')
      setSaving(false)
      return
    }

    const hidden = Array.from(element.querySelectorAll('.no-print')) as HTMLElement[]
    hidden.forEach((el) => { el.style.visibility = 'hidden' })

    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')
      const filename = `${listingAddress.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'seller-report'}.pdf`

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false
      })

      const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait' })
      const pageWidth = 8.5
      const pageHeight = 11
      const margin = 0.4
      const imgWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      let remaining = imgHeight
      let offset = margin

      pdf.addImage(imgData, 'JPEG', margin, offset, imgWidth, imgHeight)
      remaining -= (pageHeight - margin * 2)

      while (remaining > 0) {
        offset -= (pageHeight - margin * 2)
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', margin, offset, imgWidth, imgHeight)
        remaining -= (pageHeight - margin * 2)
      }

      pdf.save(filename)
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Failed to save PDF')
    } finally {
      hidden.forEach((el) => { el.style.visibility = '' })
      setSaving(false)
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
          onClick={handleSavePdf}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-5 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm min-w-[140px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          {saving ? 'Saving...' : 'Save PDF'}
        </button>
      </div>
      {statusMsg && (
        <p className="text-xs font-bold max-w-xs text-rose-500">{statusMsg}</p>
      )}
    </div>
  )
}

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
    hidden.forEach((el) => { el.style.display = 'none' })

    const original = {
      width: element.style.width,
      maxWidth: element.style.maxWidth,
      padding: element.style.padding,
      margin: element.style.margin,
      boxSizing: element.style.boxSizing,
      backgroundColor: element.style.backgroundColor,
      className: element.className
    }

    try {
      // Lay the report out at letter width so the snapshot is portrait and fills the page.
      element.classList.add('pdf-capture')
      element.classList.remove('px-4', 'md:px-8', 'pt-6')
      element.style.boxSizing = 'border-box'
      element.style.width = '816px'
      element.style.maxWidth = '816px'
      element.style.setProperty('padding', '0', 'important')
      element.style.setProperty('padding-left', '0', 'important')
      element.style.setProperty('padding-right', '0', 'important')
      element.style.margin = '0'
      element.style.backgroundColor = '#ffffff'

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))))

      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')
      const filename = `${listingAddress.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'seller-report'}.pdf`

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        windowWidth: element.scrollWidth,
        onclone: (doc) => {
          const clone = doc.getElementById('report-print-root')
          if (!clone) return
          clone.classList.add('pdf-capture')
          clone.classList.remove('px-4', 'md:px-8', 'pt-6')
          clone.querySelectorAll('.no-print').forEach((node) => {
            (node as HTMLElement).style.setProperty('display', 'none', 'important')
          })
          clone.style.setProperty('padding', '0', 'important')
          clone.style.setProperty('padding-left', '0', 'important')
          clone.style.setProperty('padding-right', '0', 'important')
          clone.style.setProperty('background-color', '#ffffff', 'important')
          clone.querySelectorAll('.itinerary-qr-header').forEach((node) => {
            const el = node as HTMLElement
            el.style.setProperty('display', 'flex', 'important')
            el.style.setProperty('flex-direction', 'row', 'important')
            el.style.setProperty('align-items', 'center', 'important')
            el.style.setProperty('justify-content', 'space-between', 'important')
            el.style.setProperty('gap', '0.75rem', 'important')
          })
          clone.querySelectorAll('.itinerary-qr-header img').forEach((node) => {
            const img = node as HTMLElement
            img.style.setProperty('width', '64px', 'important')
            img.style.setProperty('height', '64px', 'important')
            img.style.setProperty('flex-shrink', '0', 'important')
          })
          clone.querySelectorAll('.itinerary-stop').forEach((node) => {
            const stop = node as HTMLElement
            stop.style.setProperty('display', 'flex', 'important')
            stop.style.setProperty('flex-direction', 'row', 'important')
            stop.style.setProperty('align-items', 'stretch', 'important')
            stop.style.setProperty('overflow', 'hidden', 'important')
          })
          clone.querySelectorAll('.itinerary-stop .stop-photo').forEach((node) => {
            const photo = node as HTMLElement
            photo.style.setProperty('width', '168px', 'important')
            photo.style.setProperty('min-width', '168px', 'important')
            photo.style.setProperty('height', '140px', 'important')
            photo.style.setProperty('max-height', '140px', 'important')
            photo.style.setProperty('flex-shrink', '0', 'important')
            photo.style.setProperty('overflow', 'hidden', 'important')
          })
          clone.querySelectorAll('.itinerary-stop .stop-photo img').forEach((node) => {
            const img = node as HTMLElement
            img.style.setProperty('width', '168px', 'important')
            img.style.setProperty('height', '140px', 'important')
            img.style.setProperty('max-width', 'none', 'important')
            img.style.setProperty('object-fit', 'cover', 'important')
          })
          clone.querySelectorAll('*').forEach((node) => {
            const el = node as HTMLElement
            el.style.setProperty('box-shadow', 'none', 'important')
            el.style.setProperty('filter', 'none', 'important')
            el.style.setProperty('text-shadow', 'none', 'important')
          })
        }
      })

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 36
      const destWidth = pageWidth - margin * 2
      const destHeight = pageHeight - margin * 2
      const pdfScale = destWidth / canvas.width
      const canvasScale = canvas.width / element.scrollWidth
      const rootRect = element.getBoundingClientRect()

      const blocks = Array.from(element.querySelectorAll('.print-break-inside-avoid'))
        .filter((node) => !(node.parentElement?.closest('.print-break-inside-avoid')))
        .map((node) => {
          const r = (node as HTMLElement).getBoundingClientRect()
          return {
            top: (r.top - rootRect.top) * canvasScale,
            bottom: (r.bottom - rootRect.top) * canvasScale
          }
        })

      const headerEl = document.getElementById('report-print-header')
      const headerRect = headerEl?.getBoundingClientRect()
      const headerBottom = headerRect ? (headerRect.bottom - rootRect.top) * canvasScale : 0

      const snapEnd = (startY: number, maxEndY: number) => {
        let end = maxEndY
        for (const b of blocks) {
          if (b.bottom <= startY + 1 || b.top >= maxEndY) continue
          if (b.bottom > maxEndY && b.top > startY + 8) {
            end = Math.min(end, b.top)
          }
        }
        if (end <= startY + 8) return maxEndY
        return Math.min(end, canvas.height)
      }

      const drawSlice = (srcY: number, sliceHeight: number, destY: number) => {
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = Math.max(1, sliceHeight)
        const ctx = sliceCanvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
          ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)
        }
        pdf.addImage(
          sliceCanvas.toDataURL('image/jpeg', 0.95),
          'JPEG',
          margin,
          destY,
          destWidth,
          sliceHeight * pdfScale
        )
      }

      let srcY = 0
      let page = 0
      while (srcY < canvas.height - 1) {
        if (page > 0) pdf.addPage()

        let destY = margin
        let availablePt = destHeight

        if (page > 0 && headerBottom > 0) {
          drawSlice(0, headerBottom, margin)
          destY = margin + headerBottom * pdfScale + 8
          availablePt = pageHeight - destY - margin
        }

        const maxEnd = Math.min(canvas.height, srcY + availablePt / pdfScale)
        const endY = snapEnd(srcY, maxEnd)
        drawSlice(srcY, endY - srcY, destY)
        srcY = endY
        page += 1
      }

      pdf.save(filename)
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Failed to save PDF')
    } finally {
      element.className = original.className
      element.style.width = original.width
      element.style.maxWidth = original.maxWidth
      element.style.padding = original.padding
      element.style.margin = original.margin
      element.style.boxSizing = original.boxSizing
      element.style.backgroundColor = original.backgroundColor
      hidden.forEach((el) => { el.style.display = '' })
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

'use client'

import { useState, type ReactNode } from 'react'

type FoldTone = 'slate' | 'gold' | 'white' | 'black'

const DESIGNS = [
  { id: 'classic', name: 'Classic', blurb: 'Clean, bright, and easy to read from across the kitchen.' },
  { id: 'estate', name: 'Estate', blurb: 'Cream paper, gold frame, quiet luxury.' },
  { id: 'poster', name: 'Poster', blurb: 'Loud yellow. Impossible to walk past.' },
  { id: 'studio', name: 'Studio', blurb: 'Museum-label layout. Lots of white space.' },
  { id: 'night', name: 'Night', blurb: 'Black page, white type, candlelight QR.' },
] as const

export function OpenHouseFeedbackSigns({
  address,
  title,
  qrDataUrl,
}: {
  address?: string
  title: string
  qrDataUrl: string
}) {
  const listing = address || title
  const slug = listing.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'open-house'
  const [busyId, setBusyId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')

  const downloadQr = () => {
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `${slug}-qr.png`
    link.click()
  }

  const printSheet = (id: string) => {
    const sheet = document.querySelector(`[data-sheet="${id}"]`)
    if (!sheet) return
    document.querySelectorAll('.sign-sheet').forEach((el) => el.classList.remove('is-print-target'))
    sheet.classList.add('is-print-target')
    document.documentElement.classList.add('print-one-sign')
    let done = false
    const finish = () => {
      if (done) return
      done = true
      document.documentElement.classList.remove('print-one-sign')
      sheet.classList.remove('is-print-target')
      window.removeEventListener('afterprint', finish)
    }
    window.addEventListener('afterprint', finish)
    window.setTimeout(finish, 2000)
    window.print()
  }

  const saveSheetPdf = async (id: string, label: string) => {
    const sheet = document.querySelector(`[data-sheet="${id}"]`) as HTMLElement | null
    if (!sheet) return
    setStatusMsg('')
    setBusyId(id)
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        backgroundColor: getComputedStyle(sheet).backgroundColor || '#ffffff',
        logging: false,
        width: sheet.scrollWidth,
        windowWidth: sheet.scrollWidth,
      })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' })
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 8.5, 11)
      pdf.save(`${slug}-${label}.pdf`)
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Could not save that PDF.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-20">
      <style>{`
        @page { size: letter; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          html, body { background: white !important; margin: 0 !important; }
          .sign-print-stack {
            position: static !important;
            left: auto !important;
            top: auto !important;
          }
          .sign-sheet {
            width: 8.5in !important;
            height: 11in !important;
            margin: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          html.print-one-sign .sign-sheet { display: none !important; }
          html.print-one-sign .sign-sheet.is-print-target { display: block !important; }
        }
      `}</style>

      <div className="no-print max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-10">
        <div>
          <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase">QR code signage</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">{listing}</h1>
          <p className="text-slate-500 mt-2 leading-relaxed max-w-xl">
            Download the code, or pick a sign and print just that one. Tent cards fold on the dotted line.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center">
          <img src={qrDataUrl} alt="Open house feedback QR code" className="w-48 h-48 bg-white" />
          <button
            type="button"
            onClick={downloadQr}
            className="mt-5 bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 px-8 rounded-xl transition"
          >
            Download QR Code
          </button>
        </div>

        {statusMsg && <p className="text-sm font-bold text-rose-500">{statusMsg}</p>}

        <div className="grid md:grid-cols-2 gap-6">
          {DESIGNS.map((design) => (
            <div key={design.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <SignPreview>
                <LetterSheet className={sheetClass(design.id)}>
                  <FullSign id={design.id} address={listing} qrDataUrl={qrDataUrl} />
                </LetterSheet>
              </SignPreview>
              <div className="p-5 space-y-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{design.name}</h2>
                  <p className="text-sm text-slate-500 mt-1">{design.blurb}</p>
                </div>
                <button
                  type="button"
                  onClick={() => printSheet(`${design.id}-full`)}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-3 rounded-xl"
                >
                  Print full page
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => printSheet(`${design.id}-tent`)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl text-sm"
                  >
                    Print tent card
                  </button>
                  <button
                    type="button"
                    disabled={busyId === `${design.id}-full`}
                    onClick={() => void saveSheetPdf(`${design.id}-full`, `${design.id}-full`)}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-black py-3 rounded-xl text-sm"
                  >
                    {busyId === `${design.id}-full` ? 'Saving...' : 'Save full PDF'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sign-print-stack absolute left-[-120vw] top-0">
        {DESIGNS.map((design) => (
          <div key={design.id}>
            <LetterSheet dataSheet={`${design.id}-full`} className={sheetClass(design.id)}>
              <FullSign id={design.id} address={listing} qrDataUrl={qrDataUrl} />
            </LetterSheet>
            <LetterSheet dataSheet={`${design.id}-tent`} className={sheetClass(design.id)}>
              <TentFrame tone={foldTone(design.id)}>
                <div className="h-full flex items-center justify-center px-8 py-6 rotate-180">
                  <FullSign id={design.id} address={listing} qrDataUrl={qrDataUrl} compact />
                </div>
                <div className="h-full flex items-center justify-center px-8 py-6">
                  <FullSign id={design.id} address={listing} qrDataUrl={qrDataUrl} compact />
                </div>
              </TentFrame>
            </LetterSheet>
          </div>
        ))}
      </div>
    </div>
  )
}

function sheetClass(id: string) {
  if (id === 'estate') return 'bg-[#f6f1e7]'
  if (id === 'poster') return 'bg-[#f5c400]'
  if (id === 'night') return 'bg-[#111111]'
  return 'bg-white'
}

function foldTone(id: string): FoldTone {
  if (id === 'estate') return 'gold'
  if (id === 'poster') return 'black'
  if (id === 'night') return 'white'
  return 'slate'
}

function SignPreview({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-72 overflow-hidden bg-slate-200">
      <div className="absolute left-1/2 top-3 origin-top -translate-x-1/2 scale-[0.28] pointer-events-none">
        {children}
      </div>
    </div>
  )
}

function LetterSheet({
  children,
  className = 'bg-white',
  dataSheet,
}: {
  children: ReactNode
  className?: string
  dataSheet?: string
}) {
  return (
    <div
      data-sheet={dataSheet}
      className={`sign-sheet relative overflow-hidden ${className}`}
      style={{ width: '8.5in', height: '11in' }}
    >
      {children}
    </div>
  )
}

function TentFrame({ children, tone }: { children: ReactNode; tone: FoldTone }) {
  const line =
    tone === 'gold' ? 'border-[#c4a574] text-[#c4a574]'
    : tone === 'white' ? 'border-white/50 text-white/60'
    : tone === 'black' ? 'border-black/40 text-black/50'
    : 'border-slate-300 text-slate-400'
  return (
    <div className="relative h-full grid grid-rows-2">
      {children}
      <div className="absolute left-[0.6in] right-[0.6in] top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none">
        <div className={`flex-1 border-t border-dotted ${line}`} />
        <span className={`text-[9px] font-bold tracking-[0.35em] ${line}`}>FOLD</span>
        <div className={`flex-1 border-t border-dotted ${line}`} />
      </div>
    </div>
  )
}

function FullSign({
  id,
  address,
  qrDataUrl,
  compact,
}: {
  id: string
  address: string
  qrDataUrl: string
  compact?: boolean
}) {
  if (id === 'estate') return <EstateSign address={address} qrDataUrl={qrDataUrl} compact={compact} />
  if (id === 'poster') return <PosterSign address={address} qrDataUrl={qrDataUrl} compact={compact} />
  if (id === 'studio') return <StudioSign address={address} qrDataUrl={qrDataUrl} compact={compact} />
  if (id === 'night') return <NightSign address={address} qrDataUrl={qrDataUrl} compact={compact} />
  return <ClassicSign address={address} qrDataUrl={qrDataUrl} compact={compact} />
}

function ClassicSign({ address, qrDataUrl, compact }: { address: string; qrDataUrl: string; compact?: boolean }) {
  return (
    <div className="h-full flex items-center justify-center p-[0.7in]">
      <div className="text-center max-w-[6.6in]">
        <p className={`font-bold tracking-[0.35em] text-indigo-500 uppercase ${compact ? 'text-[10px] mb-2' : 'text-sm mb-4'}`}>Open House</p>
        <p className={`font-black text-indigo-600 leading-tight ${compact ? 'text-2xl' : 'text-5xl'}`}>{address}</p>
        <h2 className={`font-black text-slate-900 leading-tight ${compact ? 'text-xl mt-3' : 'text-4xl mt-6'}`}>We&apos;d love your anonymous feedback</h2>
        <p className={`text-slate-600 mx-auto ${compact ? 'text-sm mt-2 max-w-sm' : 'text-xl mt-5 max-w-lg'}`}>
          Scan this code to share your thoughts. No name required — it takes about 30 seconds.
        </p>
        <img src={qrDataUrl} alt="" className={`mx-auto bg-white ${compact ? 'w-28 h-28 mt-4' : 'w-52 h-52 mt-8'}`} />
      </div>
    </div>
  )
}

function EstateSign({ address, qrDataUrl, compact }: { address: string; qrDataUrl: string; compact?: boolean }) {
  return (
    <div className={`h-full ${compact ? 'p-4' : 'p-[0.45in]'}`}>
      <div className={`h-full border-[3px] border-[#c4a574] ${compact ? 'p-2' : 'p-2.5'}`}>
        <div className={`h-full border border-[#1a1612] flex items-center justify-center ${compact ? 'px-5 py-4' : 'px-10 py-8'}`}>
          <div className="text-center text-[#1a1612]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            <p className={`tracking-[0.45em] uppercase text-[#c4a574] ${compact ? 'text-[9px]' : 'text-xs'}`}>Open House</p>
            <div className={`mx-auto bg-[#c4a574] ${compact ? 'w-10 h-px mt-3 mb-3' : 'w-16 h-px mt-5 mb-6'}`} />
            <p className={`leading-tight ${compact ? 'text-2xl' : 'text-5xl'}`} style={{ fontWeight: 600 }}>{address}</p>
            <p className={`italic text-[#4a433c] ${compact ? 'text-base mt-3' : 'text-3xl mt-6'}`}>A private note for the seller</p>
            <p className={`mx-auto ${compact ? 'text-xs mt-2 max-w-xs' : 'text-base mt-4 max-w-md'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
              Scan to share your thoughts. No name required.
            </p>
            <div className={`mx-auto border border-[#c4a574] bg-white ${compact ? 'p-2 mt-4 w-[7.5rem]' : 'p-3 mt-8 w-56'}`}>
              <img src={qrDataUrl} alt="" className="w-full h-auto bg-white" />
            </div>
            <p className={`tracking-[0.28em] uppercase text-[#c4a574] ${compact ? 'text-[8px] mt-3' : 'text-[11px] mt-6'}`}>Anonymous · Thirty seconds</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PosterSign({ address, qrDataUrl, compact }: { address: string; qrDataUrl: string; compact?: boolean }) {
  return (
    <div className={`h-full flex items-center justify-center text-black ${compact ? 'px-8 py-4' : 'p-[0.65in]'}`} style={{ fontFamily: "'Bungee', sans-serif" }}>
      <div className="text-center">
        <p className={`leading-none ${compact ? 'text-3xl' : 'text-6xl'}`}>GOT 30 SECONDS?</p>
        <p className={`mt-3 font-sans font-black tracking-tight ${compact ? 'text-lg' : 'text-3xl'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{address}</p>
        <div className={`mx-auto bg-black ${compact ? 'p-1.5 mt-4' : 'p-3 mt-8'}`}>
          <img src={qrDataUrl} alt="" className={`bg-white ${compact ? 'w-28 h-28' : 'w-52 h-52'}`} />
        </div>
        <p className={`mt-4 leading-snug ${compact ? 'text-sm' : 'text-2xl'}`}>NO NAME. HONEST THOUGHTS.</p>
      </div>
    </div>
  )
}

function StudioSign({ address, qrDataUrl, compact }: { address: string; qrDataUrl: string; compact?: boolean }) {
  if (compact) {
    return (
      <div className="h-full flex items-center px-10">
        <div className="w-full border-l-8 border-black pl-5">
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-slate-400">Visitor comments</p>
          <p className="text-2xl font-black leading-tight mt-1">{address}</p>
          <p className="text-sm text-slate-500 mt-2">Scan. No name. About 30 seconds.</p>
          <img src={qrDataUrl} alt="" className="w-24 h-24 bg-white mt-3" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex items-stretch p-[0.7in]">
      <div className="flex-1 border-l-[10px] border-black pl-8 pr-6 flex flex-col justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.4em] uppercase text-slate-400">Open house · visitor comments</p>
          <p className="text-5xl font-black leading-[1.05] mt-6">{address}</p>
        </div>
        <p className="text-xl text-slate-500 max-w-sm leading-relaxed">
          Leave a private note. No name, no phone, no clipboard.
        </p>
      </div>
      <div className="w-[3.2in] flex flex-col items-center justify-center">
        <img src={qrDataUrl} alt="" className="w-56 h-56 bg-white" />
        <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-400 mt-4">Scan here</p>
      </div>
    </div>
  )
}

function NightSign({ address, qrDataUrl, compact }: { address: string; qrDataUrl: string; compact?: boolean }) {
  return (
    <div className={`h-full text-white ${compact ? 'p-5' : 'p-[0.55in]'}`}>
      <div className={`h-full border border-white/25 flex flex-col items-center justify-center text-center ${compact ? 'px-6 py-4' : 'px-12 py-10'}`}>
        <p className={`tracking-[0.5em] uppercase text-white/50 ${compact ? 'text-[8px]' : 'text-[11px]'}`}>Open house</p>
        <p className={`leading-tight mt-4 ${compact ? 'text-2xl' : 'text-5xl'}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{address}</p>
        <p className={`italic text-white/70 ${compact ? 'text-sm mt-2' : 'text-2xl mt-5'}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Your honest take, in private
        </p>
        <div className={`bg-white ${compact ? 'p-2 mt-4' : 'p-4 mt-8'}`}>
          <img src={qrDataUrl} alt="" className={compact ? 'w-28 h-28' : 'w-48 h-48'} />
        </div>
        <p className={`tracking-[0.3em] uppercase text-white/40 ${compact ? 'text-[8px] mt-3' : 'text-[11px] mt-6'}`}>Anonymous · Thirty seconds</p>
      </div>
    </div>
  )
}

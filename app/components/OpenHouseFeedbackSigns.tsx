'use client'

import { useState, type ReactNode } from 'react'

type FoldTone = 'slate' | 'gold' | 'white' | 'black'
type SignLayout = 'full' | 'tent'

const DESIGNS = [
  { id: 'classic', name: 'Classic', blurb: 'Clean, bright, and easy to read from across the kitchen.' },
  { id: 'burst', name: 'Burst', blurb: 'A giant circle around the code. Fun on purpose.' },
  { id: 'navy', name: 'Navy', blurb: 'Deep blue, crisp type, very listing-photo.' },
  { id: 'estate', name: 'Estate', blurb: 'Cream paper, gold frame, quiet luxury.' },
  { id: 'poster', name: 'Poster', blurb: 'Loud yellow. Impossible to walk past.' },
  { id: 'studio', name: 'Studio', blurb: 'Museum-label layout. Lots of white space.' },
  { id: 'night', name: 'Night', blurb: 'Black page, white type, candlelight QR.' },
  { id: 'coral', name: 'Coral', blurb: 'Warm and friendly. Hard to ignore on the counter.' },
  { id: 'news', name: 'News', blurb: 'Front-page energy. Extra, extra.' },
  { id: 'sage', name: 'Sage', blurb: 'Calm green. Soft, not shouty.' },
] as const

export function OpenHouseFeedbackSigns({
  address,
  title,
  qrDataUrl,
  variant = 'page',
}: {
  address?: string
  title: string
  qrDataUrl: string
  variant?: 'page' | 'app'
}) {
  const listing = address || title
  const slug = listing.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'open-house'
  const [busyId, setBusyId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const isApp = variant === 'app'

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

  const saveDesignPdf = async (designId: string) => {
    const pages = [`${designId}-full`, `${designId}-tent`]
    setStatusMsg('')
    setBusyId(designId)
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' })
      for (let i = 0; i < pages.length; i++) {
        const sheet = document.querySelector(`[data-sheet="${pages[i]}"]`) as HTMLElement | null
        if (!sheet) throw new Error('Could not find that sign.')
        const canvas = await html2canvas(sheet, {
          scale: 2,
          useCORS: true,
          backgroundColor: getComputedStyle(sheet).backgroundColor || '#ffffff',
          logging: false,
          width: sheet.scrollWidth,
          windowWidth: sheet.scrollWidth,
        })
        if (i > 0) pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 8.5, 11)
      }
      pdf.save(`${slug}-${designId}.pdf`)
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Could not save that PDF.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className={`max-w-full overflow-x-hidden ${isApp ? 'text-white pb-8' : 'min-h-screen bg-slate-100 text-slate-900 font-sans pb-20'}`}>
      <style>{`
        @page { size: letter; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          html, body { background: white !important; margin: 0 !important; }
          html.print-one-sign body * { visibility: hidden !important; }
          html.print-one-sign .sign-print-stack,
          html.print-one-sign .sign-print-stack *,
          html.print-one-sign .sign-sheet.is-print-target,
          html.print-one-sign .sign-sheet.is-print-target * {
            visibility: visible !important;
          }
          html.print-one-sign .sign-print-stack {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
          }
          html.print-one-sign .sign-sheet { display: none !important; }
          html.print-one-sign .sign-sheet.is-print-target {
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 8.5in !important;
            height: 11in !important;
            margin: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className={`no-print ${isApp ? 'space-y-6' : 'max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-10'}`}>
        <div>
          <p className={`text-xs font-bold tracking-widest uppercase ${isApp ? 'text-indigo-400' : 'text-indigo-500'}`}>QR code signage</p>
          <h1 className={`font-black mt-1 ${isApp ? 'text-3xl text-white' : 'text-3xl md:text-4xl text-slate-900'}`}>{listing}</h1>
          <p className={`mt-2 leading-relaxed ${isApp ? 'text-slate-400 text-sm' : 'text-slate-500 max-w-xl'}`}>
            Download the code, or pick a sign and print just that one. Tent cards fold on the dotted line.
          </p>
        </div>

        <div className={`flex flex-col items-center text-center ${isApp ? 'bg-slate-800 rounded-2xl p-5' : 'bg-white border border-slate-200 rounded-3xl p-6 md:p-8'}`}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Open house feedback QR code" className="w-40 h-40 bg-white rounded-lg" />
          ) : (
            <div className="w-40 h-40 bg-white rounded-lg animate-pulse" />
          )}
          <button
            type="button"
            onClick={downloadQr}
            disabled={!qrDataUrl}
            className="mt-5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-black py-4 px-8 rounded-xl transition w-full"
          >
            Download QR Code
          </button>
        </div>

        {statusMsg && <p className="text-sm font-bold text-rose-400">{statusMsg}</p>}

        <div className={isApp ? 'space-y-5' : 'grid md:grid-cols-2 gap-6'}>
          {DESIGNS.map((design) => (
            <div key={design.id} className={isApp ? 'bg-slate-800 rounded-2xl overflow-hidden' : 'bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm'}>
              <SignPreview>
                <LetterSheet className={sheetClass(design.id)}>
                  <DesignSign id={design.id} address={listing} qrDataUrl={qrDataUrl} layout="full" />
                </LetterSheet>
              </SignPreview>
              <div className="p-5 space-y-3">
                <div>
                  <h2 className={`text-xl font-black ${isApp ? 'text-white' : 'text-slate-900'}`}>{design.name}</h2>
                  <p className={`text-sm mt-1 ${isApp ? 'text-slate-400' : 'text-slate-500'}`}>{design.blurb}</p>
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
                    className="bg-white hover:bg-slate-100 text-slate-900 font-black py-3 rounded-xl text-sm"
                  >
                    Print tent card
                  </button>
                  <button
                    type="button"
                    disabled={busyId === design.id}
                    onClick={() => void saveDesignPdf(design.id)}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-black py-3 rounded-xl text-sm"
                  >
                    {busyId === design.id ? 'Saving...' : 'Save PDF'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sign-print-stack fixed top-0 pointer-events-none" style={{ left: '-20in', width: '8.5in' }} aria-hidden="true">
        {DESIGNS.map((design) => (
          <div key={design.id}>
            <LetterSheet dataSheet={`${design.id}-full`} className={sheetClass(design.id)}>
              <DesignSign id={design.id} address={listing} qrDataUrl={qrDataUrl} layout="full" />
            </LetterSheet>
            <LetterSheet dataSheet={`${design.id}-tent`} className={sheetClass(design.id)}>
              <TentFrame tone={foldTone(design.id)}>
                <div className="h-full rotate-180">
                  <DesignSign id={design.id} address={listing} qrDataUrl={qrDataUrl} layout="tent" />
                </div>
                <div className="h-full">
                  <DesignSign id={design.id} address={listing} qrDataUrl={qrDataUrl} layout="tent" />
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
  if (id === 'coral') return 'bg-[#e11d48]'
  if (id === 'sage') return 'bg-[#e4efe3]'
  if (id === 'navy') return 'bg-[#0b1f3a]'
  if (id === 'burst') return 'bg-[#eef2ff]'
  return 'bg-white'
}

function foldTone(id: string): FoldTone {
  if (id === 'estate') return 'gold'
  if (id === 'poster' || id === 'burst') return 'black'
  if (id === 'night' || id === 'navy' || id === 'coral') return 'white'
  return 'slate'
}

function SignPreview({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full overflow-hidden bg-slate-200 aspect-[8.5/11] [container-type:inline-size]">
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-none"
        style={{ width: 816, height: 1056, transform: 'scale(calc(100cqw / 816px))' }}
      >
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
      <div className="absolute left-[0.45in] right-[0.45in] top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none">
        <div className={`flex-1 border-t border-dotted ${line}`} />
        <span className={`text-[9px] font-bold tracking-[0.35em] ${line}`}>FOLD</span>
        <div className={`flex-1 border-t border-dotted ${line}`} />
      </div>
    </div>
  )
}

function TentRow({
  qrDataUrl,
  children,
  frameClass = 'bg-white p-2',
}: {
  qrDataUrl: string
  children: ReactNode
  frameClass?: string
}) {
  return (
    <div className="h-full w-full flex items-center gap-8 px-10 py-5">
      <div className="flex-1 min-w-0">{children}</div>
      <div className={`shrink-0 ${frameClass}`}>
        <img src={qrDataUrl} alt="" className="w-44 h-44 bg-white" />
      </div>
    </div>
  )
}

function DesignSign({
  id,
  address,
  qrDataUrl,
  layout,
}: {
  id: string
  address: string
  qrDataUrl: string
  layout: SignLayout
}) {
  const props = { address, qrDataUrl, layout }
  if (id === 'estate') return <EstateSign {...props} />
  if (id === 'poster') return <PosterSign {...props} />
  if (id === 'studio') return <StudioSign {...props} />
  if (id === 'night') return <NightSign {...props} />
  if (id === 'coral') return <CoralSign {...props} />
  if (id === 'news') return <NewsSign {...props} />
  if (id === 'sage') return <SageSign {...props} />
  if (id === 'navy') return <NavySign {...props} />
  if (id === 'burst') return <BurstSign {...props} />
  return <ClassicSign {...props} />
}

function ClassicSign({ address, qrDataUrl, layout }: { address: string; qrDataUrl: string; layout: SignLayout }) {
  if (layout === 'tent') {
    return (
      <TentRow qrDataUrl={qrDataUrl}>
        <p className="text-xs font-bold tracking-[0.3em] text-indigo-500 uppercase">Open House</p>
        <p className="font-black text-slate-900 text-4xl leading-tight mt-2">{address}</p>
        <p className="font-black text-slate-900 text-2xl mt-3 leading-snug">We really want your anonymous feedback.</p>
        <p className="text-lg text-slate-600 mt-2">Scan this code. No name required — about 30 seconds.</p>
      </TentRow>
    )
  }
  return (
    <div className="h-full flex items-center justify-center p-[0.7in]">
      <div className="text-center max-w-[6.6in]">
        <p className="font-bold tracking-[0.35em] text-indigo-500 uppercase text-sm mb-4">Open House</p>
        <p className="font-black text-slate-900 leading-tight text-5xl">{address}</p>
        <h2 className="font-black text-slate-900 leading-tight text-4xl mt-6">We&apos;d love your anonymous feedback</h2>
        <p className="text-slate-600 mx-auto text-xl mt-5 max-w-lg">
          Scan this code to share your thoughts. No name required — it takes about 30 seconds.
        </p>
        <img src={qrDataUrl} alt="" className="mx-auto bg-white w-52 h-52 mt-8" />
      </div>
    </div>
  )
}

function EstateSign({ address, qrDataUrl, layout }: { address: string; qrDataUrl: string; layout: SignLayout }) {
  if (layout === 'tent') {
    return (
      <div className="h-full p-5">
        <div className="h-full border-[3px] border-[#c4a574] p-2">
          <div className="h-full border border-[#1a1612]">
            <TentRow qrDataUrl={qrDataUrl} frameClass="border border-[#c4a574] bg-white p-2">
              <p className="tracking-[0.4em] uppercase text-[#c4a574] text-[11px]">Open House</p>
              <p className="text-3xl leading-tight mt-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>{address}</p>
              <p className="italic text-xl text-[#4a433c] mt-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Please leave a private note for the seller.</p>
              <p className="text-base mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Scan here. No name required.</p>
            </TentRow>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="h-full p-[0.45in]">
      <div className="h-full border-[3px] border-[#c4a574] p-2.5">
        <div className="h-full border border-[#1a1612] flex items-center justify-center px-10 py-8">
          <div className="text-center text-[#1a1612]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            <p className="tracking-[0.45em] uppercase text-[#c4a574] text-xs">Open House</p>
            <div className="mx-auto bg-[#c4a574] w-16 h-px mt-5 mb-6" />
            <p className="leading-tight text-5xl" style={{ fontWeight: 600 }}>{address}</p>
            <p className="italic text-[#4a433c] text-3xl mt-6">A private note for the seller</p>
            <p className="mx-auto text-lg mt-4 max-w-md" style={{ fontFamily: 'Inter, sans-serif' }}>
              We really want your anonymous thoughts. Scan to share — no name required.
            </p>
            <div className="mx-auto border border-[#c4a574] bg-white p-3 mt-8 w-56">
              <img src={qrDataUrl} alt="" className="w-full h-auto bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PosterSign({ address, qrDataUrl, layout }: { address: string; qrDataUrl: string; layout: SignLayout }) {
  if (layout === 'tent') {
    return (
      <TentRow qrDataUrl={qrDataUrl} frameClass="bg-black p-2">
        <p className="leading-none text-4xl" style={{ fontFamily: "'Bungee', sans-serif" }}>GOT 30 SECONDS?</p>
        <p className="mt-3 font-black text-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>{address}</p>
        <p className="mt-3 text-xl" style={{ fontFamily: "'Bungee', sans-serif" }}>NO NAME. WE WANT YOUR HONEST TAKE.</p>
      </TentRow>
    )
  }
  return (
    <div className="h-full flex items-center justify-center text-black p-[0.65in]" style={{ fontFamily: "'Bungee', sans-serif" }}>
      <div className="text-center">
        <p className="leading-none text-6xl">GOT 30 SECONDS?</p>
        <p className="mt-3 font-sans font-black tracking-tight text-3xl" style={{ fontFamily: 'Inter, sans-serif' }}>{address}</p>
        <div className="mx-auto bg-black p-3 mt-8">
          <img src={qrDataUrl} alt="" className="bg-white w-52 h-52" />
        </div>
        <p className="mt-4 leading-snug text-2xl">NO NAME. HONEST THOUGHTS.</p>
      </div>
    </div>
  )
}

function StudioSign({ address, qrDataUrl, layout }: { address: string; qrDataUrl: string; layout: SignLayout }) {
  if (layout === 'tent') {
    return (
      <TentRow qrDataUrl={qrDataUrl}>
        <div className="border-l-8 border-black pl-5">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-slate-400">Open house</p>
          <p className="text-3xl font-black leading-tight mt-2">{address}</p>
          <p className="text-2xl font-black mt-3 leading-snug">We really want your anonymous feedback.</p>
          <p className="text-lg text-slate-600 mt-2">Scan this code. No name, no clipboard.</p>
        </div>
      </TentRow>
    )
  }
  return (
    <div className="h-full flex items-stretch p-[0.7in]">
      <div className="flex-1 border-l-[10px] border-black pl-8 pr-6 flex flex-col justify-center">
        <p className="text-xs font-bold tracking-[0.4em] uppercase text-slate-400">Open house</p>
        <p className="text-5xl font-black leading-[1.05] mt-5">{address}</p>
        <p className="text-3xl font-black mt-8 leading-snug">We really want your anonymous feedback.</p>
        <p className="text-xl text-slate-600 mt-4 max-w-md leading-relaxed">
          Scan this code and tell us what you thought. No name, no phone, no clipboard.
        </p>
      </div>
      <div className="w-[3.2in] flex flex-col items-center justify-center">
        <img src={qrDataUrl} alt="" className="w-56 h-56 bg-white" />
        <p className="text-sm font-black uppercase tracking-widest text-slate-500 mt-4">Scan here</p>
      </div>
    </div>
  )
}

function NightSign({ address, qrDataUrl, layout }: { address: string; qrDataUrl: string; layout: SignLayout }) {
  if (layout === 'tent') {
    return (
      <div className="h-full p-5 text-white">
        <div className="h-full border border-white/25">
          <TentRow qrDataUrl={qrDataUrl} frameClass="bg-white p-2">
            <p className="tracking-[0.4em] uppercase text-white/60 text-xs">Open house</p>
            <p className="text-3xl leading-tight mt-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{address}</p>
            <p className="text-2xl font-black mt-3 leading-snug">We really want your anonymous feedback.</p>
            <p className="text-lg text-white/75 mt-2">Scan this code. No name required.</p>
          </TentRow>
        </div>
      </div>
    )
  }
  return (
    <div className="h-full text-white p-[0.55in]">
      <div className="h-full border border-white/25 flex flex-col items-center justify-center text-center px-12 py-10">
        <p className="tracking-[0.5em] uppercase text-white/60 text-sm">Open house</p>
        <p className="leading-tight mt-5 text-5xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{address}</p>
        <p className="font-black text-3xl mt-8 leading-snug">We really want your anonymous feedback.</p>
        <p className="text-xl text-white/75 mt-3 max-w-md">Scan this code and tell us what you thought. No name required.</p>
        <div className="bg-white p-4 mt-8">
          <img src={qrDataUrl} alt="" className="w-48 h-48" />
        </div>
      </div>
    </div>
  )
}

function CoralSign({ address, qrDataUrl, layout }: { address: string; qrDataUrl: string; layout: SignLayout }) {
  if (layout === 'tent') {
    return (
      <TentRow qrDataUrl={qrDataUrl} frameClass="bg-white p-2 rounded-2xl">
        <p className="text-white/80 text-xs font-bold tracking-[0.3em] uppercase">Open house</p>
        <p className="text-white font-black text-3xl leading-tight mt-2">{address}</p>
        <p className="text-white font-black text-2xl mt-3 leading-snug">Please tell us what you think.</p>
        <p className="text-white/90 text-lg mt-2">Anonymous. About 30 seconds. We read every note.</p>
      </TentRow>
    )
  }
  return (
    <div className="h-full text-white flex items-center justify-center p-[0.7in]">
      <div className="text-center max-w-[6.5in]">
        <p className="text-white/80 text-sm font-bold tracking-[0.35em] uppercase">Open house</p>
        <p className="font-black text-5xl leading-tight mt-4">{address}</p>
        <p className="font-black text-4xl mt-8 leading-snug">Please tell us what you think.</p>
        <p className="text-xl text-white/90 mt-4">Anonymous. About 30 seconds. We read every note.</p>
        <div className="bg-white inline-block rounded-3xl p-4 mt-8">
          <img src={qrDataUrl} alt="" className="w-52 h-52" />
        </div>
      </div>
    </div>
  )
}

function NewsSign({ address, qrDataUrl, layout }: { address: string; qrDataUrl: string; layout: SignLayout }) {
  if (layout === 'tent') {
    return (
      <TentRow qrDataUrl={qrDataUrl} frameClass="border-2 border-black p-1">
        <p className="text-center font-black tracking-[0.2em] uppercase text-sm border-y-2 border-black py-1">The Open House Times</p>
        <p className="font-black text-3xl leading-tight mt-3">{address}</p>
        <p className="text-2xl font-black mt-3 leading-snug">We want your anonymous review.</p>
        <p className="text-lg mt-2">Scan the code. No name. Extra, extra.</p>
      </TentRow>
    )
  }
  return (
    <div className="h-full p-[0.55in] text-black">
      <div className="h-full border-4 border-black p-8 flex flex-col">
        <p className="text-center font-black tracking-[0.25em] uppercase text-sm">The Open House Times</p>
        <div className="border-y-4 border-black my-4 py-3 text-center">
          <p className="text-5xl font-black leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{address}</p>
        </div>
        <div className="flex-1 flex items-center gap-10">
          <div className="flex-1">
            <p className="text-4xl font-black leading-snug">We want your anonymous review.</p>
            <p className="text-xl mt-4 leading-relaxed">Scan this code and tell us what you thought of the home. No name, no phone — just honest notes for the seller.</p>
          </div>
          <div className="shrink-0 border-2 border-black p-2">
            <img src={qrDataUrl} alt="" className="w-52 h-52 bg-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SageSign({ address, qrDataUrl, layout }: { address: string; qrDataUrl: string; layout: SignLayout }) {
  if (layout === 'tent') {
    return (
      <TentRow qrDataUrl={qrDataUrl} frameClass="bg-white p-2 rounded-full">
        <p className="text-[#2f5d45] text-xs font-bold tracking-[0.3em] uppercase">Open house</p>
        <p className="text-[#1f3d2e] font-black text-3xl leading-tight mt-2">{address}</p>
        <p className="text-[#1f3d2e] font-black text-2xl mt-3 leading-snug">Your anonymous thoughts help this home.</p>
        <p className="text-[#2f5d45] text-lg mt-2">Scan here. No name needed.</p>
      </TentRow>
    )
  }
  return (
    <div className="h-full flex items-center justify-center p-[0.7in] text-[#1f3d2e]">
      <div className="text-center max-w-[6.4in]">
        <p className="text-sm font-bold tracking-[0.35em] uppercase text-[#2f5d45]">Open house</p>
        <p className="font-black text-5xl leading-tight mt-4">{address}</p>
        <p className="font-black text-3xl mt-8 leading-snug">Your anonymous thoughts help this home.</p>
        <p className="text-xl mt-4 text-[#2f5d45]">Scan the code. No name needed. About 30 seconds.</p>
        <div className="inline-block bg-white rounded-full p-5 mt-8">
          <img src={qrDataUrl} alt="" className="w-48 h-48" />
        </div>
      </div>
    </div>
  )
}

function NavySign({ address, qrDataUrl, layout }: { address: string; qrDataUrl: string; layout: SignLayout }) {
  if (layout === 'tent') {
    return (
      <TentRow qrDataUrl={qrDataUrl} frameClass="bg-white p-2">
        <p className="text-sky-300 text-xs font-bold tracking-[0.35em] uppercase">Open house</p>
        <p className="text-white font-black text-3xl leading-tight mt-2">{address}</p>
        <p className="text-white font-black text-2xl mt-3 leading-snug">Scan to leave anonymous feedback.</p>
        <p className="text-sky-200 text-lg mt-2">We really want your honest thoughts.</p>
      </TentRow>
    )
  }
  return (
    <div className="h-full text-white flex items-center justify-center p-[0.7in]">
      <div className="text-center max-w-[6.5in]">
        <p className="text-sky-300 text-sm font-bold tracking-[0.4em] uppercase">Open house</p>
        <p className="font-black text-5xl leading-tight mt-5">{address}</p>
        <div className="w-20 h-px bg-sky-400 mx-auto my-8" />
        <p className="font-black text-3xl leading-snug">Scan to leave anonymous feedback.</p>
        <p className="text-xl text-sky-100 mt-4">We really want your honest thoughts. No name required.</p>
        <div className="inline-block bg-white p-3 mt-8">
          <img src={qrDataUrl} alt="" className="w-52 h-52" />
        </div>
      </div>
    </div>
  )
}

function BurstSign({ address, qrDataUrl, layout }: { address: string; qrDataUrl: string; layout: SignLayout }) {
  if (layout === 'tent') {
    return (
      <TentRow qrDataUrl={qrDataUrl} frameClass="rounded-full bg-indigo-500 p-3">
        <p className="text-indigo-500 text-xs font-bold tracking-[0.3em] uppercase">Open house</p>
        <p className="font-black text-slate-900 text-3xl leading-tight mt-2">{address}</p>
        <p className="font-black text-indigo-600 text-2xl mt-3 leading-snug" style={{ fontFamily: "'Righteous', cursive" }}>Tell us what you thought!</p>
        <p className="text-lg text-slate-600 mt-2">Anonymous feedback. Scan the circle.</p>
      </TentRow>
    )
  }
  return (
    <div className="h-full flex flex-col items-center justify-center p-[0.6in] text-center">
      <p className="text-indigo-500 text-sm font-bold tracking-[0.35em] uppercase">Open house</p>
      <p className="font-black text-slate-900 text-4xl leading-tight mt-3">{address}</p>
      <p className="text-4xl text-indigo-600 mt-5 leading-snug" style={{ fontFamily: "'Righteous', cursive" }}>Tell us what you thought!</p>
      <div className="relative mt-8 w-80 h-80 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-indigo-500" />
        <div className="relative bg-white rounded-2xl p-3">
          <img src={qrDataUrl} alt="" className="w-48 h-48" />
        </div>
      </div>
      <p className="text-xl font-black text-slate-700 mt-6">Anonymous. No name. We really want your notes.</p>
    </div>
  )
}

import { SignPrintButtons } from '@/app/components/SignPrintButtons'
import type { ReactNode } from 'react'

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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-20">
      <style>{`
        @page { size: letter; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          html, body { background: white !important; margin: 0 !important; }
          .sign-sheet {
            width: 8.5in !important;
            height: 11in !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
            break-after: page;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sign-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      <div className="no-print max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-3">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase">Open House QR signs</p>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{listing}</h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Print all four pages. For tent cards, fold on the dotted line so the sign stands on a table.
            </p>
          </div>
          <SignPrintButtons filename={`${listing}-qr-signs`} />
        </div>
      </div>

      <div id="report-print-root" className="w-full space-y-8 print:space-y-0 overflow-x-auto">
        <SheetLabel>Page 1 · Full page</SheetLabel>
        <LetterSheet>
          <div className="h-full flex items-center justify-center p-[0.7in]">
            <FriendlySign address={listing} qrDataUrl={qrDataUrl} />
          </div>
        </LetterSheet>

        <SheetLabel>Page 2 · Tent card — fold on the dotted line</SheetLabel>
        <LetterSheet>
          <TentFrame>
            <div className="h-full flex items-center justify-center px-10 py-8 rotate-180">
              <FriendlySign address={listing} qrDataUrl={qrDataUrl} compact />
            </div>
            <div className="h-full flex items-center justify-center px-10 py-8">
              <FriendlySign address={listing} qrDataUrl={qrDataUrl} compact />
            </div>
          </TentFrame>
        </LetterSheet>

        <SheetLabel>Page 3 · Luxury full page</SheetLabel>
        <LetterSheet className="bg-[#f6f1e7]">
          <div className="h-full p-[0.45in]">
            <LuxuryFrame>
              <LuxurySign address={listing} qrDataUrl={qrDataUrl} />
            </LuxuryFrame>
          </div>
        </LetterSheet>

        <SheetLabel>Page 4 · Luxury tent card — fold on the dotted line</SheetLabel>
        <LetterSheet className="bg-[#f6f1e7]">
          <TentFrame luxury>
            <div className="h-full p-6 rotate-180">
              <LuxuryFrame compact>
                <LuxurySign address={listing} qrDataUrl={qrDataUrl} compact />
              </LuxuryFrame>
            </div>
            <div className="h-full p-6">
              <LuxuryFrame compact>
                <LuxurySign address={listing} qrDataUrl={qrDataUrl} compact />
              </LuxuryFrame>
            </div>
          </TentFrame>
        </LetterSheet>
      </div>
    </div>
  )
}

function SheetLabel({ children }: { children: ReactNode }) {
  return (
    <p className="no-print text-center text-xs font-bold uppercase tracking-widest text-slate-400 pt-2">
      {children}
    </p>
  )
}

function LetterSheet({ children, className = 'bg-white' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`sign-sheet relative mx-auto overflow-hidden shadow-xl print:shadow-none ${className}`}
      style={{ width: '8.5in', height: '11in' }}
    >
      {children}
    </div>
  )
}

function TentFrame({ children, luxury }: { children: ReactNode; luxury?: boolean }) {
  return (
    <div className="relative h-full grid grid-rows-2">
      {children}
      <div className="absolute left-[0.6in] right-[0.6in] top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none">
        <div className={`flex-1 border-t border-dotted ${luxury ? 'border-[#c4a574]' : 'border-slate-300'}`} />
        <span className={`text-[9px] font-bold tracking-[0.35em] ${luxury ? 'text-[#c4a574]' : 'text-slate-400'}`}>FOLD</span>
        <div className={`flex-1 border-t border-dotted ${luxury ? 'border-[#c4a574]' : 'border-slate-300'}`} />
      </div>
    </div>
  )
}

function FriendlySign({
  address,
  qrDataUrl,
  compact,
}: {
  address: string
  qrDataUrl: string
  compact?: boolean
}) {
  return (
    <div className="text-center max-w-[6.6in]">
      <p className={`font-bold tracking-[0.35em] text-indigo-500 uppercase ${compact ? 'text-[10px] mb-2' : 'text-sm mb-4'}`}>
        Open House
      </p>
      <p className={`font-black text-indigo-600 leading-tight ${compact ? 'text-2xl' : 'text-5xl'}`}>
        {address}
      </p>
      <h2 className={`font-black text-slate-900 leading-tight ${compact ? 'text-xl mt-3' : 'text-4xl mt-6'}`}>
        We&apos;d love your anonymous feedback
      </h2>
      <p className={`text-slate-600 mx-auto ${compact ? 'text-sm mt-2 max-w-sm' : 'text-xl mt-5 max-w-lg'}`}>
        Scan this code to share your thoughts. No name required — it takes about 30 seconds.
      </p>
      <img
        src={qrDataUrl}
        alt="Scan for anonymous feedback"
        className={`mx-auto bg-white ${compact ? 'w-28 h-28 mt-4' : 'w-52 h-52 mt-8'}`}
      />
    </div>
  )
}

function LuxuryFrame({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return (
    <div className={`h-full border-[3px] border-[#c4a574] ${compact ? 'p-2' : 'p-2.5'}`}>
      <div className={`h-full border border-[#1a1612] flex items-center justify-center ${compact ? 'px-5 py-4' : 'px-10 py-8'}`}>
        {children}
      </div>
    </div>
  )
}

function LuxurySign({
  address,
  qrDataUrl,
  compact,
}: {
  address: string
  qrDataUrl: string
  compact?: boolean
}) {
  return (
    <div className="text-center text-[#1a1612]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
      <p className={`tracking-[0.45em] uppercase text-[#c4a574] ${compact ? 'text-[9px]' : 'text-xs'}`}>
        Open House
      </p>
      <div className={`mx-auto bg-[#c4a574] ${compact ? 'w-10 h-px mt-3 mb-3' : 'w-16 h-px mt-5 mb-6'}`} />
      <p className={`leading-tight ${compact ? 'text-2xl' : 'text-5xl'}`} style={{ fontWeight: 600 }}>
        {address}
      </p>
      <p className={`italic text-[#4a433c] ${compact ? 'text-base mt-3' : 'text-3xl mt-6'}`}>
        A private note for the seller
      </p>
      <p className={`mx-auto font-sans ${compact ? 'text-xs mt-2 max-w-xs' : 'text-base mt-4 max-w-md'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
        Scan to share your thoughts. No name required.
      </p>
      <div className={`mx-auto border border-[#c4a574] bg-white ${compact ? 'p-2 mt-4 w-[7.5rem]' : 'p-3 mt-8 w-56'}`}>
        <img src={qrDataUrl} alt="Scan for anonymous feedback" className="w-full h-auto bg-white" />
      </div>
      <p className={`tracking-[0.28em] uppercase text-[#c4a574] ${compact ? 'text-[8px] mt-3' : 'text-[11px] mt-6'}`}>
        Anonymous · Thirty seconds
      </p>
    </div>
  )
}

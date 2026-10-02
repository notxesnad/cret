'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

type Path = 'pick' | 'seller' | 'buyer'

function toolHref(view: string, content: string, incoming: { get(name: string): string | null }) {
  const params = new URLSearchParams({
    view,
    utm_source: incoming.get('utm_source') || 'instagram',
    utm_medium: incoming.get('utm_medium') || 'ad',
    utm_campaign: incoming.get('utm_campaign') || 'go',
    utm_content: incoming.get('utm_content') || content,
  })
  return `/?${params.toString()}`
}

export function GoLanding() {
  const incoming = useSearchParams()
  const [path, setPath] = useState<Path>('pick')

  return (
    <div className="go-root min-h-[100dvh] bg-[#0f172a] text-white font-['Inter',sans-serif]">
      <style>{`
        .go-root { -webkit-tap-highlight-color: transparent; }
        .font-seller { font-family: 'Playfair Display', serif; font-style: italic; }
        .font-driving { font-family: 'Bungee', cursive; }
        .go-rise { animation: go-rise 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .go-pop { animation: go-pop 2.2s ease-in-out infinite; }
        .go-choice {
          animation:
            go-rise 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both,
            go-pop 2.2s ease-in-out 0.55s infinite;
        }
        .go-choice-late { animation-delay: 0.1s, 0.7s; }
        .go-phone { animation: go-float 4.5s ease-in-out infinite; }
        .go-bubble, .go-row, .go-stop { animation: go-in 0.45s ease both; }
        .go-row-1, .go-stop-1 { animation-delay: 0.12s; }
        .go-row-2, .go-stop-2 { animation-delay: 0.28s; }
        .go-row-3, .go-stop-3 { animation-delay: 0.44s; }
        @keyframes go-rise {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
        @keyframes go-pop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.025); }
        }
        @keyframes go-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes go-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .go-rise, .go-pop, .go-choice, .go-phone, .go-bubble, .go-row, .go-stop {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pt-safe">
        <header className="flex items-center justify-between py-4">
          <p className="text-[11px] font-black tracking-[0.18em] uppercase text-slate-500">
            Cool<span className="text-seller">RealEstate</span>Tools
          </p>
          {path !== 'pick' ? (
            <button
              type="button"
              onClick={() => setPath('pick')}
              className="text-sm font-bold text-slate-400"
            >
              Back
            </button>
          ) : (
            <span className="text-sm font-bold text-slate-500">30 seconds</span>
          )}
        </header>

        {path === 'pick' ? (
          <Pick onPick={setPath} />
        ) : path === 'seller' ? (
          <SellerBeat href={toolHref('sellertracker', 'seller', incoming)} />
        ) : (
          <BuyerBeat href={toolHref('driving', 'buyer', incoming)} />
        )}
      </div>
    </div>
  )
}

function Pick({ onPick }: { onPick: (path: Path) => void }) {
  return (
    <div className="flex flex-1 flex-col pb-safe">
      <div className="go-rise pt-6">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Tap one</p>
        <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight">
          Who are you working with?
        </h1>
      </div>
      <div className="mt-auto space-y-3 pb-4 pt-8">
        <button
          type="button"
          onClick={() => onPick('seller')}
          className="go-choice group w-full rounded-3xl bg-seller px-6 py-6 text-left text-slate-950 shadow-xl active:scale-[0.98]"
        >
          <span className="text-xs font-bold uppercase tracking-wider opacity-70">They only see the listing</span>
          <span className="font-seller mt-1 block text-4xl font-black leading-none">A seller</span>
        </button>
        <button
          type="button"
          onClick={() => onPick('buyer')}
          className="go-choice go-choice-late w-full rounded-3xl bg-rose-600 px-6 py-6 text-left text-white shadow-xl active:scale-[0.98]"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-rose-100">Houses to line up</span>
          <span className="font-driving mt-1 block text-3xl leading-none">A buyer</span>
        </button>
      </div>
    </div>
  )
}

function SellerBeat({ href }: { href: string }) {
  return (
    <div className="flex flex-1 flex-col pb-safe">
      <div className="go-rise">
        <h1 className="font-seller text-4xl font-black leading-none text-seller">Show them the work.</h1>
        <p className="mt-3 text-lg leading-snug text-slate-300">Before they text “any showings?”</p>
      </div>

      <div className="go-phone mx-auto mt-6 w-full max-w-[280px] rounded-[28px] border border-slate-700 bg-slate-900 p-4 shadow-2xl">
        <div className="go-bubble ml-auto mb-3 w-fit max-w-[85%] rounded-2xl rounded-br-md bg-slate-600 px-3 py-2 text-sm font-bold text-white">
          Any showings??
        </div>
        <div className="mt-3 rounded-2xl bg-white p-3 text-slate-950">
          <p className="text-[10px] font-bold uppercase tracking-widest text-seller-deep">Seller report</p>
          <p className="font-seller text-lg font-black leading-tight">555 Oak</p>
          <ul className="mt-2 space-y-1.5 text-sm font-bold">
            <li className="go-row go-row-1 flex items-center gap-2"><Check /> Photos done</li>
            <li className="go-row go-row-2 flex items-center gap-2"><Check /> Open house</li>
            <li className="go-row go-row-3 flex items-center gap-2"><Check /> Just listed cards</li>
          </ul>
        </div>
      </div>

      <div className="mt-auto pb-4 pt-6">
        <a
          href={href}
          className="go-pop block w-full rounded-2xl bg-seller py-4 text-center text-lg font-black text-slate-950 shadow-lg active:scale-[0.98]"
        >
          Make their report
        </a>
        <p className="mt-3 text-center text-sm font-bold text-slate-400">Takes a minute. Free to try.</p>
      </div>
    </div>
  )
}

function BuyerBeat({ href }: { href: string }) {
  const stops = [
    { time: '9:00', address: '123 Oak', delay: 'go-stop-1' },
    { time: '9:40', address: '88 Pine', delay: 'go-stop-2' },
    { time: '10:20', address: '14 Harbor', delay: 'go-stop-3' },
  ]
  return (
    <div className="flex flex-1 flex-col pb-safe">
      <div className="go-rise">
        <h1 className="font-driving text-[1.65rem] leading-tight text-rose-400">One text. The whole tour.</h1>
        <p className="mt-3 text-lg leading-snug text-slate-300">Stops and times. One link. No group text.</p>
      </div>

      <div className="relative mx-auto mt-6 w-full max-w-[280px] rounded-[28px] border border-slate-700 bg-slate-900 p-4 shadow-2xl">
        <div className="absolute bottom-5 left-[22px] top-5 w-0.5 bg-rose-500/50" />
        <ul className="relative space-y-3">
          {stops.map((stop) => (
            <li key={stop.address} className={`go-stop ${stop.delay} flex items-center gap-3`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />
              <span className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2 text-slate-950">
                <span className="block text-[10px] font-black uppercase tracking-widest text-rose-600">{stop.time}</span>
                <span className="block text-base font-black leading-tight">{stop.address}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pb-4 pt-6">
        <a
          href={href}
          className="go-pop block w-full rounded-2xl bg-rose-600 py-4 text-center text-lg font-black text-white shadow-lg active:scale-[0.98]"
        >
          Build the itinerary
        </a>
        <p className="mt-3 text-center text-sm font-bold text-slate-400">Takes a minute. Free to try.</p>
      </div>
    </div>
  )
}

function Check() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-seller text-[11px] text-slate-950">✓</span>
  )
}

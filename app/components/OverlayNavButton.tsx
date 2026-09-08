'use client'

import type { ReactNode } from 'react'

export function OverlayNavButton({
  kind,
  label,
  onClick,
}: {
  kind: 'back' | 'close'
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-slate-400 hover:text-white transition flex items-center"
    >
      {kind === 'close' ? (
        <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
        </svg>
      )}
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </button>
  )
}

export function ToolOverlay({
  id,
  nav,
  children,
}: {
  id: string
  nav: ReactNode
  children: ReactNode
}) {
  return (
    <div id={id} className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50 flex flex-col">
      <div className="flex-none h-[72px] flex items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
        {nav}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar bg-slate-900 px-5 py-5 space-y-4">
        {children}
      </div>
    </div>
  )
}

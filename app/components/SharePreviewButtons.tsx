'use client'

import { useState, type ReactNode } from 'react'

export function SharePreviewButtons({
  url,
  copyLabel = 'Copy Link',
  accentClass = 'bg-indigo-500 hover:bg-indigo-400 text-white',
  onCopy,
  extra,
  onNeedAuth,
  beforeShare,
}: {
  url: string
  copyLabel?: string
  accentClass?: string
  onCopy: () => void
  extra?: ReactNode
  onNeedAuth?: () => void
  beforeShare?: () => Promise<boolean | void>
}) {
  const [busy, setBusy] = useState(false)

  const runShare = async (action: () => void) => {
    if (onNeedAuth) {
      onNeedAuth()
      return
    }
    if (beforeShare) {
      setBusy(true)
      const ok = await beforeShare()
      setBusy(false)
      if (ok === false) return
    }
    action()
  }

  const enabled = Boolean(onNeedAuth || url)

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => void runShare(() => { if (url) window.open(url, '_blank', 'noopener,noreferrer') })}
          disabled={!enabled || busy}
          className="flex-1 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-black py-4 rounded-xl transition shadow text-sm"
        >
          {busy ? 'Saving...' : 'Preview'}
        </button>
        <button
          type="button"
          onClick={() => void runShare(onCopy)}
          disabled={!enabled || busy}
          className={`flex-[2] disabled:opacity-50 font-black py-4 rounded-xl transition shadow text-sm ${accentClass}`}
        >
          {busy ? 'Saving...' : copyLabel}
        </button>
      </div>
      {extra}
    </div>
  )
}

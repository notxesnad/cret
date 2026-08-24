'use client'

import type { ReactNode } from 'react'

export function SharePreviewButtons({
  url,
  copyLabel = 'Copy Link',
  accentClass = 'bg-indigo-500 hover:bg-indigo-400 text-white',
  onCopy,
  extra,
  onNeedAuth,
}: {
  url: string
  copyLabel?: string
  accentClass?: string
  onCopy: () => void
  extra?: ReactNode
  onNeedAuth?: () => void
}) {
  const handlePreview = () => {
    if (onNeedAuth) {
      onNeedAuth()
      return
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = () => {
    if (onNeedAuth) {
      onNeedAuth()
      return
    }
    onCopy()
  }

  const enabled = Boolean(onNeedAuth || url)

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={!enabled}
          className="flex-1 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-black py-4 rounded-xl transition shadow text-sm"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!enabled}
          className={`flex-[2] disabled:opacity-50 font-black py-4 rounded-xl transition shadow text-sm ${accentClass}`}
        >
          {copyLabel}
        </button>
      </div>
      {extra}
    </div>
  )
}

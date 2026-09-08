'use client'

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

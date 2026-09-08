'use client'

import { ToolTile } from '@/app/components/ToolTile'

export function ToolLanding({
  kicker,
  kickerClass,
  title,
  titleClass,
  blurb,
  primaryLabel,
  primaryKicker = 'Start here',
  primaryEmoji,
  primaryClass,
  onPrimary,
  onHow,
  howClass,
}: {
  kicker: string
  kickerClass: string
  title: string
  titleClass?: string
  blurb: string
  primaryLabel: string
  primaryKicker?: string
  primaryEmoji: string
  primaryClass: string
  onPrimary: () => void
  onHow: () => void
  howClass: string
}) {
  return (
    <div className="animate-fade-in-up p-6">
      <div className="text-center mb-8">
        <span className={`text-xs font-bold tracking-widest uppercase block mb-2 ${kickerClass}`}>{kicker}</span>
        <h1 className={`text-3xl md:text-4xl text-white ${titleClass || 'font-black'}`}>{title}</h1>
        <p className="text-lg text-slate-300 mt-4 leading-relaxed">{blurb}</p>
      </div>
      <div className="space-y-4">
        <ToolTile onClick={onPrimary} className={primaryClass}>
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">{primaryEmoji}</div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">{primaryKicker}</span>
          <h2 className={`text-2xl md:text-3xl mt-1 ${titleClass || 'font-black'}`}>{primaryLabel}</h2>
        </ToolTile>
        <ToolTile onClick={onHow} className={howClass}>
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:-rotate-6">💡</div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">A 30-second tour</span>
          <h2 className={`text-2xl md:text-3xl mt-1 ${titleClass || 'font-black'}`}>What does this thing do</h2>
        </ToolTile>
      </div>
    </div>
  )
}

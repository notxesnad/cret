'use client'

export type HowToPage = {
  emoji: string
  kicker: string
  title: string
  body: string
}

export type HowToAccent = 'indigo' | 'rose' | 'amber' | 'sky' | 'emerald'

const ACCENT = {
  indigo: {
    bar: 'bg-indigo-500',
    kicker: 'text-indigo-400',
    dot: 'bg-indigo-400',
    btn: 'bg-indigo-500 hover:bg-indigo-400 text-white',
  },
  rose: {
    bar: 'bg-rose-500',
    kicker: 'text-rose-400',
    dot: 'bg-rose-400',
    btn: 'bg-rose-500 hover:bg-rose-400 text-white',
  },
  amber: {
    bar: 'bg-amber-500',
    kicker: 'text-amber-400',
    dot: 'bg-amber-400',
    btn: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
  },
  sky: {
    bar: 'bg-sky-500',
    kicker: 'text-sky-400',
    dot: 'bg-sky-400',
    btn: 'bg-sky-500 hover:bg-sky-400 text-white',
  },
  emerald: {
    bar: 'bg-emerald-500',
    kicker: 'text-emerald-400',
    dot: 'bg-emerald-400',
    btn: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
  },
} as const

export function HowToTour({
  pages,
  page,
  onPageChange,
  onDone,
  doneLabel,
  accent = 'indigo',
  titleClass = 'font-black',
}: {
  pages: HowToPage[]
  page: number
  onPageChange: (page: number) => void
  onDone: () => void
  doneLabel: string
  accent?: HowToAccent
  titleClass?: string
}) {
  const current = pages[page]
  const last = page >= pages.length - 1
  const progress = ((page + 1) / pages.length) * 100
  const colors = ACCENT[accent]

  if (!current) return null

  return (
    <div className="flex flex-col h-full">
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${colors.bar}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div key={page} className="flex-1 flex flex-col justify-center text-center py-8 animate-fade-in-up">
        <p className={`text-[11px] font-bold tracking-[0.28em] uppercase ${colors.kicker}`}>{current.kicker}</p>
        <div className="text-6xl mt-6 mb-5 select-none" aria-hidden="true">{current.emoji}</div>
        <h2 className={`text-3xl md:text-4xl text-white leading-tight ${titleClass}`}>{current.title}</h2>
        <p className="text-base text-slate-300 mt-5 leading-relaxed max-w-sm mx-auto">{current.body}</p>
        <div className="flex justify-center gap-2 mt-8" aria-hidden="true">
          {pages.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === page ? `w-6 ${colors.dot}` : 'w-2 bg-slate-700'}`}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => last ? onDone() : onPageChange(page + 1)}
        className={`w-full font-black py-4 rounded-xl transition shadow active:scale-[0.98] ${colors.btn}`}
      >
        {last ? doneLabel : page === 0 ? "Let's go" : 'Next'}
      </button>
    </div>
  )
}

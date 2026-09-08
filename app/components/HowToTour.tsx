'use client'

export type HowToPage = {
  emoji: string
  kicker: string
  title: string
  body: string
}

export function HowToTour({
  pages,
  page,
  onPageChange,
  onDone,
  doneLabel,
}: {
  pages: HowToPage[]
  page: number
  onPageChange: (page: number) => void
  onDone: () => void
  doneLabel: string
}) {
  const current = pages[page]
  const last = page >= pages.length - 1
  const progress = ((page + 1) / pages.length) * 100

  if (!current) return null

  return (
    <div className="flex flex-col h-full">
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div key={page} className="flex-1 flex flex-col justify-center text-center py-8 animate-fade-in-up">
        <p className="text-[11px] font-bold tracking-[0.28em] text-indigo-400 uppercase">{current.kicker}</p>
        <div className="text-6xl mt-6 mb-5 select-none" aria-hidden="true">{current.emoji}</div>
        <h2 className="font-openhouse text-3xl md:text-4xl text-white leading-tight">{current.title}</h2>
        <p className="text-base text-slate-300 mt-5 leading-relaxed max-w-sm mx-auto">{current.body}</p>
        <div className="flex justify-center gap-2 mt-8" aria-hidden="true">
          {pages.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === page ? 'w-6 bg-indigo-400' : 'w-2 bg-slate-700'}`}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => last ? onDone() : onPageChange(page + 1)}
        className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 rounded-xl transition shadow active:scale-[0.98]"
      >
        {last ? doneLabel : page === 0 ? "Let's go" : 'Next'}
      </button>
    </div>
  )
}

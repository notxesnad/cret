'use client'

import type { QuizTheme } from '@/app/lib/quizTheme'

export function ClientThemeToggle({
  value,
  onChange,
}: {
  value: QuizTheme
  onChange: (theme: QuizTheme) => void
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Client view</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange('light')}
          className={`py-3 rounded-lg font-black text-sm transition ${
            value === 'light' ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => onChange('dark')}
          className={`py-3 rounded-lg font-black text-sm transition ${
            value === 'dark' ? 'bg-slate-950 text-white ring-1 ring-slate-600' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Dark
        </button>
      </div>
    </div>
  )
}

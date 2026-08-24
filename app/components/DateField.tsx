'use client'

function openPicker(input: HTMLInputElement) {
  try {
    input.showPicker()
  } catch {
    // Unsupported browsers still get the native date/time control
  }
}

const pickerInputClass =
  'relative w-full rounded-lg px-4 py-3 pr-10 text-base focus:outline-none [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0'

const accentFocus = {
  rose: 'focus:border-rose-500',
  amber: 'focus:border-amber-500',
} as const

export function DateField({
  value,
  onChange,
  placeholder,
  className = 'bg-slate-900 border-slate-700',
  accent = 'rose',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  accent?: keyof typeof accentFocus
}) {
  return (
    <div className="relative">
      {!value && placeholder && (
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-base text-slate-500">
          {placeholder}
        </span>
      )}
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        onClick={e => openPicker(e.currentTarget)}
        className={`${pickerInputClass} ${accentFocus[accent]} border ${className} ${value ? 'text-white' : 'text-transparent'}`}
      />
      <svg className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
      </svg>
    </div>
  )
}

export function TimeField({
  value,
  onChange,
  placeholder,
  className = 'bg-slate-800 border-slate-700',
  accent = 'rose',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  accent?: keyof typeof accentFocus
}) {
  return (
    <div className="relative">
      {!value && placeholder && (
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-base text-slate-500">
          {placeholder}
        </span>
      )}
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value.slice(0, 5))}
        onClick={e => openPicker(e.currentTarget)}
        className={`${pickerInputClass} ${accentFocus[accent]} border rounded-xl font-bold ${className} ${value ? 'text-white' : 'text-transparent'}`}
      />
      <svg className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </div>
  )
}

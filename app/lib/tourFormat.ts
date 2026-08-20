export function formatPrice(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const num = Number(digits)
  if (Number.isNaN(num)) return raw
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num)
}

export function toTimeInput(t: string): string {
  if (!t) return ''
  if (/^\d{2}:\d{2}/.test(t)) return t.slice(0, 5)
  const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return ''
  let hour = parseInt(match[1], 10)
  const min = match[2]
  const ampm = match[3].toUpperCase()
  if (ampm === 'PM' && hour !== 12) hour += 12
  if (ampm === 'AM' && hour === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${min}`
}

export function formatTimeDisplay(t: string): string {
  const hhmm = toTimeInput(t)
  if (!hhmm) return t
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export function toDateInput(d: string): string {
  if (!d) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  const parsed = new Date(d)
  if (Number.isNaN(parsed.getTime())) return ''
  const y = parsed.getFullYear()
  const m = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateDisplay(d: string): string {
  const iso = toDateInput(d)
  if (!iso) return d
  const [y, m, day] = iso.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function sortStopsByTime<T extends { time?: string }>(stops: T[]): T[] {
  return [...stops].sort((a, b) => {
    const ta = toTimeInput(a.time || '')
    const tb = toTimeInput(b.time || '')
    if (ta && tb) return ta.localeCompare(tb)
    if (ta) return -1
    if (tb) return 1
    return 0
  })
}

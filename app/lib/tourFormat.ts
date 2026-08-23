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

export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function timeToMinutes(t: string): number | null {
  const hhmm = toTimeInput(t)
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(total: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(total)))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function stopTimeConflicts<T extends { time?: string }>(stops: T[], index: number): boolean {
  const t = timeToMinutes(stops[index]?.time || '')
  if (t == null) return false
  for (let i = 0; i < index; i++) {
    const prev = timeToMinutes(stops[i].time || '')
    if (prev != null && prev > t) return true
  }
  for (let i = index + 1; i < stops.length; i++) {
    const next = timeToMinutes(stops[i].time || '')
    if (next != null && next < t) return true
  }
  return false
}

export function suggestedTimeForIndex<T extends { time?: string }>(stops: T[], index: number): string {
  let prev: number | null = null
  let next: number | null = null
  for (let i = index - 1; i >= 0; i--) {
    const t = timeToMinutes(stops[i].time || '')
    if (t != null) {
      prev = t
      break
    }
  }
  for (let i = index + 1; i < stops.length; i++) {
    const t = timeToMinutes(stops[i].time || '')
    if (t != null) {
      next = t
      break
    }
  }
  const round5 = (n: number) => Math.round(n / 5) * 5
  if (prev != null && next != null && next > prev) {
    return minutesToTime(round5((prev + next) / 2))
  }
  if (prev != null) return minutesToTime(prev + 15)
  if (next != null) return minutesToTime(Math.max(next - 15, 0))
  return '09:00'
}

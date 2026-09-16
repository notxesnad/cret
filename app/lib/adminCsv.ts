export const IMPORT_TEMPLATE_CSV = `Agent Name,Email,Phone Number,Brokerage,Listing Address,Date Listed
Jane Agent,jane@broker.com,555-0100,Acme Realty,123 Oak St,2026-09-16
`

export const IMPORT_ACTIVITY_LABELS = {
  inspection: '📋 Pre-Listing Inspection',
  mls: '🌐 Listed In the MLS',
  syndicated: '🚀 Syndicated to Zillow, Trulia, Realtor.com',
} as const

export type ParsedImportRow = {
  line: number
  name: string
  email: string
  phone: string
  brokerage: string
  address: string
  listedOn: string
}

export type ParsedImport = {
  rows: ParsedImportRow[]
  errors: { line: number; message: string }[]
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

const HEADER_ALIASES: Record<string, keyof Omit<ParsedImportRow, 'line'>> = {
  agentname: 'name',
  agent: 'name',
  name: 'name',
  fullname: 'name',
  email: 'email',
  emailaddress: 'email',
  phone: 'phone',
  phonenumber: 'phone',
  mobile: 'phone',
  cellphone: 'phone',
  brokerage: 'brokerage',
  company: 'brokerage',
  office: 'brokerage',
  broker: 'brokerage',
  listing: 'address',
  listingaddress: 'address',
  address: 'address',
  firstlisting: 'address',
  property: 'address',
  datelisted: 'listedOn',
  listed: 'listedOn',
  listdate: 'listedOn',
  listingdate: 'listedOn',
  date: 'listedOn',
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const src = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < src.length; i++) {
    const char = src[i]
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim()))
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function toIsoDate(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const us = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (us) {
    const month = Number(us[1])
    const day = Number(us[2])
    let year = Number(us[3])
    if (year < 100) year += year >= 70 ? 1900 : 2000
    const date = new Date(year, month - 1, day)
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return `${year}-${pad(month)}-${pad(day)}`
    }
  }
  if (/^\d{4,6}(\.\d+)?$/.test(trimmed)) {
    const serial = Number(trimmed)
    if (serial >= 20000 && serial <= 80000) {
      const utc = Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000
      const date = new Date(utc)
      return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
    }
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return ''
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`
}

export function addDaysIso(iso: string, days: number) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function normalizeAddress(address: string) {
  return address.trim().toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ')
}

export function starterActivities(listedOn: string) {
  const inspectionOn = addDaysIso(listedOn, -3)
  return [
    {
      id: crypto.randomUUID().replace(/-/g, '').slice(0, 10),
      label: IMPORT_ACTIVITY_LABELS.inspection,
      date: inspectionOn,
      status: 'completed' as const,
    },
    {
      id: crypto.randomUUID().replace(/-/g, '').slice(0, 10),
      label: IMPORT_ACTIVITY_LABELS.mls,
      date: listedOn,
      status: 'completed' as const,
    },
    {
      id: crypto.randomUUID().replace(/-/g, '').slice(0, 10),
      label: IMPORT_ACTIVITY_LABELS.syndicated,
      date: listedOn,
      status: 'completed' as const,
    },
  ]
}

export function parseImportCsv(text: string): ParsedImport {
  const table = parseCsv(text)
  const errors: ParsedImport['errors'] = []
  if (!table.length) return { rows: [], errors: [{ line: 1, message: 'The file is empty.' }] }

  const headers = table[0].map(normalizeHeader)
  const index: Partial<Record<keyof Omit<ParsedImportRow, 'line'>, number>> = {}
  headers.forEach((header, i) => {
    const key = HEADER_ALIASES[header]
    if (key && index[key] == null) index[key] = i
  })

  const missing = (['name', 'email', 'address', 'listedOn'] as const).filter((key) => index[key] == null)
  if (missing.length) {
    return {
      rows: [],
      errors: [{
        line: 1,
        message: `Missing columns: ${missing.join(', ')}. Use Agent Name, Email, Phone Number, Brokerage, Listing Address, Date Listed.`,
      }],
    }
  }

  const cell = (row: string[], key: keyof Omit<ParsedImportRow, 'line'>) => {
    const at = index[key]
    return at == null ? '' : (row[at] || '').trim()
  }

  const rows: ParsedImportRow[] = []
  table.slice(1).forEach((raw, offset) => {
    const line = offset + 2
    const email = cell(raw, 'email').toLowerCase()
    const name = cell(raw, 'name')
    const address = cell(raw, 'address')
    const listedOn = toIsoDate(cell(raw, 'listedOn'))
    if (!name) {
      errors.push({ line, message: 'Missing agent name.' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ line, message: 'Missing or invalid email.' })
      return
    }
    if (!address) {
      errors.push({ line, message: 'Missing listing address.' })
      return
    }
    if (!listedOn) {
      errors.push({ line, message: 'Missing or invalid date listed.' })
      return
    }
    rows.push({
      line,
      name,
      email,
      phone: cell(raw, 'phone'),
      brokerage: cell(raw, 'brokerage'),
      address,
      listedOn,
    })
  })

  return { rows, errors }
}

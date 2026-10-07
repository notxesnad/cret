export const MAIL_MAX_RECIPIENTS = 40

export type MailKind = 'postcard' | 'letter'

export type MailAddress = {
  name: string
  line1: string
  line2: string
  city: string
  state: string
  zip: string
}

export function emptyAddress(): MailAddress {
  return { name: '', line1: '', line2: '', city: '', state: '', zip: '' }
}

export function addressReady(address: MailAddress) {
  return !addressError(address)
}

export function addressError(address: MailAddress) {
  if (!address.name.trim()) return 'Add a name.'
  if (address.name.trim().length > 40) return 'Name has to be 40 characters or less.'
  if (!address.line1.trim()) return 'Add a street address.'
  if (address.line1.trim().length > 64 || address.line2.trim().length > 64) return 'Street lines have to be 64 characters or less.'
  if (!address.city.trim()) return 'Add a city.'
  if (!/^[A-Za-z]{2}$/.test(address.state.trim())) return 'Use a 2-letter state.'
  if (!/^\d{5}(-\d{4})?$/.test(address.zip.trim())) return 'Use a 5-digit ZIP.'
  return ''
}

export function parseAddressList(text: string) {
  const recipients: MailAddress[] = []
  const problems: string[] = []
  const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean)
  lines.forEach((line, index) => {
    const parts = line.split(/[,\t]/).map((part) => part.trim()).filter(Boolean)
    let address: MailAddress | null = null
    if (parts.length >= 5) {
      address = {
        name: parts[0],
        line1: parts[1],
        line2: '',
        city: parts[2],
        state: parts[3],
        zip: parts.slice(4).join(' '),
      }
    } else if (parts.length === 4) {
      const stateZip = parts[3].match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/)
      if (stateZip) {
        address = {
          name: parts[0],
          line1: parts[1],
          line2: '',
          city: parts[2],
          state: stateZip[1],
          zip: stateZip[2],
        }
      }
    }
    if (!address) {
      problems.push(`Line ${index + 1} needs name, street, city, state, ZIP.`)
      return
    }
    const problem = addressError(address)
    if (problem) problems.push(`Line ${index + 1}: ${problem}`)
    else recipients.push(normalizeAddress(address))
  })
  return { recipients, problems }
}

export function normalizeAddress(address: MailAddress): MailAddress {
  return {
    name: address.name.trim(),
    line1: address.line1.trim(),
    line2: address.line2.trim(),
    city: address.city.trim(),
    state: address.state.trim().toUpperCase(),
    zip: address.zip.trim(),
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function postcardHtml(input: { headline: string; message: string; fromName: string }) {
  const headline = escapeHtml(input.headline.trim() || 'A note for you')
  const message = escapeHtml(input.message.trim())
  const fromName = escapeHtml(input.fromName.trim())
  const front = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { width: 6.25in; height: 4.25in; margin: 0; background: #0f172a; color: #f8fafc; font-family: Georgia, serif; }
    .safe { position: absolute; left: 0.2in; top: 0.2in; width: 5.85in; height: 3.85in; padding: 0.35in; }
    h1 { margin: 0; font-size: 42px; line-height: 0.95; }
    .from { position: absolute; left: 0.35in; bottom: 0.3in; font-family: Helvetica, Arial, sans-serif; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #d6f25c; }
  </style></head><body><div class="safe"><h1>${headline}</h1></div><div class="from">${fromName}</div></body></html>`
  const back = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { width: 6.25in; height: 4.25in; margin: 0; background: #ffffff; color: #0f172a; font-family: Georgia, serif; }
    .note { position: absolute; left: 0.35in; top: 0.35in; width: 3.15in; height: 3.5in; font-size: 15px; line-height: 1.35; white-space: pre-wrap; }
  </style></head><body><div class="note">${message}</div></body></html>`
  return { front, back }
}

export function letterHtml(input: { message: string; fromName: string }) {
  const message = escapeHtml(input.message.trim())
  const fromName = escapeHtml(input.fromName.trim())
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { margin: 0; color: #111; font-family: Georgia, serif; }
    .sheet { width: 8.5in; padding: 2.9in 0.85in 0.8in; font-size: 12pt; line-height: 1.5; white-space: pre-wrap; }
    .sign { margin-top: 1.2em; }
  </style></head><body><div class="sheet">${message}<div class="sign">${fromName}</div></div></body></html>`
}

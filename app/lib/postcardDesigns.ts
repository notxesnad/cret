import type { MailAddress } from '@/app/lib/lobMail'

export const POSTCARD_PRICE_CENTS = 100
export const POSTCARD_MAX = 20

export const POSTCARD_TEMPLATES: {
  id: string
  name: string
  line: string
  bg: string
  ink: string
  accent: string
}[] = [
  { id: 'just-listed', name: 'Just Listed', line: '123 Oak Street', bg: '#0f172a', ink: '#f8fafc', accent: '#f5e27a' },
  { id: 'open-house', name: 'Open House', line: 'Saturday, 1 to 3', bg: '#312e81', ink: '#eef2ff', accent: '#ffffff' },
  { id: 'price-reduced', name: 'Price Reduced', line: '123 Oak Street', bg: '#9f1239', ink: '#fff1f2', accent: '#ffe4e6' },
  { id: 'just-sold', name: 'Just Sold', line: '123 Oak Street', bg: '#064e3b', ink: '#ecfdf5', accent: '#6ee7b7' },
  { id: 'coming-soon', name: 'Coming Soon', line: '123 Oak Street', bg: '#1e293b', ink: '#f8fafc', accent: '#93c5fd' },
  { id: 'under-contract', name: 'Under Contract', line: '123 Oak Street', bg: '#78350f', ink: '#fffbeb', accent: '#fcd34d' },
  { id: 'thank-you', name: 'Thank You', line: 'It was great meeting you', bg: '#3f3f46', ink: '#fafafa', accent: '#e4e4e7' },
  { id: 'nows-the-time', name: "Now's the Time", line: 'Thinking of selling?', bg: '#134e4a', ink: '#f0fdfa', accent: '#5eead4' },
  { id: 'i-sold-this', name: 'I Sold This', line: '123 Oak Street', bg: '#111827', ink: '#f9fafb', accent: '#fb7185' },
  { id: 'lets-talk', name: "Let's Talk", line: 'About your home', bg: '#172554', ink: '#eff6ff', accent: '#93c5fd' },
]

export type PostcardProof = { name: string; url: string; thumb: string }

export type PostcardOrder = {
  id: string
  profileId: string
  from: MailAddress
  recipients: MailAddress[]
  templateId: string | null
  frontUrl: string | null
  backUrl: string | null
  headshotUrl: string | null
  line: string
  status: 'unpaid' | 'sent'
  proofs: PostcardProof[]
  lobIds: string[]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pageCss(extra: string) {
  return `* { box-sizing: border-box; } body { width: 9.25in; height: 6.25in; margin: 0; padding: 0; ${extra} }`
}

export function postcardFrontHtml(input: { templateId: string; line: string; frontUrl?: string }) {
  if (input.frontUrl) {
    const url = escapeHtml(input.frontUrl)
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      ${pageCss('background: #111;')}
      img { position: absolute; left: 0; top: 0; width: 9.25in; height: 6.25in; object-fit: cover; }
    </style></head><body><img src="${url}" alt=""></body></html>`
  }
  const template = POSTCARD_TEMPLATES.find((item) => item.id === input.templateId) || POSTCARD_TEMPLATES[0]
  const line = escapeHtml(input.line.trim() || template.line)
  const name = escapeHtml(template.name)
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${pageCss(`background: ${template.bg}; color: ${template.ink}; font-family: Helvetica, Arial, sans-serif;`)}
    .safe { position: absolute; left: 0.35in; top: 0.4in; width: 8.55in; height: 5.45in; }
    h1 { margin: 0; font-size: 78px; line-height: 0.9; letter-spacing: -1px; }
    p { margin: 0.35in 0 0; font-size: 32px; line-height: 1.15; color: ${template.accent}; }
  </style></head><body><div class="safe"><h1>${name}</h1><p>${line}</p></div></body></html>`
}

export function postcardBackHtml(input: { line: string; fromName: string; backUrl?: string; headshotUrl?: string }) {
  const line = escapeHtml(input.line.trim())
  const fromName = escapeHtml(input.fromName.trim())
  const backUrl = input.backUrl ? escapeHtml(input.backUrl) : ''
  const headshotUrl = input.headshotUrl ? escapeHtml(input.headshotUrl) : ''
  const photo = backUrl ? `<img class="bleed" src="${backUrl}" alt="">` : ''
  const head = headshotUrl ? `<img class="head" src="${headshotUrl}" alt="">` : ''
  const note = backUrl
    ? ''
    : `<div class="note">${line ? `<div>${line}</div>` : ''}<div class="from">${fromName}</div></div>`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${pageCss('background: #ffffff; color: #111; font-family: Helvetica, Arial, sans-serif;')}
    img.bleed { position: absolute; left: 0; top: 0; width: 9.25in; height: 6.25in; object-fit: cover; }
    img.head { position: absolute; left: 0.45in; bottom: 0.4in; width: 1.6in; height: 1.6in; object-fit: cover; border-radius: 50%; border: 4px solid #fff; }
    .note { position: absolute; left: 0.45in; top: 0.5in; width: 4in; font-size: 22px; line-height: 1.35; }
    .from { margin-top: 0.35in; font-size: 16px; font-weight: 700; }
  </style></head><body>${photo}${head}${note}</body></html>`
}

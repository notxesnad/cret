import type { MailAddress } from '@/app/lib/lobMail'

export const POSTCARD_PRICE_CENTS = 100
export const POSTCARD_MAX = 20

export const POSTCARD_BAR_COLORS = [
  { id: 'black', label: 'Black', hex: '#111111' },
  { id: 'navy', label: 'Navy', hex: '#1b2a4a' },
  { id: 'green', label: 'Green', hex: '#1f4d3a' },
  { id: 'red', label: 'Red', hex: '#8f2d2d' },
  { id: 'blue', label: 'Blue', hex: '#1e4d8c' },
  { id: 'brown', label: 'Brown', hex: '#6b4f2a' },
]

export const POSTCARD_HEADLINES = [
  'Just Sold',
  'New Listing',
  'Just Listed',
  'Open House',
  'Coming Soon',
  'Price Reduced',
]

export function postcardColor(value: string, fallback: string) {
  const match = POSTCARD_BAR_COLORS.find((item) => item.hex === value.toLowerCase())
  return match ? match.hex : fallback
}

export type ListingPostcard = {
  photoUrl: string
  headline: string
  propertyAddress: string
  detail: string
  agentName: string
  brokerage: string
  barColor: string
  backColor: string
  message: string
  phone: string
  website: string
  title: string
  license: string
  headshotUrl: string
  logoUrl: string
  useHeadshot: boolean
  useLogo: boolean
}

export function emptyListingPostcard(): ListingPostcard {
  return {
    photoUrl: '',
    headline: 'Just Sold',
    propertyAddress: '',
    detail: '',
    agentName: '',
    brokerage: '',
    barColor: '#111111',
    backColor: '#1b2a4a',
    message: '',
    phone: '',
    website: '',
    title: 'Real Estate Agent',
    license: '',
    headshotUrl: '',
    logoUrl: '',
    useHeadshot: false,
    useLogo: false,
  }
}

export function listingPostcardReady(input: ListingPostcard) {
  if (!input.photoUrl) return 'Add the house photo.'
  if (!input.headline.trim()) return 'Add the words for the top bar.'
  if (!input.propertyAddress.trim()) return 'Add the property address.'
  if (!input.agentName.trim()) return 'Add your name.'
  if (!input.message.trim()) return 'Write a short note for the back.'
  if (!input.phone.trim()) return 'Add a phone number.'
  return ''
}

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
  design?: ListingPostcard | null
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

function displaySite(value: string) {
  return value.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

export function listingFrontHtml(input: ListingPostcard) {
  const bar = postcardColor(input.barColor, '#111111')
  const photo = escapeHtml(input.photoUrl)
  const headline = escapeHtml(input.headline.trim() || 'Just Sold')
  const address = escapeHtml(input.propertyAddress.trim())
  const detail = escapeHtml(input.detail.trim())
  const agent = escapeHtml(input.agentName.trim())
  const brokerage = escapeHtml(input.brokerage.trim())
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { width: 9.25in; height: 6.25in; margin: 0; position: relative; overflow: hidden; background: #111; }
    img.photo { position: absolute; left: 0; top: 0; width: 9.25in; height: 6.25in; object-fit: cover; }
    .banner {
      position: absolute; left: 0.42in; top: 0.36in; max-width: 7.2in;
      background: ${bar}; color: #fff;
      font-family: "Times New Roman", Times, serif;
      font-size: 40px; line-height: 1; letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.16in 0.3in 0.18in;
    }
    .bar { position: absolute; left: 0; right: 0; bottom: 0; height: 1.15in; background: ${bar}; color: #fff; font-family: Helvetica, Arial, sans-serif; }
    table { width: 8.45in; margin: 0.14in 0.4in 0.26in; border-collapse: collapse; }
    td { vertical-align: middle; }
    .right { text-align: right; }
    .addr, .name { font-size: 16px; font-weight: 700; }
    .sub, .broker { font-size: 13px; margin-top: 3px; }
  </style></head><body>
    <img class="photo" src="${photo}" alt="">
    <div class="banner">${headline}</div>
    <div class="bar"><table><tr>
      <td>
        <div class="addr">${address}</div>
        ${detail ? `<div class="sub">${detail}</div>` : ''}
      </td>
      <td class="right">
        <div class="name">${agent}</div>
        ${brokerage ? `<div class="broker">${brokerage}</div>` : ''}
      </td>
    </tr></table></div>
  </body></html>`
}

export function listingBackHtml(input: ListingPostcard) {
  const back = postcardColor(input.backColor, '#1b2a4a')
  const message = escapeHtml(input.message.trim())
  const phone = escapeHtml(input.phone.trim())
  const website = escapeHtml(displaySite(input.website))
  const agent = escapeHtml(input.agentName.trim())
  const brokerage = escapeHtml(input.brokerage.trim())
  const title = escapeHtml(input.title.trim())
  const license = escapeHtml(input.license.trim())
  const role = [title, brokerage].filter(Boolean).join(', ')
  const reach = [phone, website].filter(Boolean).join(' | ')
  const headshot = input.useHeadshot && input.headshotUrl ? escapeHtml(input.headshotUrl) : ''
  const logo = input.useLogo && input.logoUrl ? escapeHtml(input.logoUrl) : ''
  const contact = [
    phone ? `Call or text me at ${phone}` : '',
    website ? `Visit ${website}` : '',
  ].filter(Boolean)
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { width: 9.25in; height: 6.25in; margin: 0; position: relative; overflow: hidden; background: ${back}; color: #fff; font-family: Helvetica, Arial, sans-serif; }
    .clear { position: absolute; right: 0; bottom: 0; width: 4.35in; height: 2.65in; background: #fff; }
    .msg { position: absolute; left: 0.4in; top: 0.42in; width: 4.15in; max-height: 2.15in; overflow: hidden; font-size: 13px; line-height: 1.45; white-space: pre-wrap; }
    .contact { position: absolute; left: 0.4in; top: 3.15in; width: 3.9in; border: 1px solid rgba(255,255,255,0.9); padding: 0.12in 0.16in; font-size: 12px; line-height: 1.45; }
    .logo { position: absolute; left: 0.4in; bottom: 0.32in; max-width: 1.5in; max-height: 0.48in; }
    .card { position: absolute; left: 4.95in; top: 1.48in; width: ${headshot ? '3.35in' : '4.05in'}; height: 2.2in; background: #fff; color: #1a1a1a; padding: 0.18in ${headshot ? '0.85in' : '0.2in'} 0.14in 0.2in; overflow: hidden; }
    .nm { font-size: 18px; font-weight: 700; }
    .role, .lic, .reach { font-size: 11px; line-height: 1.35; margin-top: 0.06in; }
    .head { position: absolute; left: 7.55in; top: 1.7in; width: 1.45in; height: 1.45in; object-fit: cover; border-radius: 50%; border: 3px solid #fff; }
  </style></head><body>
    <div class="clear"></div>
    <div class="msg">${message}</div>
    ${contact.length ? `<div class="contact">${contact.map((item) => `<div>${item}</div>`).join('')}</div>` : ''}
    ${logo ? `<img class="logo" src="${logo}" alt="">` : ''}
    <div class="card">
      <div class="nm">${agent}</div>
      ${role ? `<div class="role">${role}</div>` : ''}
      ${license ? `<div class="lic">${license}</div>` : ''}
      ${reach ? `<div class="reach">${reach}</div>` : ''}
    </div>
    ${headshot ? `<img class="head" src="${headshot}" alt="">` : ''}
  </body></html>`
}

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

export type FrontLayout = 'full' | 'split' | 'trio'

export const CARD_WIDTH_IN = 9.25
export const CARD_HEIGHT_IN = 6.25

// Same size on the card and on the printed proof. Tuned to the on-screen card.
export const SLOT_TEXT_IN = { heading: 0.29, subheading: 0.24, body: 0.21 }

export type PostcardSlot = {
  kind: 'empty' | 'photo' | 'text'
  photoUrl: string
  photoWidth: number
  photoHeight: number
  heading: string
  subheading: string
  body: string
  bg: string
  color: string
  zoom: number
  rotate: number
  panX: number
  panY: number
}

export type SlotFrame = { left: number; top: number; width: number; height: number }

export const SLOT_BACKGROUNDS = ['#000000', '#ffffff', '#1b2a4a', '#1f4d3a', '#8f2d2d', '#1e4d8c', '#6b4f2a', '#e7e2d8', '#f4f1ea', '#c5d0dc']
export const SLOT_TEXT_COLORS = ['#ffffff', '#000000', '#1b2a4a', '#f5e6b8']

export function slotColor(value: string | undefined, fallback: string) {
  const hex = (value || '').trim().toLowerCase()
  return /^#[0-9a-f]{6}$/.test(hex) ? hex : fallback
}

function photoPixels(value: unknown) {
  const n = Math.round(Number(value))
  return Number.isFinite(n) && n > 0 && n <= 16000 ? n : 0
}

export function normalizeSlot(slot: Partial<PostcardSlot> | undefined): PostcardSlot {
  const zoomRaw = Number(slot?.zoom)
  const zoom = Number.isFinite(zoomRaw) ? Math.min(4, Math.max(1, zoomRaw)) : 1
  const rotateRaw = Number(slot?.rotate)
  const rotate = [0, 90, 180, 270].includes(rotateRaw) ? rotateRaw : 0
  const pan = (value: unknown) => {
    const n = Number(value)
    if (!Number.isFinite(n)) return 0
    return Math.min(200, Math.max(-200, n))
  }
  const kind = slot?.kind === 'photo' || slot?.kind === 'text' ? slot.kind : 'empty'
  return {
    kind,
    photoUrl: slot?.photoUrl || '',
    photoWidth: photoPixels(slot?.photoWidth),
    photoHeight: photoPixels(slot?.photoHeight),
    heading: (slot?.heading || '').slice(0, 40),
    subheading: (slot?.subheading || '').slice(0, 60),
    body: (slot?.body || '').slice(0, 220),
    bg: slotColor(slot?.bg, '#000000'),
    color: slotColor(slot?.color, '#ffffff'),
    zoom,
    rotate,
    panX: pan(slot?.panX),
    panY: pan(slot?.panY),
  }
}

export function isSlotLayout(value: string | undefined | null): value is FrontLayout {
  return value === 'full' || value === 'split' || value === 'trio'
}

export function emptySlot(): PostcardSlot {
  return normalizeSlot(undefined)
}

export function frontFrames(layout: FrontLayout): SlotFrame[] {
  if (layout === 'full') return [{ left: 0, top: 0, width: 100, height: 100 }]
  if (layout === 'split') {
    return [
      { left: 0, top: 0, width: 50, height: 100 },
      { left: 50, top: 0, width: 50, height: 50 },
      { left: 50, top: 50, width: 50, height: 50 },
    ]
  }
  const row = 100 / 3
  return [
    { left: 0, top: 0, width: 62, height: 100 },
    { left: 62, top: 0, width: 38, height: row },
    { left: 62, top: row, width: 38, height: row },
    { left: 62, top: row * 2, width: 38, height: 100 - row * 2 },
  ]
}

export function backFrames(): { slots: SlotFrame[]; address: SlotFrame } {
  return {
    slots: [
      { left: 0, top: 0, width: 50, height: 100 },
      { left: 50, top: 0, width: 50, height: 50 },
    ],
    address: { left: 50, top: 50, width: 50, height: 50 },
  }
}

export type PhotoBox = { left: number; top: number; width: number; height: number }

function slotInches(frame: SlotFrame) {
  return {
    width: (frame.width / 100) * CARD_WIDTH_IN,
    height: (frame.height / 100) * CARD_HEIGHT_IN,
  }
}

function coveredBox(slot: PostcardSlot, slotW: number, slotH: number) {
  const nw = slot.photoWidth
  const nh = slot.photoHeight
  if (!nw || !nh || !slotW || !slotH) {
    return { boxW: slotW * slot.zoom, boxH: slotH * slot.zoom }
  }
  const scale = Math.max(slotW / nw, slotH / nh) * slot.zoom
  return { boxW: nw * scale, boxH: nh * scale }
}

export function photoPanLimit(slot: PostcardSlot, frame: SlotFrame) {
  const slotSize = slotInches(frame)
  const { boxW, boxH } = coveredBox(slot, slotSize.width, slotSize.height)
  return {
    x: slotSize.width ? Math.max(0, ((boxW - slotSize.width) / 2 / slotSize.width) * 100) : 0,
    y: slotSize.height ? Math.max(0, ((boxH - slotSize.height) / 2 / slotSize.height) * 100) : 0,
  }
}

export function photoBox(slot: PostcardSlot, frame: SlotFrame): PhotoBox {
  const slotSize = slotInches(frame)
  const { boxW, boxH } = coveredBox(slot, slotSize.width, slotSize.height)
  const limit = photoPanLimit(slot, frame)
  const panX = Math.min(limit.x, Math.max(-limit.x, slot.panX))
  const panY = Math.min(limit.y, Math.max(-limit.y, slot.panY))
  const centerX = slotSize.width / 2 + (panX / 100) * slotSize.width
  const centerY = slotSize.height / 2 + (panY / 100) * slotSize.height
  return {
    left: slotSize.width ? ((centerX - boxW / 2) / slotSize.width) * 100 : 0,
    top: slotSize.height ? ((centerY - boxH / 2) / slotSize.height) * 100 : 0,
    width: slotSize.width ? (boxW / slotSize.width) * 100 : 100,
    height: slotSize.height ? (boxH / slotSize.height) * 100 : 100,
  }
}

export function photoPaint(slot: PostcardSlot, frame: SlotFrame) {
  const place = photoBox(slot, frame)
  const axis = (offset: number, size: number) => (Math.abs(size - 100) < 0.01 ? 50 : (-offset / (size - 100)) * 100)
  const slotSize = slotInches(frame)
  const turn = slot.rotate === 90 || slot.rotate === 270
  const cover = !turn || !slotSize.width || !slotSize.height
    ? 1
    : Math.max(slotSize.width / slotSize.height, slotSize.height / slotSize.width)
  return {
    size: `${place.width.toFixed(3)}% ${place.height.toFixed(3)}%`,
    position: `${axis(place.left, place.width).toFixed(3)}% ${axis(place.top, place.height).toFixed(3)}%`,
    transform: `rotate(${slot.rotate}deg) scale(${cover.toFixed(4)})`,
  }
}

export function slotTextCqw(kind: keyof typeof SLOT_TEXT_IN) {
  return `${(SLOT_TEXT_IN[kind] / CARD_WIDTH_IN) * 100}cqw`
}

export function slotCount(layout: FrontLayout) {
  if (layout === 'full') return 1
  if (layout === 'split') return 3
  return 4
}

export function fitSlots(layout: FrontLayout, slots: PostcardSlot[] | undefined) {
  const previous = slots || []
  return Array.from({ length: slotCount(layout) }, (_, index) => normalizeSlot(previous[index]))
}

export function fitBackSlots(slots: PostcardSlot[] | undefined) {
  const previous = slots || []
  return [0, 1].map((index) => normalizeSlot(previous[index]))
}

export function slotHasContent(slot: PostcardSlot | undefined) {
  if (!slot || slot.kind === 'empty') return false
  if (slot.kind === 'photo') return Boolean(slot.photoUrl)
  return Boolean(slot.heading.trim() || slot.subheading.trim() || slot.body.trim())
}

export type ListingPostcard = {
  layout: FrontLayout | ''
  slots: PostcardSlot[]
  backSlots: PostcardSlot[]
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
    layout: '',
    slots: [],
    backSlots: [emptySlot(), emptySlot()],
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

export function frontSlotsReady(input: ListingPostcard) {
  if (!isSlotLayout(input.layout)) return 'Pick a layout.'
  const slots = fitSlots(input.layout, input.slots)
  if (slots.some((slot) => !slotHasContent(slot))) return 'Tap each + and add a photo or some words.'
  return ''
}

export function listingPostcardReady(input: ListingPostcard) {
  if (isSlotLayout(input.layout)) {
    const front = frontSlotsReady(input)
    if (front) return front
    if (fitBackSlots(input.backSlots).some((slot) => !slotHasContent(slot))) return 'Add a photo or some words on the back.'
    return ''
  } else {
    if (!input.photoUrl) return 'Add the house photo.'
    if (!input.headline.trim()) return 'Add the words for the top bar.'
    if (!input.propertyAddress.trim()) return 'Add the property address.'
  }
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

function frameStyle(frame: SlotFrame) {
  const left = (frame.left / 100) * CARD_WIDTH_IN
  const top = (frame.top / 100) * CARD_HEIGHT_IN
  const width = (frame.width / 100) * CARD_WIDTH_IN
  const height = (frame.height / 100) * CARD_HEIGHT_IN
  return `left:${left.toFixed(3)}in;top:${top.toFixed(3)}in;width:${width.toFixed(3)}in;height:${height.toFixed(3)}in`
}

function slotMarkup(slot: PostcardSlot, frame: SlotFrame) {
  const bg = slotColor(slot.bg, '#000000')
  const ink = slotColor(slot.color, '#ffffff')
  const box = `position:absolute;${frameStyle(frame)};overflow:hidden;background:${bg};color:${ink}`
  if (slot.kind === 'photo' && slot.photoUrl) {
    const paint = photoPaint(slot, frame)
    const image = escapeHtml(slot.photoUrl).replace(/'/g, '%27')
    return `<div class="slot" style="${box}"><div style="position:absolute;left:0;top:0;width:100%;height:100%;background-image:url('${image}');background-repeat:no-repeat;background-size:${paint.size};background-position:${paint.position};-webkit-transform:${paint.transform};transform:${paint.transform};-webkit-transform-origin:center center;transform-origin:center center"></div></div>`
  }
  const heading = escapeHtml(slot.heading.trim())
  const subheading = escapeHtml(slot.subheading.trim())
  const body = escapeHtml(slot.body.trim())
    const line = (text: string, kind: keyof typeof SLOT_TEXT_IN, weight: number) => (
    text ? `<div style="font-size:${SLOT_TEXT_IN[kind]}in;font-weight:${weight};line-height:1.15;margin-top:${kind === 'heading' ? '0' : '0.06in'}${kind === 'body' ? ';white-space:pre-wrap' : ''}">${text}</div>` : ''
  )
  return `<div class="slot" style="${box}"><table><tr><td>${line(heading, 'heading', 700)}${line(subheading, 'subheading', 400)}${line(body, 'body', 400)}</td></tr></table></div>`
}

function placedSlots(frames: SlotFrame[], slots: PostcardSlot[]) {
  return frames.map((frame, index) => slotMarkup(slots[index] || emptySlot(), frame)).join('')
}

const slotPageCss = `* { box-sizing: border-box; }
    @page { size: ${CARD_WIDTH_IN}in ${CARD_HEIGHT_IN}in; margin: 0; }
    html, body { width: ${CARD_WIDTH_IN}in; height: ${CARD_HEIGHT_IN}in; margin: 0; padding: 0; overflow: hidden; }
    body { position: relative; background: #000; }
    .slot { position: absolute; }
    img { max-width: none; border: 0; }
    table { width: 100%; height: 100%; border-collapse: collapse; }
    td { vertical-align: middle; text-align: center; padding: 0.1in; font-family: Helvetica, Arial, sans-serif; }`

function slotFrontHtml(input: ListingPostcard) {
  const layout = isSlotLayout(input.layout) ? input.layout : 'full'
  const pieces = placedSlots(frontFrames(layout), fitSlots(layout, input.slots))
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${slotPageCss}</style></head><body>${pieces}</body></html>`
}

function slotBackHtml(input: ListingPostcard) {
  const frames = backFrames()
  const pieces = placedSlots(frames.slots, fitBackSlots(input.backSlots))
  const address = `<div class="slot" style="${frameStyle(frames.address)};background:#fff"></div>`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${slotPageCss}</style></head><body>${pieces}${address}</body></html>`
}

export function listingFrontHtml(input: ListingPostcard) {
  if (isSlotLayout(input.layout)) return slotFrontHtml(input)
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
  if (isSlotLayout(input.layout)) return slotBackHtml(input)
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

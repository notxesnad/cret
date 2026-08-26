export const NET_SHEET_KIND = 'netsheet' as const

export type ExtraFieldKey =
  | 'sellerConcessions'
  | 'personalProperty'
  | 'secondMortgage'
  | 'prepaymentPenalties'
  | 'propertyLiens'
  | 'transactionCoordFees'
  | 'attorneyFees'
  | 'recordingFees'
  | 'ownersTitleInsurance'
  | 'courierWireFees'
  | 'propertyTaxesPrarated'
  | 'hoaDues'
  | 'hoaEstoppel'
  | 'specialAssessments'
  | 'utilitiesProration'
  | 'homeWarranty'
  | 'stagingPhotography'
  | 'repairCredits'

export interface ExtraField {
  key: ExtraFieldKey
  label: string
  hint: string
  group: 'loans' | 'closing' | 'other'
}

export const EXTRA_FIELDS: ExtraField[] = [
  { key: 'secondMortgage', label: 'Second mortgage / HELOC', hint: 'Another loan on the house they still owe.', group: 'loans' },
  { key: 'prepaymentPenalties', label: 'Prepayment penalty', hint: 'A fee some lenders charge for paying the loan off early.', group: 'loans' },
  { key: 'propertyLiens', label: 'Other liens', hint: 'Tax liens, contractor liens, or anything else that must be paid off.', group: 'loans' },
  { key: 'sellerConcessions', label: 'Seller concessions', hint: 'Money the seller is giving the buyer toward their costs.', group: 'other' },
  { key: 'repairCredits', label: 'Repair credits', hint: 'Money credited to the buyer for repairs.', group: 'other' },
  { key: 'personalProperty', label: 'Personal property included', hint: 'Furniture or extras the seller is paying to include. Rarely needed.', group: 'other' },
  { key: 'recordingFees', label: 'Recording fees', hint: 'County fee to record the new deed and mortgage payoff.', group: 'closing' },
  { key: 'ownersTitleInsurance', label: "Owner's title insurance", hint: 'A one-time policy that protects the buyer. Often paid by the seller.', group: 'closing' },
  { key: 'attorneyFees', label: 'Attorney fees', hint: 'Only if your area uses a closing attorney.', group: 'closing' },
  { key: 'transactionCoordFees', label: 'Transaction coordinator / admin', hint: 'Office admin fee some brokerages charge.', group: 'closing' },
  { key: 'courierWireFees', label: 'Courier / wire fees', hint: 'Bank wire and overnight document fees. Usually small.', group: 'closing' },
  { key: 'propertyTaxesPrarated', label: 'Prorated property taxes', hint: 'The seller’s share of this year’s taxes through closing.', group: 'closing' },
  { key: 'hoaDues', label: 'Prorated HOA dues', hint: 'The seller’s share of HOA dues through closing.', group: 'other' },
  { key: 'hoaEstoppel', label: 'HOA estoppel / transfer fee', hint: 'HOA paperwork fee. Ask the HOA or title company.', group: 'other' },
  { key: 'specialAssessments', label: 'Special assessments', hint: 'One-time HOA or city charges still owed.', group: 'other' },
  { key: 'utilitiesProration', label: 'Utility proration', hint: 'Any utility balance settled at closing.', group: 'other' },
  { key: 'homeWarranty', label: 'Home warranty', hint: 'Optional plan the seller buys for the buyer.', group: 'other' },
  { key: 'stagingPhotography', label: 'Staging & photography', hint: 'Only include costs the seller is paying from proceeds.', group: 'other' },
]

export interface CustomCost {
  id: string
  label: string
  amount: number
}

export interface NetSheet {
  id: string
  kind: typeof NET_SHEET_KIND
  listingId?: string
  address: string
  city: string
  state: string
  county: string
  salePrice: number
  mortgagePayoff: number
  agentCommissionPct: number
  transferTaxPct: number
  titleEscrowFee: number
  extras: Partial<Record<ExtraFieldKey, number>>
  customCosts: CustomCost[]
  updatedAt: string
}

export function isNetSheet(record: { kind?: string } | null | undefined): record is NetSheet {
  return record?.kind === NET_SHEET_KIND
}

export function blankNetSheet(): NetSheet {
  return {
    id: Math.random().toString(36).slice(2, 11),
    kind: NET_SHEET_KIND,
    address: '',
    city: '',
    state: '',
    county: '',
    salePrice: 0,
    mortgagePayoff: 0,
    agentCommissionPct: 5,
    transferTaxPct: 0,
    titleEscrowFee: 0,
    extras: {},
    customCosts: [],
    updatedAt: new Date().toISOString(),
  }
}

export function money(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0)
}

export function formatMoneyInput(n: number) {
  if (!n) return ''
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
}

export function parseMoneyInput(raw: string) {
  const n = Number(String(raw).replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n)) return 0
  return Math.round(n)
}

export function commissionAmount(sheet: NetSheet) {
  return (Number(sheet.salePrice) || 0) * ((Number(sheet.agentCommissionPct) || 0) / 100)
}

export function transferTaxAmount(sheet: NetSheet) {
  return (Number(sheet.salePrice) || 0) * ((Number(sheet.transferTaxPct) || 0) / 100)
}

export function extraTotal(sheet: NetSheet) {
  const extras = Object.values(sheet.extras || {}).reduce((sum, n) => sum + (Number(n) || 0), 0)
  const custom = (sheet.customCosts || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return extras + custom
}

export function totalDeductions(sheet: NetSheet) {
  return (
    (Number(sheet.mortgagePayoff) || 0) +
    commissionAmount(sheet) +
    transferTaxAmount(sheet) +
    (Number(sheet.titleEscrowFee) || 0) +
    extraTotal(sheet)
  )
}

export function netProceeds(sheet: NetSheet) {
  return (Number(sheet.salePrice) || 0) - totalDeductions(sheet)
}

export function extraField(key: string) {
  return EXTRA_FIELDS.find(f => f.key === key)
}

export function listingLabel(listing: { address?: string; city?: string; state?: string }) {
  return listing.address?.trim() || [listing.city, listing.state].filter(Boolean).join(', ') || 'Untitled listing'
}

export function newRecordId() {
  return Math.random().toString(36).slice(2, 11)
}

export function netSheetAiPrompt(sheet: Pick<NetSheet, 'city' | 'state' | 'county' | 'salePrice'>) {
  const place = [sheet.city, sheet.county, sheet.state].filter(Boolean).join(', ') || 'the property location'
  const price = Number(sheet.salePrice) > 0 ? money(sheet.salePrice) : 'a typical home in that area'
  return `You are helping a real estate agent estimate typical SELLER closing costs.

Location: ${place}
Approximate sale price: ${price}

Research typical seller-paid costs for this county and state. Use current public information. If a number varies, pick a reasonable mid-range estimate for a standard residential resale.

Return ONLY valid JSON. No markdown. No code fences. No extra sentences. Use this exact shape and these exact keys:

{
  "state": "XX",
  "county": "CountyName",
  "transfer_tax_percent": 0.00,
  "title_escrow_fee_dollars": 0,
  "recording_fees_dollars": 0,
  "owners_title_insurance_dollars": 0,
  "attorney_fees_dollars": 0,
  "notes": "One short sentence about what is typical for sellers here."
}

Rules:
- transfer_tax_percent is a percent number, not a dollar amount. Example: 0.7 means 0.7%.
- All *_dollars fields are whole dollars, no $ sign, no commas.
- If a cost is not typical for sellers in this location, use 0.
- attorney_fees_dollars should be 0 unless closings in this area commonly use a seller-paid attorney.
- Do not include any other keys.`
}

export function asNetSheet(record: unknown): NetSheet | null {
  if (!record || typeof record !== 'object') return null
  const r = record as Partial<NetSheet> & { id?: string; kind?: string }
  if (r.kind !== NET_SHEET_KIND || typeof r.id !== 'string' || !r.id) return null
  const extras = r.extras && typeof r.extras === 'object' ? r.extras : {}
  return {
    ...blankNetSheet(),
    ...r,
    id: r.id,
    kind: NET_SHEET_KIND,
    extras,
    customCosts: Array.isArray(r.customCosts)
      ? r.customCosts
        .filter((item): item is CustomCost => !!item && typeof item === 'object' && typeof (item as CustomCost).id === 'string')
        .map(item => ({
          id: item.id,
          label: String(item.label || ''),
          amount: Number(item.amount) || 0,
        }))
      : [],
    listingId: typeof r.listingId === 'string' && r.listingId ? r.listingId : undefined,
    address: String(r.address || ''),
    city: String(r.city || ''),
    state: String(r.state || ''),
    county: String(r.county || ''),
    salePrice: Number(r.salePrice) || 0,
    mortgagePayoff: Number(r.mortgagePayoff) || 0,
    agentCommissionPct: Number(r.agentCommissionPct) || 0,
    transferTaxPct: Number(r.transferTaxPct) || 0,
    titleEscrowFee: Number(r.titleEscrowFee) || 0,
  }
}

export interface ParsedNetSheetAi {
  transferTaxPct?: number
  titleEscrowFee?: number
  extras: Partial<Record<ExtraFieldKey, number>>
  notes?: string
  state?: string
  county?: string
}

function softenAiText(raw: string) {
  return raw
    .replace(/^\uFEFF/, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/```(?:json|javascript|js)?/gi, '')
    .replace(/,\s*([}\]])/g, '$1')
    .trim()
}

function extractJsonObjects(text: string): string[] {
  const objects: string[] = []
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '{') continue
    let depth = 0
    let inStr = false
    let esc = false
    for (let j = i; j < text.length; j++) {
      const c = text[j]
      if (inStr) {
        if (esc) {
          esc = false
          continue
        }
        if (c === '\\') {
          esc = true
          continue
        }
        if (c === '"') inStr = false
        continue
      }
      if (c === '"') {
        inStr = true
        continue
      }
      if (c === '{') depth++
      if (c === '}') {
        depth--
        if (depth === 0) {
          objects.push(text.slice(i, j + 1))
          i = j
          break
        }
      }
    }
  }
  return objects
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function flattenRecord(record: Record<string, unknown>, into: Record<string, unknown> = {}) {
  for (const [key, value] of Object.entries(record)) {
    into[normalizeKey(key)] = value
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenRecord(value as Record<string, unknown>, into)
    }
  }
  return into
}

function lookup(flat: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    if (flat[alias] !== undefined) return flat[alias]
  }
  return undefined
}

function num(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^0-9.]/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function maybeNum(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined
  return num(value)
}

function parseAiRecord(data: Record<string, unknown>): ParsedNetSheetAi {
  const flat = flattenRecord(data)
  const extras: Partial<Record<ExtraFieldKey, number>> = {}
  const recording = maybeNum(lookup(flat, ['recordingfeesdollars', 'recordingfees', 'recordingfee']))
  const titleIns = maybeNum(lookup(flat, ['ownerstitleinsurancedollars', 'ownerstitleinsurance', 'ownerstitle', 'titleinsurance', 'titlepolicy']))
  const attorney = maybeNum(lookup(flat, ['attorneyfeesdollars', 'attorneyfees', 'attorneyfee', 'closingattorney']))
  if (recording && recording > 0) extras.recordingFees = Math.round(recording)
  if (titleIns && titleIns > 0) extras.ownersTitleInsurance = Math.round(titleIns)
  if (attorney && attorney > 0) extras.attorneyFees = Math.round(attorney)

  const stateRaw = lookup(flat, ['state'])
  const countyRaw = lookup(flat, ['county'])
  const state = typeof stateRaw === 'string'
    ? stateRaw.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase()
    : ''
  const county = typeof countyRaw === 'string' ? countyRaw.trim() : ''
  const notesRaw = lookup(flat, ['notes', 'note', 'summary'])
  const titleFee = maybeNum(lookup(flat, [
    'titleescrowfeedollars',
    'titleescrowfee',
    'titleescrow',
    'titleandescrow',
    'titlefees',
    'escrowfee',
    'settlementfee',
  ]))

  return {
    transferTaxPct: maybeNum(lookup(flat, [
      'transfertaxpercent',
      'transfertaxpercentage',
      'transfertaxpct',
      'transfertaxrate',
      'transfertax',
      'documentarystamptax',
      'documentarystamp',
      'docstamptax',
      'docstamps',
    ])),
    titleEscrowFee: titleFee === undefined ? undefined : Math.round(titleFee),
    extras,
    notes: typeof notesRaw === 'string' ? notesRaw.trim() : undefined,
    state: state || undefined,
    county: county || undefined,
  }
}

function aiScore(parsed: ParsedNetSheetAi) {
  return (
    (parsed.transferTaxPct ? 1 : 0) +
    (parsed.titleEscrowFee ? 1 : 0) +
    Object.keys(parsed.extras).length +
    (parsed.notes ? 0.25 : 0)
  )
}

export function parseNetSheetAi(raw: string): ParsedNetSheetAi {
  const cleaned = softenAiText(raw)
  const objects = extractJsonObjects(cleaned)
  if (objects.length === 0) throw new Error('Paste the JSON the AI returned.')

  let best: ParsedNetSheetAi | null = null
  let bestScore = -1
  for (const object of objects) {
    try {
      const parsed = parseAiRecord(JSON.parse(object) as Record<string, unknown>)
      const score = aiScore(parsed)
      if (score >= bestScore) {
        best = parsed
        bestScore = score
      }
    } catch {
      // skip malformed blocks
    }
  }

  if (!best) throw new Error('Paste the JSON the AI returned.')
  if (/return only valid json/i.test(raw) && bestScore < 1) {
    throw new Error('Paste the AI answer, not the prompt.')
  }
  const hasCosts = Boolean(best.transferTaxPct || best.titleEscrowFee || Object.keys(best.extras).length)
  if (!hasCosts) {
    throw new Error('We found a reply, but not the cost numbers. Paste the whole AI answer, including the JSON.')
  }
  return best
}

export function describeAiApply(parsed: ParsedNetSheetAi) {
  const bits: string[] = []
  if (parsed.transferTaxPct) bits.push(`Transfer tax ${parsed.transferTaxPct}%`)
  if (parsed.titleEscrowFee) bits.push(`Title & escrow ${money(parsed.titleEscrowFee)}`)
  for (const [key, amount] of Object.entries(parsed.extras)) {
    bits.push(`${extraField(key)?.label || key} ${money(Number(amount) || 0)}`)
  }
  if (parsed.notes) bits.push(parsed.notes)
  return bits.join(' · ') || 'Local estimates added. You can still change any number.'
}

export function applyAiToSheet(sheet: NetSheet, parsed: ParsedNetSheetAi): NetSheet {
  return {
    ...sheet,
    transferTaxPct: parsed.transferTaxPct ?? sheet.transferTaxPct,
    titleEscrowFee: parsed.titleEscrowFee ?? sheet.titleEscrowFee,
    extras: { ...sheet.extras, ...parsed.extras },
    state: parsed.state || sheet.state,
    county: parsed.county || sheet.county,
    updatedAt: new Date().toISOString(),
  }
}

export function sheetTitle(sheet: NetSheet) {
  return sheet.address.trim() || [sheet.city, sheet.state].filter(Boolean).join(', ') || 'Untitled net sheet'
}

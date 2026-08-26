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

export interface NetSheet {
  id: string
  kind: typeof NET_SHEET_KIND
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

export function commissionAmount(sheet: NetSheet) {
  return (Number(sheet.salePrice) || 0) * ((Number(sheet.agentCommissionPct) || 0) / 100)
}

export function transferTaxAmount(sheet: NetSheet) {
  return (Number(sheet.salePrice) || 0) * ((Number(sheet.transferTaxPct) || 0) / 100)
}

export function extraTotal(sheet: NetSheet) {
  return Object.values(sheet.extras || {}).reduce((sum, n) => sum + (Number(n) || 0), 0)
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

export function parseNetSheetAi(raw: string): ParsedNetSheetAi {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Paste the JSON the AI returned.')
  const data = JSON.parse(jsonMatch[0]) as Record<string, unknown>

  const num = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const n = Number(String(value).replace(/[^0-9.]/g, ''))
      return Number.isFinite(n) ? n : 0
    }
    return 0
  }

  const extras: Partial<Record<ExtraFieldKey, number>> = {}
  const recording = num(data.recording_fees_dollars)
  const titleIns = num(data.owners_title_insurance_dollars)
  const attorney = num(data.attorney_fees_dollars)
  if (recording > 0) extras.recordingFees = Math.round(recording)
  if (titleIns > 0) extras.ownersTitleInsurance = Math.round(titleIns)
  if (attorney > 0) extras.attorneyFees = Math.round(attorney)

  const state = typeof data.state === 'string'
    ? data.state.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase()
    : ''
  const county = typeof data.county === 'string' ? data.county.trim() : ''

  return {
    transferTaxPct: num(data.transfer_tax_percent),
    titleEscrowFee: Math.round(num(data.title_escrow_fee_dollars)),
    extras,
    notes: typeof data.notes === 'string' ? data.notes.trim() : undefined,
    state: state || undefined,
    county: county || undefined,
  }
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

import type { ReactNode } from 'react'
import {
  commissionAmount,
  extraField,
  extraTotal,
  money,
  netProceeds,
  sheetTitle,
  totalDeductions,
  transferTaxAmount,
  type ExtraFieldKey,
  type NetSheet,
} from '@/app/lib/netSheet'

function Line({
  label,
  amount,
  tone = 'cost',
}: {
  label: string
  amount: number
  tone?: 'sale' | 'cost' | 'net'
}) {
  if (tone !== 'sale' && tone !== 'net' && !(amount > 0)) return null
  const color =
    tone === 'net' ? 'text-emerald-700' : tone === 'sale' ? 'text-slate-900' : 'text-rose-600'
  return (
    <div className={`flex justify-between items-baseline gap-4 py-2.5 ${color}`}>
      <span className="text-lg md:text-xl font-semibold">{label}</span>
      <span className="text-lg md:text-xl font-black tabular-nums whitespace-nowrap">
        {tone === 'sale' || tone === 'net' ? money(amount) : `-${money(amount)}`}
      </span>
    </div>
  )
}

export function NetSheetDocument({
  sheet,
  header,
}: {
  sheet: NetSheet
  header: ReactNode
}) {
  const extras = Object.entries(sheet.extras || {}) as [ExtraFieldKey, number][]
  const loanExtras = extras.filter(([key]) => extraField(key)?.group === 'loans')
  const closingExtras = extras.filter(([key]) => extraField(key)?.group === 'closing')
  const otherExtras = extras.filter(([key]) => extraField(key)?.group === 'other')
  const net = netProceeds(sheet)
  const place = [sheet.city, sheet.county, sheet.state].filter(Boolean).join(', ')

  return (
    <div className="bg-white text-slate-900">
      <div className="[&>*]:mb-0">{header}</div>

      <div className="max-w-2xl mx-auto px-5 md:px-8 py-8 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-emerald-600">Seller net sheet</p>
          <h1 className="text-3xl md:text-4xl font-black leading-tight">{sheetTitle(sheet)}</h1>
          {place && <p className="text-lg text-slate-500">{place}</p>}
        </div>

        <div className="rounded-3xl bg-emerald-50 border border-emerald-200 px-6 py-8 text-center">
          <p className="text-sm font-bold tracking-[0.18em] uppercase text-emerald-700">Estimated cash at closing</p>
          <p className="text-5xl md:text-6xl font-black text-emerald-600 mt-2 tabular-nums">{money(net)}</p>
          <p className="text-base text-emerald-800/80 mt-3">This is an estimate of what the seller may walk away with.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm px-5 md:px-7 py-5">
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">The sale</p>
          <Line label="Sale price" amount={sheet.salePrice} tone="sale" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm px-5 md:px-7 py-5">
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Paid off at closing</p>
          <Line label="Mortgage payoff" amount={sheet.mortgagePayoff} />
          {loanExtras.map(([key, amount]) => (
            <Line key={key} label={extraField(key)?.label || key} amount={amount} />
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm px-5 md:px-7 py-5">
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Agent commission</p>
          <Line
            label={`${sheet.agentCommissionPct || 0}% total commission`}
            amount={commissionAmount(sheet)}
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm px-5 md:px-7 py-5">
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Typical closing costs</p>
          <Line
            label={`Transfer tax (${sheet.transferTaxPct || 0}%)`}
            amount={transferTaxAmount(sheet)}
          />
          <Line label="Title & escrow" amount={sheet.titleEscrowFee} />
          {closingExtras.map(([key, amount]) => (
            <Line key={key} label={extraField(key)?.label || key} amount={amount} />
          ))}
        </div>

        {otherExtras.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm px-5 md:px-7 py-5">
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Other seller costs</p>
            {otherExtras.map(([key, amount]) => (
              <Line key={key} label={extraField(key)?.label || key} amount={amount} />
            ))}
          </div>
        )}

        <div className="rounded-3xl bg-slate-900 text-white px-6 py-6">
          <div className="flex justify-between gap-4 text-slate-300 text-lg">
            <span>Sale price</span>
            <span className="tabular-nums">{money(sheet.salePrice)}</span>
          </div>
          <div className="flex justify-between gap-4 text-rose-300 text-lg mt-2">
            <span>Minus costs</span>
            <span className="tabular-nums">-{money(totalDeductions(sheet))}</span>
          </div>
          <div className="flex justify-between gap-4 items-baseline mt-4 pt-4 border-t border-white/10">
            <span className="text-xl font-bold">Estimated net</span>
            <span className="text-3xl font-black text-emerald-400 tabular-nums">{money(net)}</span>
          </div>
          {extraTotal(sheet) > 0 && (
            <p className="text-sm text-slate-400 mt-3">Includes extra costs added by your agent.</p>
          )}
        </div>

        <p className="text-sm leading-relaxed text-slate-500 text-center px-2">
          This is a planning estimate, not a closing statement. Final numbers come from the title company or closing attorney and can change.
        </p>
      </div>
    </div>
  )
}

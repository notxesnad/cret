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

function Row({
  label,
  amount,
  variant = 'charge',
}: {
  label: string
  amount: number
  variant?: 'credit' | 'charge' | 'total' | 'net'
}) {
  if (variant === 'charge' && !(amount > 0)) return null
  const isNet = variant === 'net'
  const isCredit = variant === 'credit'
  const isTotal = variant === 'total'
  return (
    <tr>
      <td
        className={`py-3 pr-4 ${
          isNet || isTotal ? 'font-black text-lg md:text-xl' : 'text-lg md:text-xl font-medium'
        } ${isCredit ? 'text-slate-900' : isNet ? 'text-white' : 'text-slate-700'}`}
      >
        {label}
      </td>
      <td
        className={`py-3 text-right tabular-nums whitespace-nowrap ${
          isNet || isTotal ? 'font-black text-lg md:text-xl' : 'text-lg md:text-xl font-semibold'
        } ${isCredit ? 'text-slate-900' : isNet ? 'text-emerald-300' : 'text-slate-900'}`}
      >
        {variant === 'charge' ? `−${money(amount)}` : money(amount)}
      </td>
    </tr>
  )
}

function preparedOn(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function NetSheetDocument({
  sheet,
  header,
}: {
  sheet: NetSheet
  header: ReactNode
}) {
  const extras = (Object.entries(sheet.extras || {}) as [ExtraFieldKey, number][])
    .filter(([, amount]) => amount > 0)
  const loanExtras = extras.filter(([key]) => extraField(key)?.group === 'loans')
  const closingExtras = extras.filter(([key]) => extraField(key)?.group === 'closing')
  const otherExtras = extras.filter(([key]) => extraField(key)?.group === 'other')
  const net = netProceeds(sheet)
  const costs = totalDeductions(sheet)
  const place = [sheet.city, sheet.county ? `${sheet.county} County` : '', sheet.state]
    .filter(Boolean)
    .join(' · ')
  const date = preparedOn(sheet.updatedAt)

  return (
    <div className="bg-white text-slate-900">
      <div className="h-1.5 bg-slate-950" />
      <div className="[&>*]:mb-0">{header}</div>

      <div className="max-w-2xl mx-auto px-6 md:px-10 pb-12">
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-slate-500">Seller&apos;s net proceeds</p>
            <h1 className="text-3xl md:text-4xl font-black leading-tight text-slate-950 mt-2">
              {sheetTitle(sheet)}
            </h1>
            {place && <p className="text-lg text-slate-500 mt-1">{place}</p>}
          </div>
          {date && (
            <p className="text-sm text-slate-500 md:text-right">
              Prepared {date}
            </p>
          )}
        </div>

        <div className="mt-8 border border-slate-200 bg-[#f6f4ef] px-6 md:px-8 py-7">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-500">Estimated cash at closing</p>
          <p className="text-5xl md:text-6xl font-black tabular-nums tracking-tight mt-2 text-slate-950">{money(net)}</p>
          <p className="text-base text-slate-500 mt-3">What the seller may walk away with after the costs below.</p>
        </div>

        <table className="w-full mt-8 border-collapse">
          <tbody>
            <tr>
              <td colSpan={2} className="pt-1 pb-2 text-[11px] font-bold tracking-[0.18em] uppercase text-slate-400">
                The sale
              </td>
            </tr>
            <Row label="Sale price" amount={sheet.salePrice} variant="credit" />
            <tr>
              <td colSpan={2} className="pt-6 pb-2 text-[11px] font-bold tracking-[0.18em] uppercase text-slate-400 border-t border-slate-200">
                Less estimated costs
              </td>
            </tr>
            <Row label="Mortgage payoff" amount={sheet.mortgagePayoff} />
            {loanExtras.map(([key, amount]) => (
              <Row key={key} label={extraField(key)?.label || key} amount={amount} />
            ))}
            <Row
              label={`${sheet.agentCommissionPct || 0}% commission`}
              amount={commissionAmount(sheet)}
            />
            <Row
              label={`Transfer tax${sheet.transferTaxPct ? ` (${sheet.transferTaxPct}%)` : ''}`}
              amount={transferTaxAmount(sheet)}
            />
            <Row label="Title & escrow" amount={sheet.titleEscrowFee} />
            {closingExtras.map(([key, amount]) => (
              <Row key={key} label={extraField(key)?.label || key} amount={amount} />
            ))}
            {sheet.extras.sellerConcessions ? (
              <Row label="Seller concessions" amount={sheet.extras.sellerConcessions} />
            ) : null}
            {(sheet.customCosts || []).filter(item => item.amount > 0).map(item => (
              <Row key={item.id} label={item.label.trim() || 'Custom cost'} amount={item.amount} />
            ))}
            {otherExtras.filter(([key]) => key !== 'sellerConcessions').map(([key, amount]) => (
              <Row key={key} label={extraField(key)?.label || key} amount={amount} />
            ))}
            <tr>
              <td colSpan={2} className="h-3 border-t border-slate-300"></td>
            </tr>
            <Row label="Total estimated costs" amount={costs} variant="total" />
          </tbody>
        </table>

        <div className="mt-1 pt-5 border-t-2 border-slate-900 flex justify-between items-baseline gap-4">
          <span className="text-lg md:text-xl font-bold text-slate-900">Estimated cash to seller</span>
          <span className="text-2xl md:text-3xl font-black text-slate-950 tabular-nums">{money(net)}</span>
        </div>
        {extraTotal(sheet) > 0 && (
          <p className="text-sm text-slate-500 mt-3">Includes additional costs your agent added for this sale.</p>
        )}

        <p className="text-sm leading-relaxed text-slate-500 mt-8 pt-6 border-t border-slate-200">
          This is a planning estimate for discussion, not a closing statement or legal disclosure.
          Final figures come from the title company or closing attorney and can change.
        </p>
      </div>
    </div>
  )
}

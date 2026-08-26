'use client'

import { useState } from 'react'
import { SharePreviewButtons } from '@/app/components/SharePreviewButtons'
import {
  EXTRA_FIELDS,
  applyAiToSheet,
  asNetSheet,
  blankNetSheet,
  commissionAmount,
  describeAiApply,
  extraField,
  formatMoneyInput,
  money,
  netProceeds,
  netSheetAiPrompt,
  parseMoneyInput,
  parseNetSheetAi,
  sheetTitle,
  transferTaxAmount,
  type ExtraFieldKey,
  type NetSheet,
} from '@/app/lib/netSheet'

interface NetSheetViewProps {
  sheets: NetSheet[]
  updateSheets: (updater: (prev: NetSheet[]) => NetSheet[]) => void
  showCustomModal: (msg: string, requireAuth?: boolean) => void
  switchView: (view: string) => void
  userId?: string
  persistWorkspace?: () => Promise<boolean>
  signedIn?: boolean
  exitView?: string
}

const PLACE = 2
const PRICE = 3
const LOAN = 4
const COMMISSION = 5
const CLOSING = 6
const REVIEW = 7
const EXTRAS = 8
const LAST = 8

const inputClass = 'w-full bg-slate-800 border border-slate-700 rounded-xl py-4 text-2xl font-black text-white focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

function DollarField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div>
      <label className="text-base font-bold text-slate-300 block mb-1">{label}</label>
      {hint && <p className="text-base text-slate-400 mb-2">{hint}</p>}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xl">$</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={formatMoneyInput(value)}
          onChange={e => {
            const el = e.target
            const caret = el.selectionStart ?? el.value.length
            const digitsBefore = el.value.slice(0, caret).replace(/\D/g, '').length
            const next = parseMoneyInput(el.value)
            onChange(next)
            requestAnimationFrame(() => {
              const shown = formatMoneyInput(next)
              let i = 0
              let seen = 0
              while (i < shown.length && seen < digitsBefore) {
                if (/\d/.test(shown[i])) seen++
                i++
              }
              el.setSelectionRange(i, i)
            })
          }}
          className={`${inputClass} pl-9 pr-4`}
        />
      </div>
    </div>
  )
}

export function NetSheetView({
  sheets,
  updateSheets,
  showCustomModal,
  switchView,
  userId,
  persistWorkspace,
  signedIn,
  exitView = 'home',
}: NetSheetViewProps) {
  const [step, setStep] = useState(1)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [aiPaste, setAiPaste] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiNote, setAiNote] = useState('')
  const [copied, setCopied] = useState(false)

  const sheet = asNetSheet(sheets.find(s => s.id === activeId) || null)

  const save = (next: NetSheet) => {
    const stamped = { ...next, updatedAt: new Date().toISOString() }
    updateSheets(prev => prev.some(s => s.id === stamped.id)
      ? prev.map(s => s.id === stamped.id ? stamped : s)
      : [stamped, ...prev])
  }

  const startNew = () => {
    const created = blankNetSheet()
    updateSheets(prev => [created, ...prev])
    setActiveId(created.id)
    setAiPaste('')
    setAiError('')
    setAiNote('')
    setStep(PLACE)
  }

  const openSheet = (id: string) => {
    setActiveId(id)
    setAiPaste('')
    setAiError('')
    setAiNote('')
    setStep(REVIEW)
  }

  const removeSheet = (id: string) => {
    updateSheets(prev => prev.filter(s => s.id !== id))
    if (activeId === id) {
      setActiveId(null)
      setStep(1)
    }
  }

  const patch = (partial: Partial<NetSheet>) => {
    if (!sheet) return
    save({ ...sheet, ...partial })
  }

  const setExtra = (key: ExtraFieldKey, amount: number | null) => {
    if (!sheet) return
    const extras = { ...sheet.extras }
    if (amount === null) delete extras[key]
    else extras[key] = amount
    patch({ extras })
  }

  const applyFromPaste = (raw: string, { requireValid = false } = {}) => {
    if (!sheet) return false
    const text = raw.trim()
    if (!text) return !requireValid
    try {
      const parsed = parseNetSheetAi(text)
      save(applyAiToSheet(sheet, parsed))
      setAiNote(describeAiApply(parsed))
      setAiError('')
      return true
    } catch (error) {
      if (requireValid) {
        setAiError(error instanceof Error ? error.message : 'That did not look like the JSON we need. Copy the whole AI answer and paste it again.')
      }
      return false
    }
  }

  const applyAi = () => {
    applyFromPaste(aiPaste, { requireValid: true })
  }

  const copyPrompt = () => {
    if (!sheet) return
    navigator.clipboard.writeText(netSheetAiPrompt(sheet)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }).catch(() => showCustomModal('Copy the prompt from the box above.'))
  }

  const shareUrl = userId && activeId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/netsheet/${userId}/${activeId}`
    : ''

  const handleCopy = () => {
    if (!signedIn) {
      showCustomModal('', true)
      return
    }
    if (!shareUrl) {
      showCustomModal('Save this sheet first.')
      return
    }
    navigator.clipboard.writeText(shareUrl).then(() => {
      showCustomModal(`Link copied. Send this to your seller:\n\n${shareUrl}`)
    }).catch(() => {
      showCustomModal(`Copy this link:\n\n${shareUrl}`)
    })
  }

  const back = () => {
    if (step === 1) switchView(exitView)
    else if (step === REVIEW) setStep(1)
    else if (step === EXTRAS) setStep(REVIEW)
    else if (step === PLACE) setStep(1)
    else setStep(step - 1)
  }

  const progress = step === 1 ? 0 : (step / LAST) * 100
  const questionStep = step >= PLACE && step <= CLOSING
  const sortedSheets = [...sheets].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))

  return (
    <div id="view-netsheet" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50 flex flex-col">
      <div className="flex-none h-[72px] flex items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
        <button onClick={back} className="text-slate-400 hover:text-white transition flex items-center">
          <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          <span className="text-sm font-bold uppercase tracking-wider hidden sm:inline-block">{step === 1 ? 'Close' : 'Back'}</span>
        </button>
        <div className="flex-1 mx-4 bg-slate-800 rounded-full h-3 overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
        {questionStep && (
          <span className="text-xs font-bold tracking-wider uppercase text-slate-500 whitespace-nowrap">{step - 1} of 5</span>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-6 py-6">
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <span className="text-sm font-bold tracking-widest text-emerald-400 uppercase font-money">Money Stuff</span>
              <h3 className="text-2xl font-black text-white mt-1">Seller Net Sheet</h3>
              <p className="text-base text-slate-400 mt-2">We will ask a few easy questions and do the math. You can add extra costs at the end.</p>
            </div>
            <button
              onClick={startNew}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 mb-6"
            >
              Start a new net sheet
            </button>
            <div className="space-y-3">
              {sortedSheets.length === 0 ? (
                <p className="text-base text-slate-500 text-center py-8">No sheets yet. Start one for a listing.</p>
              ) : (
                sortedSheets.map(item => (
                  <div key={item.id} className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openSheet(item.id)}
                      className="flex-1 text-left bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-4"
                    >
                      <h4 className="font-bold text-white text-lg">{sheetTitle(item)}</h4>
                      <p className="text-sm text-emerald-400 font-black mt-1">{money(netProceeds(item))} estimated net</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSheet(item.id)}
                      aria-label={`Remove ${sheetTitle(item)}`}
                      className="w-12 bg-slate-800 border border-slate-700 hover:border-rose-400/60 rounded-xl text-slate-500 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {sheet && step === PLACE && (
          <div className="space-y-5">
            <h3 className="text-2xl font-black text-white">Where is the house?</h3>
            <p className="text-base text-slate-400">City, state, and county help us estimate local fees. Street address is for the seller copy.</p>
            <div>
              <label className="text-base font-bold text-slate-300 block mb-1">Street address</label>
              <input value={sheet.address} onChange={e => patch({ address: e.target.value })} placeholder="123 Main Street" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-base font-bold text-slate-300 block mb-1">City</label>
              <input value={sheet.city} onChange={e => patch({ city: e.target.value })} placeholder="Fort Lauderdale" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-base font-bold text-slate-300 block mb-1">State</label>
                <input value={sheet.state} onChange={e => patch({ state: e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() })} placeholder="FL" maxLength={2} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold uppercase text-center focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-base font-bold text-slate-300 block mb-1">County</label>
                <input value={sheet.county} onChange={e => patch({ county: e.target.value })} placeholder="Broward" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
          </div>
        )}

        {sheet && step === PRICE && (
          <div className="space-y-5">
            <h3 className="text-2xl font-black text-white">What is the sale price?</h3>
            <DollarField
              label="Sale price"
              hint="The price the buyer is paying. If you are still pricing it, use your recommended list price."
              value={sheet.salePrice}
              onChange={salePrice => patch({ salePrice })}
            />
          </div>
        )}

        {sheet && step === LOAN && (
          <div className="space-y-5">
            <h3 className="text-2xl font-black text-white">What do they still owe?</h3>
            <DollarField
              label="Mortgage payoff"
              hint="The remaining first mortgage. If you do not know yet, put your best guess. You can add a second mortgage later."
              value={sheet.mortgagePayoff}
              onChange={mortgagePayoff => patch({ mortgagePayoff })}
            />
            <button
              type="button"
              onClick={() => { patch({ mortgagePayoff: 0 }); setStep(COMMISSION) }}
              className="w-full text-emerald-400 font-bold py-2"
            >
              They don&apos;t have a mortgage
            </button>
          </div>
        )}

        {sheet && step === COMMISSION && (
          <div className="space-y-5">
            <h3 className="text-2xl font-black text-white">What is the commission?</h3>
            <p className="text-base text-slate-400">This is the total percent paid from the sale, usually split between both agents. 5% or 6% is common.</p>
            <div>
              <label className="text-base font-bold text-slate-300 block mb-1">Total commission %</label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={sheet.agentCommissionPct || ''}
                onChange={e => patch({ agentCommissionPct: parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0 })}
                className={`${inputClass} px-4`}
              />
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">That equals</p>
              <p className="text-3xl font-black text-white mt-1">{money(commissionAmount(sheet))}</p>
            </div>
          </div>
        )}

        {sheet && step === CLOSING && (
          <div className="space-y-5">
            <h3 className="text-2xl font-black text-white">Typical closing costs</h3>
            <p className="text-base text-slate-400">Transfer tax is a percent of the sale price. Title and escrow is a dollar amount from the closing company.</p>
            <div>
              <label className="text-base font-bold text-slate-300 block mb-1">Transfer tax %</label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={sheet.transferTaxPct || ''}
                onChange={e => patch({ transferTaxPct: parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0 })}
                className={`${inputClass} px-4`}
              />
              <p className="text-sm text-slate-500 mt-2">{money(transferTaxAmount(sheet))} on this sale price</p>
            </div>
            <DollarField
              label="Title & escrow fees"
              hint="What the title company charges to close. If you are unsure, use the AI helper below."
              value={sheet.titleEscrowFee}
              onChange={titleEscrowFee => patch({ titleEscrowFee })}
            />

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
              <h4 className="text-emerald-400 font-black">Optional: ask AI for local numbers</h4>
              <p className="text-base text-slate-300">Copy this prompt into ChatGPT, Claude, Gemini, or any model. Paste the answer below — we fill in the numbers for you.</p>
              <pre className="bg-slate-950 text-[11px] leading-relaxed text-slate-400 rounded-xl p-3 max-h-36 overflow-y-auto whitespace-pre-wrap">{netSheetAiPrompt(sheet)}</pre>
              <button type="button" onClick={copyPrompt} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl">
                {copied ? 'Copied' : 'Copy prompt'}
              </button>
              <textarea
                value={aiPaste}
                onChange={e => {
                  const value = e.target.value
                  setAiPaste(value)
                  applyFromPaste(value)
                }}
                onPaste={e => {
                  const text = e.clipboardData.getData('text')
                  if (!text) return
                  e.preventDefault()
                  setAiPaste(text)
                  applyFromPaste(text)
                }}
                placeholder="Paste the AI answer here. We will pull the numbers out automatically."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white min-h-[110px] focus:outline-none focus:border-emerald-500"
              />
              <button type="button" onClick={applyAi} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl">
                Use these numbers
              </button>
              {aiError && <p className="text-sm text-rose-400">{aiError}</p>}
              {aiNote && <p className="text-sm text-emerald-300">{aiNote}</p>}
            </div>
          </div>
        )}

        {sheet && step === REVIEW && (
          <div className="space-y-5">
            <div className="text-center">
              <span className="text-sm font-bold tracking-widest text-emerald-400 uppercase font-money">Basic net sheet</span>
              <h3 className="text-2xl font-black text-white mt-1">{sheetTitle(sheet)}</h3>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
              <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Estimated cash at closing</p>
              <p className="text-5xl font-black text-emerald-400 mt-1">{money(netProceeds(sheet))}</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 text-base font-bold space-y-2">
              <div className="flex justify-between text-white"><span>Sale price</span><span>{money(sheet.salePrice)}</span></div>
              <div className="flex justify-between text-rose-400"><span>Mortgage payoff</span><span>-{money(sheet.mortgagePayoff)}</span></div>
              <div className="flex justify-between text-rose-400"><span>{sheet.agentCommissionPct}% commission</span><span>-{money(commissionAmount(sheet))}</span></div>
              <div className="flex justify-between text-rose-400"><span>Transfer tax</span><span>-{money(transferTaxAmount(sheet))}</span></div>
              <div className="flex justify-between text-rose-400"><span>Title & escrow</span><span>-{money(sheet.titleEscrowFee)}</span></div>
              {Object.entries(sheet.extras).filter(([, amount]) => Number(amount) > 0).map(([key, amount]) => (
                <div key={key} className="flex justify-between text-rose-400">
                  <span>{extraField(key)?.label || key}</span>
                  <span>-{money(Number(amount) || 0)}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(EXTRAS)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-slate-700"
            >
              Add more costs
            </button>
            <button
              type="button"
              onClick={() => setStep(PLACE)}
              className="w-full text-slate-400 hover:text-white font-bold py-2"
            >
              Change these numbers
            </button>
          </div>
        )}

        {sheet && step === EXTRAS && (
          <div className="space-y-5 pb-8">
            <h3 className="text-2xl font-black text-white">Add extra costs</h3>
            <p className="text-base text-slate-400">Turn on only what applies. Leave the rest off. You can come back later.</p>
            {(['loans', 'closing', 'other'] as const).map(group => (
              <div key={group} className="space-y-3">
                <p className="text-sm font-bold tracking-widest uppercase text-slate-500">
                  {group === 'loans' ? 'Other loans & payoffs' : group === 'closing' ? 'More closing costs' : 'Other seller costs'}
                </p>
                {EXTRA_FIELDS.filter(f => f.group === group).map(field => {
                  const on = sheet.extras[field.key] !== undefined
                  return (
                    <div key={field.key} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-white">{field.label}</p>
                          <p className="text-sm text-slate-400 mt-1">{field.hint}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExtra(field.key, on ? null : 0)}
                          className={`flex-shrink-0 w-12 h-7 rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-900 border border-slate-600'}`}
                          aria-label={on ? `Remove ${field.label}` : `Add ${field.label}`}
                        >
                          <span className={`block w-5 h-5 bg-white rounded-full mt-1 transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`}></span>
                        </button>
                      </div>
                      {on && (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={formatMoneyInput(sheet.extras[field.key] || 0)}
                            onChange={e => setExtra(field.key, parseMoneyInput(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 [appearance:textfield]"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {sheet && step > 1 && step < REVIEW && (
        <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 pb-safe">
          <button
            type="button"
            onClick={() => {
              if (step === CLOSING && aiPaste.trim() && !applyFromPaste(aiPaste, { requireValid: true })) return
              setStep(step + 1)
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl"
          >
            Continue
          </button>
        </div>
      )}

      {sheet && step === REVIEW && (
        <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 pb-safe">
          <SharePreviewButtons
            url={shareUrl}
            copyLabel="Copy Link"
            accentClass="bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            onCopy={handleCopy}
            onNeedAuth={!userId ? () => showCustomModal('', true) : undefined}
            beforeShare={persistWorkspace}
          />
          <p className="text-sm text-slate-500 text-center mt-3">Preview is the seller copy. They can save it as a PDF from that page.</p>
        </div>
      )}

      {sheet && step === EXTRAS && (
        <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 pb-safe">
          <button
            type="button"
            onClick={() => setStep(REVIEW)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl"
          >
            Done, show my sheet
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { mailStatus, sendOneMail } from '@/app/actions/mail'
import { ConfirmDeleteDialog } from '@/app/components/ConfirmDeleteDialog'
import { OverlayNavButton, ToolOverlay } from '@/app/components/OverlayNavButton'
import { ToolTile } from '@/app/components/ToolTile'
import {
  MAIL_MAX_RECIPIENTS,
  addressError,
  emptyAddress,
  parseAddressList,
  type MailAddress,
  type MailKind,
} from '@/app/lib/lobMail'
import { supabase } from '@/utils/supabase'

const FROM_KEY = 'crt_mail_from'

type PieceResult = { name: string; status: 'wait' | 'sending' | 'sent' | 'error'; detail: string; url?: string }

function loadFrom(profileName: string): MailAddress {
  try {
    const raw = localStorage.getItem(FROM_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as MailAddress
      if (saved?.line1) return { ...emptyAddress(), ...saved }
    }
  } catch {}
  return { ...emptyAddress(), name: profileName }
}

export function MailView({
  switchView,
  showCustomModal,
  signedIn,
  profileName,
}: {
  switchView: (view: string) => void
  showCustomModal: (msg: string, requireAuth?: boolean) => void
  signedIn: boolean
  profileName: string
}) {
  const [kind, setKind] = useState<MailKind | null>(null)
  const [from, setFrom] = useState<MailAddress>(() => emptyAddress())
  const [fromReady, setFromReady] = useState(false)
  const [headline, setHeadline] = useState('')
  const [message, setMessage] = useState('')
  const [recipients, setRecipients] = useState<MailAddress[]>([emptyAddress()])
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteProblems, setPasteProblems] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<PieceResult[] | null>(null)
  const [mode, setMode] = useState<{ configured: boolean; test: boolean } | null>(null)

  useEffect(() => {
    setFrom(loadFrom(profileName))
    setFromReady(true)
  }, [])

  useEffect(() => {
    if (!profileName) return
    setFrom((prev) => (prev.name.trim() ? prev : { ...prev, name: profileName }))
  }, [profileName])

  useEffect(() => {
    void mailStatus().then(setMode)
  }, [])

  useEffect(() => {
    if (!fromReady) return
    localStorage.setItem(FROM_KEY, JSON.stringify(from))
  }, [from, fromReady])

  const noun = kind === 'letter' ? 'letter' : 'postcard'
  const readyRecipients = recipients.filter((item) => !addressError(item))
  const count = readyRecipients.length

  const updateRecipient = (index: number, patch: Partial<MailAddress>) => {
    setRecipients((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const addPasted = () => {
    const parsed = parseAddressList(pasteText)
    setPasteProblems(parsed.problems)
    if (!parsed.recipients.length) return
    setRecipients((prev) => {
      const kept = prev.filter((item) => item.name.trim() || item.line1.trim())
      return [...kept, ...parsed.recipients].slice(0, MAIL_MAX_RECIPIENTS)
    })
    setPasteText('')
    setPasteOpen(false)
  }

  const prepareSend = async () => {
    if (!signedIn) {
      showCustomModal('Sign in to send mail.', true)
      return
    }
    const status = await mailStatus()
    setMode(status)
    if (!status.configured) {
      showCustomModal('The server still can’t see a Lob key named LOB_API_KEY.')
      return
    }
    if (addressError(from)) {
      showCustomModal(`Return address: ${addressError(from)}`)
      return
    }
    if (!message.trim()) {
      showCustomModal(kind === 'postcard' ? 'Write the note on the back.' : 'Write the letter.')
      return
    }
    const bad = recipients.find((item) => (item.name.trim() || item.line1.trim()) && addressError(item))
    if (bad) {
      showCustomModal(addressError(bad))
      return
    }
    if (!count) {
      showCustomModal('Add at least one address.')
      return
    }
    setConfirming(true)
  }

  const startSend = async () => {
    if (!kind || sending) return
    setConfirming(false)
    if (!signedIn) {
      showCustomModal('Sign in to send mail.', true)
      return
    }
    const fromProblem = addressError(from)
    if (fromProblem) {
      showCustomModal(`Return address: ${fromProblem}`)
      return
    }
    if (!message.trim()) {
      showCustomModal(kind === 'postcard' ? 'Write the note on the back.' : 'Write the letter.')
      return
    }
    const bad = recipients.find((item) => (item.name.trim() || item.line1.trim()) && addressError(item))
    if (bad) {
      showCustomModal(addressError(bad))
      return
    }
    if (!count) {
      showCustomModal('Add at least one address.')
      return
    }
    if (count > MAIL_MAX_RECIPIENTS) {
      showCustomModal(`Send up to ${MAIL_MAX_RECIPIENTS} at a time.`)
      return
    }

    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      showCustomModal('Sign in to send mail.', true)
      return
    }

    const queue = recipients.filter((item) => !addressError(item))
    setResults(queue.map((item) => ({ name: item.name, status: 'wait', detail: '' })))
    setSending(true)
    for (let i = 0; i < queue.length; i++) {
      setResults((prev) => (prev || []).map((item, index) => (index === i ? { ...item, status: 'sending' } : item)))
      const result = await sendOneMail({
        accessToken: token,
        kind,
        from,
        to: queue[i],
        headline,
        message,
      })
      setResults((prev) => (prev || []).map((item, index) => {
        if (index !== i) return item
        if ('error' in result && result.error) return { ...item, status: 'error' as const, detail: result.error }
        return { ...item, status: 'sent', detail: result.expectedDelivery ? `Expected ${result.expectedDelivery}` : 'Sent', url: result.url }
      }))
    }
    setSending(false)
  }

  if (!kind) {
    return (
      <ToolOverlay id="view-mail" nav={<OverlayNavButton kind="back" label="Home" onClick={() => switchView('home')} />}>
        <div className="text-center mb-2">
          <h1 className="text-3xl font-black">Send mail</h1>
          <p className="text-base text-slate-400 mt-2">One piece, or a whole list.</p>
        </div>
        <ToolTile
          onClick={() => setKind('postcard')}
          className="bg-amber-300 hover:bg-amber-200 text-slate-950 p-6 rounded-3xl shadow-xl min-h-[120px] flex flex-col justify-end"
        >
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">4×6</span>
          <h2 className="text-3xl font-black mt-1">Postcard</h2>
        </ToolTile>
        <ToolTile
          onClick={() => setKind('letter')}
          className="bg-white hover:bg-slate-100 text-slate-950 p-6 rounded-3xl shadow-xl min-h-[120px] flex flex-col justify-end"
        >
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">In an envelope</span>
          <h2 className="text-3xl font-black mt-1">Letter</h2>
        </ToolTile>
        {mode && !mode.configured ? (
          <p className="text-sm text-amber-200">Mail is not connected yet.</p>
        ) : mode?.test ? (
          <p className="text-sm text-slate-400">Test mode. Lob will not actually mail these.</p>
        ) : null}
      </ToolOverlay>
    )
  }

  if (results) {
    const sent = results.filter((item) => item.status === 'sent').length
    return (
      <ToolOverlay
        id="view-mail"
        nav={<OverlayNavButton kind="back" label="Edit" onClick={() => { if (!sending) setResults(null) }} />}
      >
        <h1 className="text-3xl font-black">{sending ? 'Sending…' : `${sent} sent`}</h1>
        <ul className="space-y-3">
          {results.map((item, index) => (
            <li key={`${item.name}-${index}`} className="rounded-2xl bg-slate-800 px-4 py-3">
              <p className="font-black">{item.name}</p>
              <p className="text-sm text-slate-300 mt-1">
                {item.status === 'wait' && 'Waiting'}
                {item.status === 'sending' && 'Sending'}
                {item.status === 'sent' && item.detail}
                {item.status === 'error' && item.detail}
              </p>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-amber-300 underline mt-1 inline-block">
                  See the proof
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </ToolOverlay>
    )
  }

  return (
    <ToolOverlay id="view-mail" nav={<OverlayNavButton kind="back" label="Mail" onClick={() => setKind(null)} />}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{noun}</p>
        <h1 className="text-3xl font-black mt-1">{kind === 'postcard' ? 'Write the card' : 'Write the letter'}</h1>
      </div>

      <AddressFields label="Your return address" address={from} onChange={setFrom} />

      {kind === 'postcard' ? (
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Front headline</span>
          <input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            placeholder="Just listed on Oak"
            className={fieldClass}
          />
        </label>
      ) : null}
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{kind === 'postcard' ? 'Note on the back' : 'Letter'}</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={kind === 'postcard' ? 5 : 8}
          placeholder={kind === 'postcard' ? 'A short note they can read at the mailbox.' : 'Dear …'}
          className={fieldClass}
        />
      </label>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Who gets it</h2>
        <button type="button" onClick={() => setPasteOpen((open) => !open)} className="text-sm font-bold text-amber-300">
          Paste a list
        </button>
      </div>
      {pasteOpen ? (
        <div className="space-y-2">
          <textarea
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
            rows={5}
            placeholder={'Jane Smith, 123 Oak St, Austin, TX 78701'}
            className={fieldClass}
          />
          <button type="button" onClick={addPasted} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl">
            Add these addresses
          </button>
        </div>
      ) : null}
      {pasteProblems.map((problem) => (
        <p key={problem} className="text-sm text-rose-300">{problem}</p>
      ))}

      {recipients.map((recipient, index) => (
        <div key={index} className="rounded-2xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-400">Address {index + 1}</p>
            {recipients.length > 1 ? (
              <button
                type="button"
                onClick={() => setRecipients((prev) => prev.filter((_, i) => i !== index))}
                className="text-sm font-bold text-slate-400"
              >
                Remove
              </button>
            ) : null}
          </div>
          <AddressFields address={recipient} onChange={(next) => updateRecipient(index, next)} />
        </div>
      ))}
      {recipients.length < MAIL_MAX_RECIPIENTS ? (
        <button
          type="button"
          onClick={() => setRecipients((prev) => [...prev, emptyAddress()])}
          className="w-full border border-slate-700 text-white font-bold py-3 rounded-xl"
        >
          Add another address
        </button>
      ) : null}

      <button
        type="button"
        disabled={sending}
        onClick={() => { void prepareSend() }}
        className="w-full bg-amber-300 hover:bg-amber-200 disabled:opacity-50 text-slate-950 font-black py-4 rounded-xl"
      >
        {count > 1 ? `Send ${count} ${noun}s` : `Send this ${noun}`}
      </button>
      <p className="text-sm text-slate-400 text-center">
        {mode && !mode.configured
          ? 'The Lob key is not on the server yet.'
          : mode?.test
            ? 'Test mode. Nothing gets mailed.'
            : 'Lob prints these and mails them.'}
      </p>

      {confirming ? (
        <ConfirmDeleteDialog
          message={mode?.test
            ? `Create ${count} test ${noun}${count === 1 ? '' : 's'}? Nothing gets mailed.`
            : `Send ${count} ${noun}${count === 1 ? '' : 's'}? Lob will print and mail ${count === 1 ? 'it' : 'them'}.`}
          confirmLabel={mode?.test ? 'Create test' : 'Send'}
          cancelLabel="Not yet"
          confirmClass="bg-amber-300 hover:bg-amber-200 text-slate-950"
          onCancel={() => setConfirming(false)}
          onConfirm={() => { void startSend() }}
        />
      ) : null}
    </ToolOverlay>
  )
}

const fieldClass = 'mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500'

function AddressFields({
  label,
  address,
  onChange,
}: {
  label?: string
  address: MailAddress
  onChange: (next: MailAddress) => void
}) {
  const set = (key: keyof MailAddress) => (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...address, [key]: event.target.value })
  }
  return (
    <div className="space-y-2">
      {label ? <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p> : null}
      <input value={address.name} onChange={set('name')} placeholder="Name" className={fieldClass} />
      <input value={address.line1} onChange={set('line1')} placeholder="Street" className={fieldClass} />
      <input value={address.line2} onChange={set('line2')} placeholder="Apt, suite (optional)" className={fieldClass} />
      <div className="grid grid-cols-[1fr_4.5rem_6rem] gap-2">
        <input value={address.city} onChange={set('city')} placeholder="City" className={fieldClass} />
        <input value={address.state} onChange={set('state')} placeholder="ST" maxLength={2} className={fieldClass} />
        <input value={address.zip} onChange={set('zip')} placeholder="ZIP" className={fieldClass} />
      </div>
    </div>
  )
}

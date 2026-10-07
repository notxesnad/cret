'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  createPostcardProofs,
  finishPostcardCheckout,
  loadPostcardOrder,
  startPostcardCheckout,
} from '@/app/actions/postcards'
import { OverlayNavButton, ToolOverlay } from '@/app/components/OverlayNavButton'
import {
  addressError,
  emptyAddress,
  parseAddressList,
  type MailAddress,
} from '@/app/lib/lobMail'
import {
  POSTCARD_MAX,
  POSTCARD_PRICE_CENTS,
  POSTCARD_TEMPLATES,
} from '@/app/lib/postcardDesigns'
import { supabase } from '@/utils/supabase'

const FROM_KEY = 'crt_mail_from'

type Phase = 'pick' | 'pictures' | 'who' | 'proof' | 'mailing' | 'done'
type Proof = { name: string; url: string; thumb: string }

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

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

export function PostcardMail({
  onBack,
  showCustomModal,
  signedIn,
  profileName,
  headshotUrl,
}: {
  onBack: () => void
  showCustomModal: (msg: string, requireAuth?: boolean) => void
  signedIn: boolean
  profileName: string
  headshotUrl: string
}) {
  const params = useSearchParams()
  const orderFromUrl = params.get('postcard_order') || ''
  const sessionFromUrl = params.get('session_id') || ''
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadSide = useRef<'front' | 'back'>('front')
  const startedReturn = useRef(false)

  const [phase, setPhase] = useState<Phase>(orderFromUrl ? 'mailing' : 'pick')
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [frontUrl, setFrontUrl] = useState<string | null>(null)
  const [backUrl, setBackUrl] = useState<string | null>(null)
  const [useHeadshot, setUseHeadshot] = useState(false)
  const [line, setLine] = useState('')
  const [from, setFrom] = useState<MailAddress>(() => emptyAddress())
  const [fromReady, setFromReady] = useState(false)
  const [recipients, setRecipients] = useState<MailAddress[]>([emptyAddress()])
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteProblems, setPasteProblems] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [working, setWorking] = useState(false)
  const [orderId, setOrderId] = useState(orderFromUrl)
  const [proofs, setProofs] = useState<Proof[]>([])
  const [agreed, setAgreed] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [paidCount, setPaidCount] = useState(0)

  const template = POSTCARD_TEMPLATES.find((item) => item.id === templateId) || null
  const ready = recipients.filter((item) => !addressError(item))
  const price = ready.length * POSTCARD_PRICE_CENTS

  useEffect(() => {
    setFrom(loadFrom(profileName))
    setFromReady(true)
  }, [])

  useEffect(() => {
    if (!profileName) return
    setFrom((prev) => (prev.name.trim() ? prev : { ...prev, name: profileName }))
  }, [profileName])

  useEffect(() => {
    if (!fromReady) return
    localStorage.setItem(FROM_KEY, JSON.stringify(from))
  }, [from, fromReady])

  useEffect(() => {
    if (!orderFromUrl || startedReturn.current) return
    startedReturn.current = true
    void (async () => {
      const token = await accessToken()
      if (!token) {
        showCustomModal('Sign in to see this postcard.', true)
        setPhase('pick')
        return
      }
      if (sessionFromUrl) {
        setPhase('mailing')
        const result = await finishPostcardCheckout({
          accessToken: token,
          orderId: orderFromUrl,
          sessionId: sessionFromUrl,
        })
        if (!('proofs' in result) || result.error) {
          showCustomModal('error' in result && result.error ? result.error : 'Payment did not finish.')
          const saved = orderFromLoad(await loadPostcardOrder({ accessToken: token, orderId: orderFromUrl }))
          if (saved) {
            setProofs(saved.proofs)
            setPaidCount(saved.count)
            setTestMode(saved.test)
            setOrderId(saved.orderId)
            setPhase(saved.status === 'sent' ? 'done' : 'proof')
          } else {
            setPhase('pick')
          }
          return
        }
        setProofs(result.proofs || [])
        setTestMode(Boolean(result.test))
        setPaidCount((result.proofs || []).length)
        setPhase('done')
        return
      }
      const loaded = await loadPostcardOrder({ accessToken: token, orderId: orderFromUrl })
      const saved = orderFromLoad(loaded)
      if (!saved) {
        showCustomModal('error' in loaded && loaded.error ? loaded.error : 'That postcard order was not found.')
        setPhase('pick')
        return
      }
      setProofs(saved.proofs)
      setPaidCount(saved.count)
      setTestMode(saved.test)
      setOrderId(saved.orderId)
      setPhase(saved.status === 'sent' ? 'done' : 'proof')
    })()
  }, [orderFromUrl, sessionFromUrl, showCustomModal])

  const pickTemplate = (id: string) => {
    const next = POSTCARD_TEMPLATES.find((item) => item.id === id)
    if (!next) return
    setTemplateId(next.id)
    setFrontUrl(null)
    setBackUrl(null)
    setLine(next.line)
    setAgreed(false)
    setPhase('who')
  }

  const uploadPicture = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || uploading) return
    if (!signedIn) {
      showCustomModal('Sign in to upload a picture.', true)
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showCustomModal('Use a JPEG, PNG, or WebP picture.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      showCustomModal('That picture is too big. Use one under 8 MB.')
      return
    }
    setUploading(true)
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id
    if (!userId) {
      setUploading(false)
      showCustomModal('Sign in to upload a picture.', true)
      return
    }
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const fileName = `${userId}/postcard-${uploadSide.current}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('profiles').upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    })
    setUploading(false)
    if (error) {
      showCustomModal('That picture did not upload. Try again.')
      return
    }
    const publicUrl = supabase.storage.from('profiles').getPublicUrl(fileName).data.publicUrl
    setTemplateId(null)
    if (uploadSide.current === 'back') setBackUrl(publicUrl)
    else setFrontUrl(publicUrl)
    setAgreed(false)
  }

  const addPasted = () => {
    const parsed = parseAddressList(pasteText)
    setPasteProblems(parsed.problems)
    if (!parsed.recipients.length) return
    setRecipients((prev) => {
      const kept = prev.filter((item) => item.name.trim() || item.line1.trim())
      return [...kept, ...parsed.recipients].slice(0, POSTCARD_MAX)
    })
    setPasteText('')
    setPasteOpen(false)
  }

  const makeProof = async () => {
    if (!signedIn) {
      showCustomModal('Sign in to mail a postcard.', true)
      return
    }
    if (!templateId && !frontUrl) {
      showCustomModal('Pick a postcard or add your pictures first.')
      setPhase('pick')
      return
    }
    if (frontUrl && !backUrl) {
      showCustomModal('Add the back picture too.')
      setPhase('pictures')
      return
    }
    if (templateId && !line.trim()) {
      showCustomModal('Type the line that goes on the card. A street is fine.')
      return
    }
    if (addressError(from)) {
      showCustomModal(`Your return address: ${addressError(from)}`)
      return
    }
    const bad = recipients.find((item) => (item.name.trim() || item.line1.trim()) && addressError(item))
    if (bad) {
      showCustomModal(addressError(bad))
      return
    }
    if (!ready.length) {
      showCustomModal('Add the name and address of who gets it.')
      return
    }
    if (ready.length > POSTCARD_MAX) {
      showCustomModal(`Send up to ${POSTCARD_MAX} at a time.`)
      return
    }
    const token = await accessToken()
    if (!token) {
      showCustomModal('Sign in to mail a postcard.', true)
      return
    }
    setWorking(true)
    setPhase('mailing')
    const result = await createPostcardProofs({
      accessToken: token,
      from,
      recipients: ready,
      templateId,
      frontUrl,
      backUrl,
      headshotUrl: useHeadshot ? headshotUrl : null,
      line,
    })
    setWorking(false)
    if ('error' in result && result.error) {
      showCustomModal(result.error)
      setPhase('who')
      return
    }
    setOrderId(result.orderId || '')
    setProofs(result.proofs || [])
    setTestMode(Boolean(result.test))
    setAgreed(false)
    setPhase('proof')
  }

  const pay = async () => {
    if (!agreed) {
      showCustomModal('Look at the proof, then check the box.')
      return
    }
    if (!orderId) {
      showCustomModal('Make the proof again.')
      setPhase('who')
      return
    }
    if (!proofs.some((item) => item.url)) {
      showCustomModal('The proof did not come back. Make it again before you pay.')
      return
    }
    const token = await accessToken()
    if (!token) {
      showCustomModal('Sign in to pay.', true)
      return
    }
    setWorking(true)
    const result = await startPostcardCheckout({ accessToken: token, orderId })
    setWorking(false)
    if ('error' in result && result.error) {
      showCustomModal(result.error)
      return
    }
    if (result.url) window.location.href = result.url
  }

  const back = () => {
    if (working) return
    if (phase === 'pictures') {
      setPhase('pick')
      return
    }
    if (phase === 'who') {
      setPhase(frontUrl ? 'pictures' : 'pick')
      return
    }
    if (phase === 'proof' && !orderFromUrl) {
      setPhase('who')
      return
    }
    onBack()
  }

  const stepLabel = phase === 'pick' || phase === 'pictures' ? 'Step 1 of 3' : phase === 'who' ? 'Step 2 of 3' : 'Step 3 of 3'

  return (
    <ToolOverlay id="view-mail" nav={<OverlayNavButton kind="back" label="Back" onClick={back} />}>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { void uploadPicture(event) }} />
      {phase === 'pick' ? (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{stepLabel}</p>
            <h1 className="text-3xl font-black mt-1">Pick a postcard</h1>
            <p className="text-base text-slate-300 mt-2">6×9. {money(POSTCARD_PRICE_CENTS)} each. First class mail.</p>
          </div>
          <button
            type="button"
            onClick={() => setPhase('pictures')}
            className="w-full border-2 border-dashed border-slate-500 text-white font-black py-4 rounded-2xl"
          >
            Use my own pictures
          </button>
          <p className="text-sm text-slate-400 text-center">Add a front and a back. Wide photos work best.</p>
          <p className="text-sm font-bold text-center">Or tap one of these.</p>
          <div className="grid grid-cols-2 gap-3">
            {POSTCARD_TEMPLATES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => pickTemplate(item.id)}
                className="rounded-2xl p-4 min-h-[128px] text-left flex flex-col justify-end shadow-lg"
                style={{ background: item.bg, color: item.ink }}
              >
                <span className="text-2xl font-black leading-none">{item.name}</span>
                <span className="text-sm mt-2" style={{ color: item.accent }}>{item.line}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {phase === 'pictures' ? (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{stepLabel}</p>
            <h1 className="text-3xl font-black mt-1">Add your pictures</h1>
            <p className="text-base text-slate-300 mt-2">One for the front. One for the back. Leave the right side of the back empty. The address goes there.</p>
          </div>
          <PictureSlot
            label="Front"
            url={frontUrl}
            busy={uploading && uploadSide.current === 'front'}
            onPick={() => {
              uploadSide.current = 'front'
              fileRef.current?.click()
            }}
          />
          <PictureSlot
            label="Back"
            url={backUrl}
            busy={uploading && uploadSide.current === 'back'}
            onPick={() => {
              uploadSide.current = 'back'
              fileRef.current?.click()
            }}
          />
          <HeadshotChoice url={headshotUrl} on={useHeadshot} onChange={setUseHeadshot} />
          <button
            type="button"
            onClick={() => {
              if (!frontUrl) {
                showCustomModal('Add the front picture.')
                return
              }
              if (!backUrl) {
                showCustomModal('Add the back picture.')
                return
              }
              setPhase('who')
            }}
            className="w-full bg-amber-300 hover:bg-amber-200 text-slate-950 font-black py-4 rounded-xl"
          >
            Next
          </button>
        </>
      ) : null}

      {phase === 'who' ? (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{stepLabel}</p>
            <h1 className="text-3xl font-black mt-1">Who gets it</h1>
            <p className="text-base text-slate-300 mt-2">
              {frontUrl ? 'Your pictures are the front and the back.' : `${template?.name || 'This card'} is the front.`} Next you will see the real proof.
            </p>
          </div>
          {frontUrl ? (
            <div className="grid grid-cols-2 gap-3">
              <figure>
                <img src={frontUrl} alt="Front of the postcard" className="w-full h-28 object-cover rounded-2xl bg-slate-800" />
                <figcaption className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">Front</figcaption>
              </figure>
              <figure>
                <img src={backUrl || ''} alt="Back of the postcard" className="w-full h-28 object-cover rounded-2xl bg-slate-800" />
                <figcaption className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">Back</figcaption>
              </figure>
            </div>
          ) : template ? (
            <div className="rounded-2xl p-5 min-h-[140px] flex flex-col justify-end" style={{ background: template.bg, color: template.ink }}>
              <p className="text-3xl font-black leading-none">{template.name}</p>
              <p className="text-lg mt-3" style={{ color: template.accent }}>{line || template.line}</p>
            </div>
          ) : null}
          <HeadshotChoice url={headshotUrl} on={useHeadshot} onChange={setUseHeadshot} />
          {template ? (
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">The line on the card</span>
              <input
                value={line}
                onChange={(event) => setLine(event.target.value.slice(0, 80))}
                placeholder="123 Oak Street"
                className={fieldClass}
              />
            </label>
          ) : null}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Send it to</h2>
            <button type="button" onClick={() => setPasteOpen((open) => !open)} className="text-sm font-bold text-amber-300">
              Paste a list
            </button>
          </div>
          {pasteOpen ? (
            <div className="space-y-2">
              <textarea
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                rows={4}
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
                <p className="text-sm font-bold text-slate-400">Person {index + 1}</p>
                {recipients.length > 1 ? (
                  <button type="button" onClick={() => setRecipients((prev) => prev.filter((_, i) => i !== index))} className="text-sm font-bold text-slate-400">
                    Remove
                  </button>
                ) : null}
              </div>
              <AddressFields address={recipient} onChange={(next) => {
                setRecipients((prev) => prev.map((item, i) => (i === index ? next : item)))
              }} />
            </div>
          ))}
          {recipients.length < POSTCARD_MAX ? (
            <button type="button" onClick={() => setRecipients((prev) => [...prev, emptyAddress()])} className="w-full border border-slate-700 text-white font-bold py-3 rounded-xl">
              Add another address
            </button>
          ) : null}
          <AddressFields label="Your return address" address={from} onChange={setFrom} />
          <button type="button" onClick={() => { void makeProof() }} className="w-full bg-amber-300 hover:bg-amber-200 text-slate-950 font-black py-4 rounded-xl">
            {ready.length > 1 ? `See the proof for ${ready.length}` : 'See the proof'}
          </button>
          <p className="text-sm text-slate-400 text-center">Nothing is mailed yet. You look first, then you pay {money(price || POSTCARD_PRICE_CENTS)}.</p>
        </>
      ) : null}

      {phase === 'mailing' ? (
        <div className="py-16 text-center">
          <h1 className="text-3xl font-black">{sessionFromUrl ? 'Mailing your postcard…' : 'Making your proof…'}</h1>
          <p className="text-base text-slate-300 mt-3">This can take a minute. Stay on this page.</p>
        </div>
      ) : null}

      {phase === 'proof' ? (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{stepLabel}</p>
            <h1 className="text-3xl font-black mt-1">Look at the proof</h1>
            <p className="text-base text-slate-300 mt-2">This is the real postcard. Nothing is mailed until you pay.</p>
          </div>
          {testMode ? (
            <p className="text-sm text-amber-200">Practice mode. You can still pay, and the postcard will not be mailed.</p>
          ) : null}
          <ul className="space-y-4">
            {proofs.map((proof, index) => (
              <li key={`${proof.name}-${index}`} className="rounded-2xl bg-slate-800 p-3">
                <p className="font-black px-1">{proof.name}</p>
                {proof.thumb ? (
                  <img src={proof.thumb} alt={`Proof for ${proof.name}`} className="w-full rounded-xl mt-2 bg-white" />
                ) : null}
                {proof.url ? (
                  <a href={proof.url} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center w-full bg-white text-slate-950 font-black py-3 rounded-xl">
                    Open the full proof
                  </a>
                ) : (
                  <p className="text-sm text-rose-300 mt-2">This proof did not come back.</p>
                )}
              </li>
            ))}
          </ul>
          <label className="flex items-start gap-3 rounded-2xl bg-slate-800 p-4">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1 h-6 w-6 accent-amber-300"
            />
            <span className="text-lg font-bold leading-snug">I looked at the proof. It looks right.</span>
          </label>
          <button type="button" onClick={() => { void pay() }} className="w-full bg-amber-300 hover:bg-amber-200 text-slate-950 font-black py-4 rounded-xl">
            {working ? 'Opening payment…' : `Pay ${money(proofs.length * POSTCARD_PRICE_CENTS)} and mail`}
          </button>
        </>
      ) : null}

      {phase === 'done' ? (
        <div className="py-8">
          <h1 className="text-3xl font-black">{testMode ? 'Paid. Practice mode.' : 'Paid. It’s in the mail.'}</h1>
          <p className="text-base text-slate-300 mt-3">
            {testMode
              ? 'Payment went through. Practice mode means the postcard was not mailed.'
              : `${paidCount === 1 ? 'Your postcard is' : `${paidCount} postcards are`} on the way. 6×9, first class.`}
          </p>
          <button type="button" onClick={onBack} className="mt-8 w-full bg-amber-300 text-slate-950 font-black py-4 rounded-xl">
            Done
          </button>
        </div>
      ) : null}
    </ToolOverlay>
  )
}

function orderFromLoad(value: {
  error?: string
  proofs?: Proof[]
  count?: number
  test?: boolean
  orderId?: string
  status?: string
}) {
  if (value.error || !value.proofs || !value.orderId || !value.status) return null
  return {
    proofs: value.proofs,
    count: value.count || value.proofs.length,
    test: Boolean(value.test),
    orderId: value.orderId,
    status: value.status,
  }
}

function HeadshotChoice({
  url,
  on,
  onChange,
}: {
  url: string
  on: boolean
  onChange: (next: boolean) => void
}) {
  if (!url) return null
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left ${on ? 'border-amber-300 bg-slate-800' : 'border-slate-700'}`}
    >
      <img src={url} alt="Your picture" className="h-16 w-16 rounded-full object-cover bg-slate-800" />
      <span className="text-lg font-black leading-snug">
        {on ? 'Your picture will be on the back. Tap to take it off.' : 'Add my picture on the back'}
      </span>
    </button>
  )
}

function PictureSlot({
  label,
  url,
  busy,
  onPick,
}: {
  label: string
  url: string | null
  busy: boolean
  onPick: () => void
}) {
  return (
    <button type="button" onClick={onPick} className="w-full rounded-2xl border-2 border-dashed border-slate-500 overflow-hidden text-left">
      {url ? (
        <img src={url} alt={label} className="w-full h-36 object-cover bg-slate-800" />
      ) : (
        <span className="flex items-center justify-center h-36 text-xl font-black">{busy ? 'Uploading…' : `Add the ${label.toLowerCase()}`}</span>
      )}
      <span className="block px-4 py-3 text-sm font-bold uppercase tracking-wider text-amber-300">
        {url ? `${label} · tap to change` : label}
      </span>
    </button>
  )
}

async function accessToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || ''
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

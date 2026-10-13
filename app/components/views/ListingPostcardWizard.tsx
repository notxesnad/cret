'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { OverlayNavButton, ToolOverlay } from '@/app/components/OverlayNavButton'
import {
  POSTCARD_BAR_COLORS,
  emptySlot,
  fitSlots,
  frontSlotsReady,
  isSlotLayout,
  listingPostcardReady,
  type FrontLayout,
  type ListingPostcard,
  type PostcardSlot,
} from '@/app/lib/postcardDesigns'
import { supabase } from '@/utils/supabase'

type Step = 'layout' | 'front' | 'back'
type Sheet = 'choose' | 'text' | null

const LAYOUTS: { id: FrontLayout; name: string }[] = [
  { id: 'full', name: 'Full picture' },
  { id: 'split', name: 'One big, two small' },
  { id: 'trio', name: 'One big, three small' },
]

export function ListingPostcardWizard({
  design,
  onChange,
  step,
  onStep,
  onDone,
  onUploadOwn,
  onBack,
  signedIn,
  showCustomModal,
}: {
  design: ListingPostcard
  onChange: (next: ListingPostcard) => void
  step: Step
  onStep: (step: Step) => void
  onDone: () => void
  onUploadOwn: () => void
  onBack: () => void
  signedIn: boolean
  showCustomModal: (msg: string, requireAuth?: boolean) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const slotRef = useRef(0)
  const [uploading, setUploading] = useState(false)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [sheet, setSheet] = useState<Sheet>(null)
  const set = <K extends keyof ListingPostcard>(key: K, value: ListingPostcard[K]) => {
    onChange({ ...design, [key]: value })
  }
  const layout: FrontLayout = isSlotLayout(design.layout) ? design.layout : 'full'
  const slots = fitSlots(layout, design.slots)

  const writeSlots = (next: PostcardSlot[]) => {
    onChange({ ...design, layout, slots: next })
  }

  const chooseLayout = (nextLayout: FrontLayout) => {
    onChange({ ...design, layout: nextLayout, slots: fitSlots(nextLayout, design.slots) })
    setSheet(null)
    setActiveSlot(null)
    onStep('front')
  }

  const openSlot = (index: number) => {
    if (uploading) return
    slotRef.current = index
    setActiveSlot(index)
    setSheet(slots[index]?.kind === 'text' ? 'text' : 'choose')
  }

  const updateActive = (slot: PostcardSlot) => {
    if (activeSlot == null) return
    const next = slots.slice()
    next[activeSlot] = slot
    writeSlots(next)
  }

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    const index = slotRef.current
    if (!file || uploading) return
    if (!signedIn) {
      showCustomModal('Sign in to add a photo.', true)
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showCustomModal('Use a JPEG, PNG, or WebP photo.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      showCustomModal('That photo is too big. Use one under 8 MB.')
      return
    }
    setUploading(true)
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id
    if (!userId) {
      setUploading(false)
      showCustomModal('Sign in to add a photo.', true)
      return
    }
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const fileName = `${userId}/postcard-slot-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('profiles').upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    })
    setUploading(false)
    if (error) {
      showCustomModal('That photo did not upload. Try again.')
      return
    }
    const publicUrl = supabase.storage.from('profiles').getPublicUrl(fileName).data.publicUrl
    const next = fitSlots(layout, design.slots)
    next[index] = { kind: 'photo', photoUrl: publicUrl, heading: '', subheading: '', body: '' }
    onChange({ ...design, layout, slots: next })
    setSheet(null)
    setActiveSlot(null)
  }

  const back = () => {
    if (uploading) return
    if (sheet) {
      setSheet(null)
      setActiveSlot(null)
      return
    }
    if (step === 'front') {
      onStep('layout')
      return
    }
    if (step === 'back') {
      onStep('front')
      return
    }
    onBack()
  }

  const nextFromFront = () => {
    const problem = frontSlotsReady({ ...design, layout, slots })
    if (problem) {
      showCustomModal(problem)
      return
    }
    onStep('back')
  }

  const nextFromBack = () => {
    const problem = listingPostcardReady(design)
    if (problem) {
      showCustomModal(problem)
      return
    }
    onDone()
  }

  const stepLabel = step === 'layout' ? 'Step 1 of 4' : step === 'front' ? 'Step 2 of 4' : 'Step 3 of 4'
  const active = activeSlot == null ? null : slots[activeSlot] || emptySlot()

  return (
    <ToolOverlay id="view-mail" nav={<OverlayNavButton kind="back" label="Back" onClick={back} />}>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { void uploadPhoto(event) }} />
      {step === 'layout' ? (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{stepLabel}</p>
            <h1 className="text-3xl font-black mt-1">Pick a layout</h1>
            <p className="text-base text-slate-300 mt-2">Tap one. You can change it later.</p>
          </div>
          {LAYOUTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseLayout(item.id)}
              className={`w-full rounded-3xl bg-white p-3 text-left shadow-lg ${design.layout === item.id ? 'ring-4 ring-amber-300' : ''}`}
            >
              <LayoutFace layout={item.id} slots={fitSlots(item.id, design.layout === item.id ? design.slots : [])} />
              <span className="mt-2 block text-center text-sm font-black text-slate-700">{item.name}</span>
            </button>
          ))}
          <button type="button" onClick={onUploadOwn} className="w-full text-sm font-bold text-slate-400">
            I already have the front and the back
          </button>
        </>
      ) : null}

      {step === 'front' ? (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{stepLabel}</p>
            <h1 className="text-3xl font-black mt-1">The front</h1>
            <p className="text-base text-slate-300 mt-2">Tap a +. Add a photo or a few words.</p>
          </div>
          <div className="rounded-3xl bg-white p-3 shadow-lg">
            <LayoutFace
              layout={layout}
              slots={slots}
              busyIndex={uploading ? slotRef.current : null}
              onSlot={openSlot}
            />
          </div>
          <div className="flex gap-2">
            {LAYOUTS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={item.name}
                onClick={() => chooseLayout(item.id)}
                className={`flex-1 rounded-2xl bg-white p-1.5 ${layout === item.id ? 'ring-4 ring-amber-300' : ''}`}
              >
                <LayoutFace layout={item.id} slots={[]} />
              </button>
            ))}
          </div>
          <button type="button" onClick={nextFromFront} className="w-full bg-amber-300 text-slate-950 font-black py-4 rounded-xl">
            Next
          </button>
        </>
      ) : null}

      {step === 'back' ? (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{stepLabel}</p>
            <h1 className="text-3xl font-black mt-1">The back</h1>
            <p className="text-base text-slate-300 mt-2">The right side stays blank. That is where the address is printed.</p>
          </div>
          <BackPreview design={design} />
          <ColorRow label="Back color" value={design.backColor} onChange={(hex) => set('backColor', hex)} />
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Your name</span>
            <input value={design.agentName} onChange={(event) => set('agentName', event.target.value.slice(0, 36))} placeholder="Your name" className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Brokerage</span>
            <input value={design.brokerage} onChange={(event) => set('brokerage', event.target.value.slice(0, 36))} placeholder="Brokerage name" className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Short note</span>
            <textarea
              value={design.message}
              onChange={(event) => set('message', event.target.value.slice(0, 320))}
              rows={5}
              placeholder="A short note about the home."
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</span>
            <input value={design.phone} onChange={(event) => set('phone', event.target.value.slice(0, 24))} placeholder="(415) 555-0100" className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Website, if you want one</span>
            <input value={design.website} onChange={(event) => set('website', event.target.value.slice(0, 48))} placeholder="yoursite.com" className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Title</span>
            <input value={design.title} onChange={(event) => set('title', event.target.value.slice(0, 32))} placeholder="Real Estate Agent" className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">License, if you want it</span>
            <input value={design.license} onChange={(event) => set('license', event.target.value.slice(0, 24))} placeholder="DRE #0123456" className={fieldClass} />
          </label>
          {design.headshotUrl ? (
            <button
              type="button"
              onClick={() => set('useHeadshot', !design.useHeadshot)}
              className={`w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left ${design.useHeadshot ? 'border-amber-300 bg-slate-800' : 'border-slate-700'}`}
            >
              <img src={design.headshotUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
              <span className="text-lg font-black leading-snug">
                {design.useHeadshot ? 'Your picture will be on the back. Tap to take it off.' : 'Add my picture on the back'}
              </span>
            </button>
          ) : null}
          {design.logoUrl ? (
            <button
              type="button"
              onClick={() => set('useLogo', !design.useLogo)}
              className={`w-full rounded-2xl border-2 p-4 text-left text-lg font-black ${design.useLogo ? 'border-amber-300 bg-slate-800' : 'border-slate-700'}`}
            >
              {design.useLogo ? 'Your logo will be on the back. Tap to take it off.' : 'Add my logo on the back'}
            </button>
          ) : null}
          <button type="button" onClick={nextFromBack} className="w-full bg-amber-300 text-slate-950 font-black py-4 rounded-xl">
            Next
          </button>
        </>
      ) : null}

      {sheet && active ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/70" onClick={() => { setSheet(null); setActiveSlot(null) }}>
          <div className="w-full rounded-t-3xl bg-white p-5 pb-8 text-slate-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            {sheet === 'choose' ? (
              <div className="space-y-3">
                <p className="text-lg font-black">What goes here?</p>
                <button
                  type="button"
                  onClick={() => { if (!uploading) fileRef.current?.click() }}
                  className="w-full rounded-2xl bg-[#1493a3] py-4 text-lg font-black text-white"
                >
                  {active.kind === 'photo' ? 'Change the photo' : 'Add a photo'}
                </button>
                <button
                  type="button"
                  onClick={() => setSheet('text')}
                  className="w-full rounded-2xl border-2 border-slate-200 py-4 text-lg font-black"
                >
                  {active.kind === 'photo' ? 'Use words instead' : 'Add text'}
                </button>
                {active.kind !== 'empty' ? (
                  <button
                    type="button"
                    onClick={() => { updateActive(emptySlot()); setSheet(null); setActiveSlot(null) }}
                    className="w-full py-3 text-base font-bold text-slate-500"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ) : (
              <TextSheet
                slot={active.kind === 'text' ? active : emptySlot()}
                onChange={updateActive}
                onPhoto={() => { if (!uploading) fileRef.current?.click() }}
                onRemove={() => { updateActive(emptySlot()); setSheet(null); setActiveSlot(null) }}
                onDone={() => { setSheet(null); setActiveSlot(null) }}
              />
            )}
          </div>
        </div>
      ) : null}
    </ToolOverlay>
  )
}

function TextSheet({
  slot,
  onChange,
  onPhoto,
  onRemove,
  onDone,
}: {
  slot: PostcardSlot
  onChange: (slot: PostcardSlot) => void
  onPhoto: () => void
  onRemove: () => void
  onDone: () => void
}) {
  const setField = (key: 'heading' | 'subheading' | 'body', value: string, limit: number) => {
    onChange({ ...slot, kind: 'text', photoUrl: '', [key]: value.slice(0, limit) })
  }
  return (
    <div className="space-y-3">
      <p className="text-lg font-black">Add text</p>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Heading</span>
        <input value={slot.heading} onChange={(event) => setField('heading', event.target.value, 40)} placeholder="Just sold" className={sheetField} />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Subheading</span>
        <input value={slot.subheading} onChange={(event) => setField('subheading', event.target.value, 60)} placeholder="123 Oak Street" className={sheetField} />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Text</span>
        <textarea value={slot.body} onChange={(event) => setField('body', event.target.value, 220)} rows={3} placeholder="A short line about the home." className={sheetField} />
      </label>
      <button type="button" onClick={onDone} className="w-full rounded-2xl bg-[#1493a3] py-4 text-lg font-black text-white">
        Done
      </button>
      <button type="button" onClick={onPhoto} className="w-full py-2 text-base font-bold text-slate-600">
        Use a photo instead
      </button>
      <button type="button" onClick={onRemove} className="w-full py-2 text-base font-bold text-slate-400">
        Remove
      </button>
    </div>
  )
}

function LayoutFace({
  layout,
  slots,
  onSlot,
  busyIndex,
}: {
  layout: FrontLayout
  slots: PostcardSlot[]
  onSlot?: (index: number) => void
  busyIndex?: number | null
}) {
  const cells = fitSlots(layout, slots)
  const grid = layout === 'full'
    ? 'grid-cols-1 grid-rows-1'
    : layout === 'split'
      ? 'grid-cols-[1.15fr_1fr] grid-rows-2'
      : 'grid-cols-[1.35fr_1fr] grid-rows-3'
  return (
    <div className={`grid aspect-[9.25/6.25] gap-1.5 ${grid}`}>
      {cells.map((slot, index) => (
        <SlotBox
          key={index}
          slot={slot}
          busy={busyIndex === index}
          span={index === 0 && layout !== 'full' ? (layout === 'split' ? 'row-span-2' : 'row-span-3') : ''}
          onClick={onSlot ? () => onSlot(index) : undefined}
        />
      ))}
    </div>
  )
}

function SlotBox({
  slot,
  busy,
  span,
  onClick,
}: {
  slot: PostcardSlot
  busy: boolean
  span: string
  onClick?: () => void
}) {
  const className = `relative flex min-h-0 items-center justify-center overflow-hidden rounded-xl bg-[#e7f6f8] text-[#16323a] ${span}`
  const inner = slot.kind === 'photo' && slot.photoUrl ? (
    <img src={slot.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
  ) : slot.kind === 'text' ? (
    <span className="block w-full px-2 py-1 text-center">
      {slot.heading ? <span className="block text-sm font-black leading-tight">{slot.heading}</span> : null}
      {slot.subheading ? <span className="mt-0.5 block text-[10px] leading-tight">{slot.subheading}</span> : null}
      {slot.body ? <span className="mt-0.5 block text-[10px] leading-tight line-clamp-3">{slot.body}</span> : null}
    </span>
  ) : (
    <PlusMark />
  )
  if (!onClick) return <div className={className}>{busy ? <span className="text-xs font-bold">Adding…</span> : inner}</div>
  return (
    <button type="button" onClick={onClick} className={className} aria-label={slot.kind === 'empty' ? 'Add to this box' : 'Change this box'}>
      {busy ? <span className="text-xs font-bold">Adding…</span> : inner}
    </button>
  )
}

function PlusMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1493a3] text-2xl font-light leading-none text-white">
      +
    </span>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-2 flex gap-2">
        {POSTCARD_BAR_COLORS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => onChange(item.hex)}
            className={`h-11 w-11 rounded-full border-2 ${value.toLowerCase() === item.hex ? 'border-white' : 'border-transparent'}`}
            style={{ background: item.hex }}
          />
        ))}
      </div>
    </div>
  )
}

function BackPreview({ design }: { design: ListingPostcard }) {
  const role = [design.title, design.brokerage].filter(Boolean).join(', ')
  const reach = [design.phone, design.website.replace(/^https?:\/\//i, '')].filter(Boolean).join(' | ')
  return (
    <div className="relative aspect-[9.25/6.25] overflow-hidden rounded-2xl text-white" style={{ background: design.backColor }}>
      <div className="absolute bottom-0 right-0 h-[42%] w-[46%] bg-white" />
      <p className="absolute left-[5%] top-[8%] w-[44%] text-[10px] leading-snug line-clamp-5">{design.message || 'Your note goes here.'}</p>
      {(design.phone || design.website) ? (
        <div className="absolute left-[5%] top-[58%] w-[42%] border border-white/80 px-1.5 py-1 text-[8px] leading-snug">
          {design.phone ? <p>Call or text me at {design.phone}</p> : null}
          {design.website ? <p>Visit {design.website.replace(/^https?:\/\//i, '')}</p> : null}
        </div>
      ) : null}
      <div className="absolute left-[50%] top-[16%] w-[42%] bg-white p-2 pr-8 text-slate-950">
        <p className="text-xs font-black leading-tight">{design.agentName || 'Your name'}</p>
        {role ? <p className="text-[9px] leading-tight">{role}</p> : null}
        {design.license ? <p className="text-[9px] leading-tight">{design.license}</p> : null}
        {reach ? <p className="text-[9px] leading-tight">{reach}</p> : null}
      </div>
      {design.useHeadshot && design.headshotUrl ? (
        <img src={design.headshotUrl} alt="" className="absolute right-[3%] top-[8%] h-10 w-10 rounded-full border-2 border-white object-cover" />
      ) : null}
    </div>
  )
}

const fieldClass = 'mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500'
const sheetField = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-lg text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-[#1493a3]'

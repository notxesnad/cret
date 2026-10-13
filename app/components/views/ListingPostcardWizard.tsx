'use client'

import { useRef, useState, type ChangeEvent, type PointerEvent, type ReactNode } from 'react'
import { OverlayNavButton, ToolOverlay } from '@/app/components/OverlayNavButton'
import {
  SLOT_BACKGROUNDS,
  SLOT_TEXT_COLORS,
  backFrames,
  emptySlot,
  fitBackSlots,
  fitSlots,
  frontFrames,
  isSlotLayout,
  listingPostcardReady,
  normalizeSlot,
  photoTransform,
  slotColor,
  type FrontLayout,
  type ListingPostcard,
  type PostcardSlot,
  type SlotFrame,
} from '@/app/lib/postcardDesigns'
import { supabase } from '@/utils/supabase'

type Step = 'start' | 'layout' | 'build'
type Face = 'front' | 'back'
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
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number; pointer: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [face, setFace] = useState<Face>('front')
  const [selected, setSelected] = useState<number | null>(null)
  const [sheet, setSheet] = useState<Sheet>(null)
  const layout: FrontLayout = isSlotLayout(design.layout) ? design.layout : 'full'
  const frames = face === 'front' ? frontFrames(layout) : backFrames().slots
  const slots = face === 'front' ? fitSlots(layout, design.slots) : fitBackSlots(design.backSlots)
  const active = selected == null ? null : slots[selected] || emptySlot()

  const writeSlots = (next: PostcardSlot[]) => {
    if (face === 'front') onChange({ ...design, layout, slots: next })
    else onChange({ ...design, backSlots: next })
  }

  const updateSlot = (index: number, patch: Partial<PostcardSlot>) => {
    const next = slots.slice()
    next[index] = normalizeSlot({ ...slots[index], ...patch })
    writeSlots(next)
  }

  const applyLayout = (nextLayout: FrontLayout) => {
    onChange({ ...design, layout: nextLayout, slots: fitSlots(nextLayout, design.slots) })
    setSelected(null)
    setSheet(null)
    setFace('front')
  }

  const openSlot = (index: number) => {
    if (uploading) return
    slotRef.current = index
    setSelected(index)
    const slot = slots[index] || emptySlot()
    if (slot.kind === 'photo' && slot.photoUrl) {
      setSheet(null)
      return
    }
    setSheet(slot.kind === 'text' ? 'text' : 'choose')
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
    const next = (face === 'front' ? fitSlots(layout, design.slots) : fitBackSlots(design.backSlots)).slice()
    const current = next[index] || emptySlot()
    next[index] = normalizeSlot({ ...current, kind: 'photo', photoUrl: publicUrl, heading: '', subheading: '', body: '', zoom: 1, rotate: 0, panX: 0, panY: 0 })
    writeSlots(next)
    setSelected(index)
    setSheet(null)
  }

  const back = () => {
    if (uploading) return
    if (sheet) {
      setSheet(null)
      return
    }
    if (step === 'build') {
      onStep('layout')
      return
    }
    if (step === 'layout') {
      onStep('start')
      return
    }
    onBack()
  }

  const finishBuild = () => {
    const problem = listingPostcardReady({ ...design, layout, slots: fitSlots(layout, design.slots), backSlots: fitBackSlots(design.backSlots) })
    if (problem) {
      setFace(problem.includes('back') ? 'back' : 'front')
      setSheet(null)
      setSelected(null)
      showCustomModal(problem)
      return
    }
    onDone()
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>, index: number) => {
    const slot = slots[index]
    if (!slot || slot.kind !== 'photo' || slot.zoom <= 1) return
    dragRef.current = { x: event.clientX, y: event.clientY, panX: slot.panX, panY: slot.panY, pointer: event.pointerId }
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* pointer already gone */ }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>, index: number) => {
    const drag = dragRef.current
    if (!drag || drag.pointer !== event.pointerId) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const slot = slots[index]
    const limit = ((slot?.zoom || 1) - 1) * 40
    const panX = Math.min(limit, Math.max(-limit, drag.panX + ((event.clientX - drag.x) / rect.width) * 100))
    const panY = Math.min(limit, Math.max(-limit, drag.panY + ((event.clientY - drag.y) / rect.height) * 100))
    updateSlot(index, { panX, panY })
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointer === event.pointerId) dragRef.current = null
  }

  const stepLabel = step === 'start' ? 'Step 1 of 4' : step === 'layout' ? 'Step 2 of 4' : 'Step 3 of 4'

  return (
    <ToolOverlay id="view-mail" nav={<OverlayNavButton kind="back" label="Back" onClick={back} />}>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { void uploadPhoto(event) }} />
      {step === 'start' ? (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{stepLabel}</p>
            <h1 className="text-3xl font-black mt-1">How do you want to make it?</h1>
          </div>
          <button type="button" onClick={() => onStep('layout')} className="w-full rounded-2xl bg-amber-300 px-4 py-5 text-left text-slate-950">
            <span className="block text-2xl font-black">Create a card</span>
            <span className="mt-1 block text-base font-bold">Pick a layout, then tap the + boxes.</span>
          </button>
          <button type="button" onClick={onUploadOwn} className="w-full rounded-2xl border-2 border-slate-600 px-4 py-5 text-left">
            <span className="block text-2xl font-black">Upload my own from Canva</span>
            <span className="mt-1 block text-base font-bold text-slate-300">A finished front and a finished back.</span>
          </button>
        </>
      ) : null}

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
              onClick={() => { applyLayout(item.id); onStep('build') }}
              className={`w-full text-left ${design.layout === item.id ? 'ring-4 ring-amber-300' : ''}`}
            >
              <CardCanvas frames={frontFrames(item.id)} slots={fitSlots(item.id, design.layout === item.id ? design.slots : [])} />
              <span className="mt-2 block text-center text-sm font-black text-slate-300">{item.name}</span>
            </button>
          ))}
        </>
      ) : null}

      {step === 'build' ? (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{stepLabel}</p>
            <h1 className="text-3xl font-black mt-1">{face === 'front' ? 'The front' : 'The back'}</h1>
            <p className="text-base text-slate-300 mt-2">
              {face === 'front' ? 'Tap a +. Add a photo or a few words.' : 'The white box is for the address. Leave it blank.'}
            </p>
          </div>
          <div className="relative">
            <CardCanvas
              frames={frames}
              slots={slots}
              address={face === 'back' ? backFrames().address : null}
              selected={selected}
              busyIndex={uploading ? slotRef.current : null}
              onSlot={openSlot}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            {active?.kind === 'photo' && active.photoUrl && sheet == null ? (
              <div className="absolute left-1/2 top-2 z-20 flex -translate-x-1/2 items-stretch overflow-hidden rounded-2xl bg-white shadow-lg">
                <ToolIcon label="Zoom in" onClick={() => updateSlot(selected!, { zoom: Math.min(4, Math.round(active.zoom * 1.25 * 100) / 100) })}>+</ToolIcon>
                <ToolIcon label="Zoom out" onClick={() => updateSlot(selected!, { zoom: Math.max(1, Math.round((active.zoom / 1.25) * 100) / 100) })}>−</ToolIcon>
                <ToolIcon label="Rotate" onClick={() => updateSlot(selected!, { rotate: (active.rotate + 90) % 360 })}>
                  <RotateIcon />
                </ToolIcon>
                <ToolIcon label="Delete" onClick={() => { updateSlot(selected!, { kind: 'empty', photoUrl: '', zoom: 1, rotate: 0, panX: 0, panY: 0 }); setSelected(null) }}>
                  <TrashIcon />
                </ToolIcon>
                <ToolIcon label="Close" onClick={() => setSelected(null)}>×</ToolIcon>
              </div>
            ) : null}
          </div>
          {active && sheet == null ? (
            <ColorFields
              bg={active.bg}
              color={active.color}
              onBg={(hex) => updateSlot(selected!, { bg: hex, color: sameTone(hex, active.color) ? (lightHex(hex) ? '#000000' : '#ffffff') : active.color })}
              onColor={(hex) => updateSlot(selected!, { color: hex })}
            />
          ) : null}
          {face === 'front' ? (
            <div className="grid grid-cols-3 gap-2">
              {LAYOUTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={item.name}
                  onClick={() => applyLayout(item.id)}
                  className={layout === item.id ? 'ring-4 ring-amber-300' : ''}
                >
                  <CardCanvas frames={frontFrames(item.id)} slots={[]} quiet />
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex items-end justify-center gap-8 pt-2">
            <FaceButton label="Front" on={face === 'front'} onClick={() => { setFace('front'); setSelected(null); setSheet(null) }}>
              <CardCanvas frames={frontFrames(layout)} slots={fitSlots(layout, design.slots)} quiet />
            </FaceButton>
            <FaceButton label="Back" on={face === 'back'} onClick={() => { setFace('back'); setSelected(null); setSheet(null) }}>
              <CardCanvas frames={backFrames().slots} slots={fitBackSlots(design.backSlots)} address={backFrames().address} quiet />
            </FaceButton>
          </div>
          <button type="button" onClick={finishBuild} className="w-full bg-amber-300 text-slate-950 font-black py-4 rounded-xl">
            Next
          </button>
        </>
      ) : null}

      {sheet && active && selected != null ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/70" onClick={() => setSheet(null)}>
          <div className="max-h-[80dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 text-slate-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            {sheet === 'choose' ? (
              <div className="space-y-3">
                <p className="text-lg font-black">What goes here?</p>
                <button type="button" onClick={() => { if (!uploading) fileRef.current?.click() }} className="w-full rounded-2xl bg-[#1493a3] py-4 text-lg font-black text-white">
                  Add a photo
                </button>
                <button type="button" onClick={() => setSheet('text')} className="w-full rounded-2xl border-2 border-slate-200 py-4 text-lg font-black">
                  Add text
                </button>
                <ColorFields
                  bg={active.bg}
                  color={active.color}
                  onBg={(hex) => updateSlot(selected, { bg: hex, color: sameTone(hex, active.color) ? (lightHex(hex) ? '#000000' : '#ffffff') : active.color })}
                  onColor={(hex) => updateSlot(selected, { color: hex })}
                  light
                />
              </div>
            ) : (
              <TextSheet
                slot={active.kind === 'text' ? active : { ...active, kind: 'text', heading: '', subheading: '', body: '' }}
                onChange={(slot) => updateSlot(selected, slot)}
                onPhoto={() => { if (!uploading) fileRef.current?.click() }}
                onRemove={() => { updateSlot(selected, { kind: 'empty', photoUrl: '', heading: '', subheading: '', body: '', zoom: 1, rotate: 0, panX: 0, panY: 0 }); setSheet(null); setSelected(null) }}
                onDone={() => setSheet(null)}
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
      <ColorFields
        bg={slot.bg}
        color={slot.color}
        onBg={(hex) => onChange({ ...slot, kind: 'text', bg: slotColor(hex, '#000000'), color: sameTone(hex, slot.color) ? (lightHex(hex) ? '#000000' : '#ffffff') : slot.color })}
        onColor={(hex) => onChange({ ...slot, kind: 'text', color: slotColor(hex, '#ffffff') })}
        light
      />
      <button type="button" onClick={onDone} className="w-full rounded-2xl bg-[#1493a3] py-4 text-lg font-black text-white">Done</button>
      <button type="button" onClick={onPhoto} className="w-full py-2 text-base font-bold text-slate-600">Use a photo instead</button>
      <button type="button" onClick={onRemove} className="w-full py-2 text-base font-bold text-slate-400">Remove</button>
    </div>
  )
}

function CardCanvas({
  frames,
  slots,
  address,
  selected,
  busyIndex,
  quiet,
  onSlot,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  frames: SlotFrame[]
  slots: PostcardSlot[]
  address?: SlotFrame | null
  selected?: number | null
  busyIndex?: number | null
  quiet?: boolean
  onSlot?: (index: number) => void
  onPointerDown?: (event: PointerEvent<HTMLDivElement>, index: number) => void
  onPointerMove?: (event: PointerEvent<HTMLDivElement>, index: number) => void
  onPointerUp?: (event: PointerEvent<HTMLDivElement>) => void
}) {
  return (
    <div className="relative aspect-[9.25/6.25] w-full overflow-hidden bg-black">
      {frames.map((frame, index) => {
        const slot = slots[index] || emptySlot()
        const zoomed = slot.kind === 'photo' && slot.zoom > 1
        return (
          <div
            key={`${frame.left}-${frame.top}`}
            className={`absolute overflow-hidden ${selected === index ? 'z-[1] shadow-[inset_0_0_0_3px_#f5e27a]' : 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]'}`}
            style={{
              left: `${frame.left}%`,
              top: `${frame.top}%`,
              width: `${frame.width}%`,
              height: `${frame.height}%`,
              background: slot.bg || '#000000',
              color: slot.color || '#ffffff',
              touchAction: zoomed ? 'none' : 'auto',
            }}
            onClick={onSlot ? () => onSlot(index) : undefined}
            onPointerDown={onPointerDown ? (event) => onPointerDown(event, index) : undefined}
            onPointerMove={onPointerMove ? (event) => onPointerMove(event, index) : undefined}
            onPointerUp={onPointerUp}
          >
            <SlotFill slot={slot} busy={busyIndex === index} quiet={quiet} />
          </div>
        )
      })}
      {address ? (
          <div
            className="absolute flex items-center justify-center bg-white text-[11px] font-bold text-slate-400"
            style={{ left: `${address.left}%`, top: `${address.top}%`, width: `${address.width}%`, height: `${address.height}%` }}
          >
            {quiet ? null : 'Address'}
          </div>
      ) : null}
    </div>
  )
}

function SlotFill({ slot, busy, quiet }: { slot: PostcardSlot; busy?: boolean; quiet?: boolean }) {
  if (busy) return <span className="flex h-full items-center justify-center text-xs font-bold">Adding…</span>
  if (slot.kind === 'photo' && slot.photoUrl) {
    return (
      <img
        src={slot.photoUrl}
        alt=""
        className="absolute left-1/2 top-1/2 h-full w-full object-cover"
        style={{ transform: photoTransform(slot), transformOrigin: 'center' }}
      />
    )
  }
  if (slot.kind === 'text' && (slot.heading || slot.subheading || slot.body)) {
    return (
      <span className="flex h-full w-full flex-col items-center justify-center px-1 text-center">
        {slot.heading ? <span className="text-[11px] font-black leading-tight">{slot.heading}</span> : null}
        {slot.subheading ? <span className="text-[9px] leading-tight">{slot.subheading}</span> : null}
        {slot.body ? <span className="line-clamp-3 text-[8px] leading-tight">{slot.body}</span> : null}
      </span>
    )
  }
  if (quiet) return null
  return (
    <span className="flex h-full items-center justify-center">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1493a3] text-2xl font-light leading-none text-white">+</span>
    </span>
  )
}

function FaceButton({ label, on, onClick, children }: { label: string; on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="w-20">
      <div className={on ? 'border-2 border-[#1493a3] p-0.5' : 'border-2 border-transparent p-0.5'}>{children}</div>
      <span className={`mt-1 block rounded-b-lg py-1 text-center text-sm font-black ${on ? 'bg-[#1493a3] text-white' : 'text-slate-400'}`}>{label}</span>
    </button>
  )
}

function ColorFields({
  bg,
  color,
  onBg,
  onColor,
  light,
}: {
  bg: string
  color: string
  onBg: (hex: string) => void
  onColor: (hex: string) => void
  light?: boolean
}) {
  const label = light ? 'text-slate-500' : 'text-slate-400'
  return (
    <div className="space-y-3">
      <Swatches label="Background" value={bg} choices={SLOT_BACKGROUNDS} onChange={onBg} labelClass={label} />
      <Swatches label="Text" value={color} choices={SLOT_TEXT_COLORS} onChange={onColor} labelClass={label} />
    </div>
  )
}

function Swatches({
  label,
  value,
  choices,
  onChange,
  labelClass,
}: {
  label: string
  value: string
  choices: string[]
  onChange: (hex: string) => void
  labelClass: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>{label}</p>
        <input aria-label={`${label} color`} type="color" value={slotColor(value, choices[0])} onChange={(event) => onChange(event.target.value)} className="h-8 w-10 cursor-pointer bg-transparent" />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {choices.map((hex) => (
          <button
            key={hex}
            type="button"
            aria-label={hex}
            onClick={() => onChange(hex)}
            className={`h-8 w-8 border-2 ${value.toLowerCase() === hex ? 'border-[#1493a3]' : 'border-white/30'}`}
            style={{ background: hex }}
          />
        ))}
      </div>
    </div>
  )
}

function ToolIcon({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex h-11 w-11 items-center justify-center border-l border-slate-200 text-xl text-slate-600 first:border-l-0">
      {children}
    </button>
  )
}

function RotateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v6h-6" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M7 7l1 13h8l1-13" />
    </svg>
  )
}

function lightHex(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

function sameTone(a: string, b: string) {
  return lightHex(slotColor(a, '#000000')) === lightHex(slotColor(b, '#ffffff'))
}

const sheetField = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-lg text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-[#1493a3]'

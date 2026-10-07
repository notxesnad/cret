'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { OverlayNavButton, ToolOverlay } from '@/app/components/OverlayNavButton'
import {
  POSTCARD_BAR_COLORS,
  POSTCARD_HEADLINES,
  listingPostcardReady,
  type ListingPostcard,
} from '@/app/lib/postcardDesigns'
import { supabase } from '@/utils/supabase'

type Step = 'photo' | 'front' | 'back'

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
  const [uploading, setUploading] = useState(false)
  const set = <K extends keyof ListingPostcard>(key: K, value: ListingPostcard[K]) => {
    onChange({ ...design, [key]: value })
  }

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
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
    const fileName = `${userId}/postcard-house-${Date.now()}.${ext}`
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
    onChange({ ...design, photoUrl: publicUrl })
  }

  const back = () => {
    if (uploading) return
    if (step === 'front') {
      onStep('photo')
      return
    }
    if (step === 'back') {
      onStep('front')
      return
    }
    onBack()
  }

  const nextFromFront = () => {
    if (!design.headline.trim()) {
      showCustomModal('Add the words for the top bar. Just Sold is fine.')
      return
    }
    if (!design.propertyAddress.trim()) {
      showCustomModal('Add the property address.')
      return
    }
    if (!design.agentName.trim()) {
      showCustomModal('Add your name.')
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

  const stepLabel = step === 'photo' ? 'Step 1 of 4' : step === 'front' ? 'Step 2 of 4' : 'Step 3 of 4'

  return (
    <ToolOverlay id="view-mail" nav={<OverlayNavButton kind="back" label="Back" onClick={back} />}>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { void uploadPhoto(event) }} />
      {step === 'photo' ? (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{stepLabel}</p>
            <h1 className="text-3xl font-black mt-1">Add the house photo</h1>
            <p className="text-base text-slate-300 mt-2">A wide photo works best. You will add the words next.</p>
          </div>
          <button
            type="button"
            onClick={() => { if (!uploading) fileRef.current?.click() }}
            className="w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-500 text-left"
          >
            {design.photoUrl ? (
              <img src={design.photoUrl} alt="House" className="h-48 w-full object-cover" />
            ) : (
              <span className="flex h-48 items-center justify-center text-xl font-black">
                {uploading ? 'Uploading…' : 'Tap to add a photo'}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!design.photoUrl) {
                showCustomModal('Add the house photo first.')
                return
              }
              onStep('front')
            }}
            className="w-full bg-amber-300 text-slate-950 font-black py-4 rounded-xl"
          >
            Next
          </button>
          <button type="button" onClick={onUploadOwn} className="w-full text-sm font-bold text-slate-400">
            I already have the front and the back
          </button>
        </>
      ) : null}

      {step === 'front' ? (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{stepLabel}</p>
            <h1 className="text-3xl font-black mt-1">Words on the front</h1>
            <p className="text-base text-slate-300 mt-2">The top bar and the bottom bar. You will check the real proof before you pay.</p>
          </div>
          <FrontPreview design={design} />
          <div className="flex flex-wrap gap-2">
            {POSTCARD_HEADLINES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => set('headline', item)}
                className={`rounded-full px-3 py-2 text-sm font-bold ${design.headline === item ? 'bg-amber-300 text-slate-950' : 'bg-slate-800 text-white'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Top bar</span>
            <input value={design.headline} onChange={(event) => set('headline', event.target.value.slice(0, 28))} className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Address on the bottom bar</span>
            <input value={design.propertyAddress} onChange={(event) => set('propertyAddress', event.target.value.slice(0, 42))} placeholder="123 Oak Street" className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Line under the address</span>
            <input value={design.detail} onChange={(event) => set('detail', event.target.value.slice(0, 36))} placeholder="$450,000" className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Your name</span>
            <input value={design.agentName} onChange={(event) => set('agentName', event.target.value.slice(0, 36))} placeholder="Your name" className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Brokerage</span>
            <input value={design.brokerage} onChange={(event) => set('brokerage', event.target.value.slice(0, 36))} placeholder="Brokerage name" className={fieldClass} />
          </label>
          <ColorRow label="Bar color" value={design.barColor} onChange={(hex) => set('barColor', hex)} />
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
    </ToolOverlay>
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

function FrontPreview({ design }: { design: ListingPostcard }) {
  return (
    <div className="relative aspect-[9.25/6.25] overflow-hidden rounded-2xl bg-slate-800">
      {design.photoUrl ? <img src={design.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
      <div className="absolute left-[5%] top-[6%] max-w-[70%] bg-black px-3 py-2 font-serif text-lg uppercase tracking-widest text-white" style={{ background: design.barColor }}>
        {design.headline || 'Just Sold'}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-2 text-white" style={{ background: design.barColor, minHeight: '18%' }}>
        <div>
          <p className="text-sm font-black leading-tight">{design.propertyAddress || 'Property address'}</p>
          {design.detail ? <p className="text-xs">{design.detail}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-sm font-black leading-tight">{design.agentName || 'Your name'}</p>
          {design.brokerage ? <p className="text-xs">{design.brokerage}</p> : null}
        </div>
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

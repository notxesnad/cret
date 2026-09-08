'use client'

import { useState } from 'react'
import { OverlayNavButton } from '@/app/components/OverlayNavButton'
import { CrmModeBar, CrmSpreadsheet } from '@/app/components/CrmSpreadsheet'
import { useInnerSwipeBack } from '@/app/lib/useInnerSwipeBack'
import { isArchived } from '@/app/lib/archive'
import { formatCityState, formatPrice } from '@/app/lib/tourFormat'
import { supabase } from '@/utils/supabase'
import { ensurePdfUploadsAllowed } from '@/app/actions/upload'
import type { TourHome } from '@/app/lib/tourHomes'

const newId = () => Math.random().toString(36).substr(2, 9)

function homeLabel(home: TourHome) {
  return [home.address, formatCityState(home.city, home.state)].filter(Boolean).join(', ') || 'Untitled home'
}

export function ShowingHomesView({
  homes,
  updateHomes,
  switchView,
  showCustomModal,
  userId,
}: {
  homes: TourHome[]
  updateHomes: (updater: (prev: TourHome[]) => TourHome[]) => void
  switchView: (view: string) => void
  showCustomModal: (msg: string, requireAuth?: boolean) => void
  userId?: string
}) {
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'list' | 'sheet'>('list')
  const [showArchived, setShowArchived] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draftAddress, setDraftAddress] = useState('')
  const [draftCity, setDraftCity] = useState('')
  const [draftState, setDraftState] = useState('')
  const [draftPrice, setDraftPrice] = useState('')
  const [uploading, setUploading] = useState<'photo' | 'mls' | null>(null)

  useInnerSwipeBack(step, 1, () => setStep(1))

  const archivedCount = homes.filter(isArchived).length
  const visible = homes.filter((home) => isArchived(home) === showArchived)
  const active = homes.find((home) => home.id === activeId) || null

  const patch = (id: string, next: Partial<TourHome>) => {
    updateHomes((prev) => prev.map((home) => home.id === id ? { ...home, ...next } : home))
  }

  const openOne = (id: string) => {
    setActiveId(id)
    setStep(2)
  }

  const confirmAdd = () => {
    if (!draftAddress.trim()) return
    const home: TourHome = {
      id: newId(),
      address: draftAddress.trim(),
      city: draftCity.trim() || undefined,
      state: draftState.trim() || undefined,
      price: draftPrice.trim() || undefined,
      archived: false,
    }
    updateHomes((prev) => [home, ...prev])
    setDraftAddress('')
    setDraftCity('')
    setDraftState('')
    setDraftPrice('')
    setAdding(false)
    openOne(home.id)
  }

  const uploadFile = async (file: File, kind: 'photo' | 'mls') => {
    if (!userId) {
      showCustomModal('', true)
      return
    }
    if (!activeId) return

    const isPhoto = kind === 'photo'
    const maxSize = isPhoto ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      showCustomModal(isPhoto ? 'Please upload an image under 5MB.' : 'Please upload a PDF under 10MB.')
      return
    }
    if (isPhoto && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showCustomModal('Please upload a JPEG, PNG, or WebP image.')
      return
    }
    const looksLikePdf = file.type === 'application/pdf'
      || file.type === 'application/x-pdf'
      || file.name.toLowerCase().endsWith('.pdf')
    if (!isPhoto && !looksLikePdf) {
      showCustomModal('Please upload a PDF from your MLS export.')
      return
    }

    setUploading(kind)
    if (!isPhoto) await ensurePdfUploadsAllowed()

    const fileExt = isPhoto ? (file.name.split('.').pop() || 'jpg') : 'pdf'
    const fileName = `${userId}/clients/${kind}-${newId()}.${fileExt}`
    const preferredType = isPhoto ? (file.type || 'image/jpeg') : 'application/pdf'

    let { error } = await supabase.storage.from('profiles').upload(fileName, file, {
      upsert: true,
      contentType: preferredType,
    })
    if (error && /mime/i.test(error.message)) {
      const blob = new Blob([file], { type: 'application/octet-stream' })
      const retry = await supabase.storage.from('profiles').upload(fileName, blob, {
        upsert: true,
        contentType: 'application/octet-stream',
      })
      error = retry.error
    }
    if (error) {
      showCustomModal('Upload failed: ' + error.message)
      setUploading(null)
      return
    }

    const publicUrl = supabase.storage.from('profiles').getPublicUrl(fileName).data.publicUrl
    patch(activeId, isPhoto ? { photo_url: publicUrl } : { mls_pdf_url: publicUrl })
    setUploading(null)
  }

  return (
    <div id="view-myshowing" className="app-view active space-y-4">
      {step === 1 ? (
        <>
          <OverlayNavButton kind="back" label="My Homes" onClick={() => switchView('myhomes')} />
          <div className="text-center mb-2">
            <span className="text-xs font-bold tracking-widest text-orange-400 uppercase">Buyer inventory</span>
            <h1 className="text-2xl font-black mt-1">Homes I’m Showing</h1>
            <p className="text-base text-slate-400 mt-1">The pool you pull from for tours. Archive a home and it drops out of the tools.</p>
          </div>

          <CrmModeBar
            mode={mode}
            onMode={setMode}
            showArchived={showArchived}
            onShowArchived={setShowArchived}
            archivedCount={archivedCount}
          />

          {adding ? (
            <div className="bg-slate-800 p-4 rounded-xl border border-orange-500/40 space-y-3">
              <input
                autoFocus
                placeholder="Street address"
                value={draftAddress}
                onChange={(e) => setDraftAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="City"
                  value={draftCity}
                  onChange={(e) => setDraftCity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                />
                <input
                  placeholder="State"
                  value={draftState}
                  onChange={(e) => setDraftState(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <input
                placeholder="Price (optional)"
                value={draftPrice}
                onChange={(e) => setDraftPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              />
              <div className="flex gap-2">
                <button type="button" onClick={confirmAdd} className="flex-1 bg-orange-500 text-slate-950 font-black py-3 rounded-lg">Save</button>
                <button type="button" onClick={() => setAdding(false)} className="flex-1 bg-slate-700 font-bold py-3 rounded-lg">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 font-black py-4 rounded-xl"
            >
              + Add a home
            </button>
          )}

          {mode === 'sheet' ? (
            <CrmSpreadsheet
              rows={visible}
              onChange={(row) => patch(row.id, row)}
              onRowOpen={(row) => openOne(row.id)}
              columns={[
                { key: 'address', label: 'Address', get: (row) => row.address || '', set: (row, value) => ({ ...row, address: value }) },
                { key: 'city', label: 'City', get: (row) => row.city || '', set: (row, value) => ({ ...row, city: value || undefined }) },
                { key: 'state', label: 'State', get: (row) => row.state || '', set: (row, value) => ({ ...row, state: value || undefined }) },
                { key: 'price', label: 'Price', get: (row) => row.price || '', set: (row, value) => ({ ...row, price: value || undefined }) },
                { key: 'notes', label: 'Notes', get: (row) => row.notes || '', set: (row, value) => ({ ...row, notes: value || undefined }) },
                {
                  key: 'status',
                  label: 'Status',
                  type: 'select',
                  options: [
                    { value: 'active', label: 'Active' },
                    { value: 'archived', label: 'Archived' },
                  ],
                  get: (row) => isArchived(row) ? 'archived' : 'active',
                  set: (row, value) => ({ ...row, archived: value === 'archived' }),
                },
              ]}
            />
          ) : (
            <div className="space-y-3">
              {visible.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <p className="text-base text-slate-400 font-medium">
                    {showArchived ? 'No archived homes.' : 'No active showing homes yet.'}
                  </p>
                </div>
              ) : (
                visible.map((home) => (
                  <button
                    key={home.id}
                    type="button"
                    onClick={() => openOne(home.id)}
                    className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-orange-500/50 transition flex gap-3"
                  >
                    {home.photo_url ? (
                      <img src={home.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-slate-700" />
                    ) : null}
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-lg">{homeLabel(home)}</h4>
                      <p className="text-sm text-slate-400 mt-0.5">{home.price ? formatPrice(home.price) : 'No price yet'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      ) : active ? (
        <>
          <OverlayNavButton kind="back" label="Showing" onClick={() => setStep(1)} />
          <h1 className="text-2xl font-black">{homeLabel(active)}</h1>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</span>
            <input
              value={active.address}
              onChange={(e) => patch(active.id, { address: e.target.value })}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">City</span>
              <input
                value={active.city || ''}
                onChange={(e) => patch(active.id, { city: e.target.value || undefined })}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">State</span>
              <input
                value={active.state || ''}
                onChange={(e) => patch(active.id, { state: e.target.value || undefined })}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Price</span>
            <input
              value={active.price || ''}
              onChange={(e) => patch(active.id, { price: e.target.value || undefined })}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes</span>
            <textarea
              value={active.notes || ''}
              onChange={(e) => patch(active.id, { notes: e.target.value || undefined })}
              rows={3}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
            />
          </label>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Photo of the Home</span>
            {active.photo_url ? (
              <img src={active.photo_url} alt="Home" className="mt-2 w-full h-36 object-cover rounded-xl mb-2 border border-slate-700" />
            ) : null}
            <label className="mt-2 block w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-center cursor-pointer">
              {uploading === 'photo' ? 'Uploading...' : active.photo_url ? 'Replace Photo' : 'Upload Photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={!!uploading}
                onChange={(e) => e.target.files?.[0] && void uploadFile(e.target.files[0], 'photo')}
              />
            </label>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">MLS Details PDF</span>
            {active.mls_pdf_url ? (
              <a href={active.mls_pdf_url} target="_blank" rel="noreferrer" className="block text-base text-orange-400 font-bold mt-2 mb-2 underline">View uploaded MLS PDF</a>
            ) : null}
            <label className="mt-2 block w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-center cursor-pointer">
              {uploading === 'mls' ? 'Uploading...' : active.mls_pdf_url ? 'Replace MLS PDF' : 'Upload MLS PDF'}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={!!uploading}
                onChange={(e) => e.target.files?.[0] && void uploadFile(e.target.files[0], 'mls')}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => {
              patch(active.id, { archived: !isArchived(active) })
              setStep(1)
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold py-4 rounded-xl"
          >
            {isArchived(active) ? 'Move back to active' : 'Archive this home'}
          </button>
        </>
      ) : (
        <OverlayNavButton kind="back" label="Showing" onClick={() => setStep(1)} />
      )}
    </div>
  )
}

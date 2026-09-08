'use client'

import { useState } from 'react'
import { OverlayNavButton, ToolOverlay } from '@/app/components/OverlayNavButton'
import { CrmModeBar, CrmSpreadsheet } from '@/app/components/CrmSpreadsheet'
import { useInnerSwipeBack } from '@/app/lib/useInnerSwipeBack'
import { isArchived } from '@/app/lib/archive'
import { isSellerDemoListing } from '@/app/lib/sellerDemo'
import type { TourClient } from '@/app/lib/tourHomes'

const newId = () => Math.random().toString(36).substr(2, 9)

export type ManageListing = {
  id: string
  address: string
  city?: string
  state?: string
  county?: string
  clientId?: string
  archived?: boolean
  activities?: unknown[]
}

function listingLabel(listing: ManageListing) {
  return [listing.address, listing.city, listing.state].filter(Boolean).join(', ') || 'Untitled listing'
}

export function ListingsManageView({
  listings,
  clients,
  updateListings,
  switchView,
}: {
  listings: ManageListing[]
  clients: TourClient[]
  updateListings: (updater: (prev: ManageListing[]) => ManageListing[]) => void
  switchView: (view: string) => void
}) {
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'list' | 'sheet'>('list')
  const [showArchived, setShowArchived] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draftAddress, setDraftAddress] = useState('')
  const [draftCity, setDraftCity] = useState('')
  const [draftState, setDraftState] = useState('')

  useInnerSwipeBack(step, 1, () => setStep(1))

  const real = listings.filter((listing) => !isSellerDemoListing(listing))
  const archivedCount = real.filter(isArchived).length
  const visible = real.filter((listing) => isArchived(listing) === showArchived)
  const active = real.find((listing) => listing.id === activeId) || null
  const people = clients.filter((person) => !isArchived(person) || person.id === active?.clientId)

  const patch = (id: string, next: Partial<ManageListing>) => {
    updateListings((prev) => prev.map((listing) => listing.id === id ? { ...listing, ...next } : listing))
  }

  const openOne = (id: string) => {
    setActiveId(id)
    setStep(2)
  }

  const confirmAdd = () => {
    if (!draftAddress.trim()) return
    const listing: ManageListing = {
      id: newId(),
      address: draftAddress.trim(),
      city: draftCity.trim() || undefined,
      state: draftState.trim() || undefined,
      activities: [],
      archived: false,
    }
    updateListings((prev) => [listing, ...prev])
    setDraftAddress('')
    setDraftCity('')
    setDraftState('')
    setAdding(false)
    openOne(listing.id)
  }

  return (
    <ToolOverlay
      id="view-mylistings"
      nav={step === 1 ? (
        <OverlayNavButton kind="back" label="Back" onClick={() => switchView('myhomes')} />
      ) : (
        <OverlayNavButton kind="back" label="Back" onClick={() => setStep(1)} />
      )}
    >
      {step === 1 ? (
        <>
          <div className="text-center mb-2">
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">Seller inventory</span>
            <h1 className="text-2xl font-black mt-1">My Listings</h1>
            <p className="text-base text-slate-400 mt-1">These are the homes you sell. Archived listings stay out of your tools.</p>
          </div>

          <CrmModeBar
            mode={mode}
            onMode={setMode}
            showArchived={showArchived}
            onShowArchived={setShowArchived}
            archivedCount={archivedCount}
          />

          {adding ? (
            <div className="bg-slate-800 p-4 rounded-xl border border-amber-500/40 space-y-3">
              <input
                autoFocus
                placeholder="Street address"
                value={draftAddress}
                onChange={(e) => setDraftAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="City"
                  value={draftCity}
                  onChange={(e) => setDraftCity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                />
                <input
                  placeholder="State"
                  value={draftState}
                  onChange={(e) => setDraftState(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={confirmAdd} className="flex-1 bg-amber-500 text-slate-950 font-black py-3 rounded-lg">Save</button>
                <button type="button" onClick={() => setAdding(false)} className="flex-1 bg-slate-700 font-bold py-3 rounded-lg">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-black py-4 rounded-xl"
            >
              + Add a listing
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
                { key: 'county', label: 'County', get: (row) => row.county || '', set: (row, value) => ({ ...row, county: value || undefined }) },
                {
                  key: 'client',
                  label: 'Client',
                  type: 'select',
                  options: [{ value: '', label: 'Unassigned' }, ...people.map((person) => ({ value: person.id, label: person.name || 'Unnamed' }))],
                  get: (row) => row.clientId || '',
                  set: (row, value) => ({ ...row, clientId: value || undefined }),
                },
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
                    {showArchived ? 'No archived listings.' : 'No active listings yet.'}
                  </p>
                </div>
              ) : (
                visible.map((listing) => {
                  const client = clients.find((person) => person.id === listing.clientId)
                  return (
                    <button
                      key={listing.id}
                      type="button"
                      onClick={() => openOne(listing.id)}
                      className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-amber-500/50 transition"
                    >
                      <h4 className="font-bold text-white text-lg">{listingLabel(listing)}</h4>
                      <p className="text-sm text-slate-400 mt-0.5">{client?.name || 'No client attached'}</p>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </>
      ) : active ? (
        <>
          <h1 className="text-2xl font-black">{listingLabel(active)}</h1>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</span>
            <input
              value={active.address}
              onChange={(e) => patch(active.id, { address: e.target.value })}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">City</span>
              <input
                value={active.city || ''}
                onChange={(e) => patch(active.id, { city: e.target.value || undefined })}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">State</span>
              <input
                value={active.state || ''}
                onChange={(e) => patch(active.id, { state: e.target.value || undefined })}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">County</span>
            <input
              value={active.county || ''}
              onChange={(e) => patch(active.id, { county: e.target.value || undefined })}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Client</span>
            <select
              value={active.clientId || ''}
              onChange={(e) => patch(active.id, { clientId: e.target.value || undefined })}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Unassigned</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>{person.name || 'Unnamed'}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              patch(active.id, { archived: !isArchived(active) })
              setStep(1)
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold py-4 rounded-xl"
          >
            {isArchived(active) ? 'Move back to active' : 'Archive this listing'}
          </button>
        </>
      ) : null}
    </ToolOverlay>
  )
}

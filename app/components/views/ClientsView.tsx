'use client'

import { useState } from 'react'
import { OverlayNavButton } from '@/app/components/OverlayNavButton'
import { SharePreviewButtons } from '@/app/components/SharePreviewButtons'
import { CrmModeBar, CrmSpreadsheet } from '@/app/components/CrmSpreadsheet'
import { useInnerSwipeBack } from '@/app/lib/useInnerSwipeBack'
import { isArchived } from '@/app/lib/archive'
import { homesOnClientTours, unpackTourData, type TourClient } from '@/app/lib/tourHomes'

const newId = () => Math.random().toString(36).substr(2, 9)

type Listing = {
  id: string
  address?: string
  city?: string
  clientId?: string
  archived?: boolean
}

export function ClientsView({
  clients,
  listings,
  updateClients,
  updateListings,
  switchView,
  showCustomModal,
  userId,
  persistWorkspace,
}: {
  clients: TourClient[]
  listings: Listing[]
  updateClients: (updater: (prev: TourClient[]) => TourClient[]) => void
  updateListings: (updater: (prev: Listing[]) => Listing[]) => void
  switchView: (view: string) => void
  showCustomModal: (msg: string, requireAuth?: boolean) => void
  userId?: string
  persistWorkspace?: () => Promise<boolean>
}) {
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'list' | 'sheet'>('list')
  const [showArchived, setShowArchived] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const [draftPhone, setDraftPhone] = useState('')

  useInnerSwipeBack(step, 1, () => setStep(1))

  const people = unpackTourData(clients).people
  const archivedCount = people.filter(isArchived).length
  const visible = people.filter((person) => isArchived(person) === showArchived)
  const active = people.find((person) => person.id === activeId) || null
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const dashUrl = userId && activeId ? `${origin}/client/${userId}/${activeId}` : ''

  const patchPerson = (id: string, patch: Partial<TourClient>) => {
    updateClients((prev) => prev.map((person) => person.id === id ? { ...person, ...patch } : person))
  }

  const openPerson = (id: string) => {
    setActiveId(id)
    setStep(2)
  }

  const confirmAdd = () => {
    if (!draftName.trim()) return
    const person: TourClient = {
      id: newId(),
      name: draftName.trim(),
      email: draftEmail.trim() || undefined,
      phone: draftPhone.trim() || undefined,
      tours: [],
      homeNotes: {},
      archived: false,
    }
    updateClients((prev) => [person, ...prev])
    setDraftName('')
    setDraftEmail('')
    setDraftPhone('')
    setAdding(false)
    openPerson(person.id)
  }

  const copyDash = async () => {
    if (!dashUrl) return
    try {
      await navigator.clipboard.writeText(dashUrl)
      showCustomModal('Client dashboard link copied.')
    } catch {
      showCustomModal(dashUrl)
    }
  }

  const assignedListings = listings.filter((listing) => listing.clientId === activeId)

  return (
    <div id="view-myclients" className="app-view active space-y-4">
      {step === 1 ? (
        <>
          <OverlayNavButton kind="close" label="Close" onClick={() => switchView('home')} />
          <div className="text-center mb-2">
            <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Your people</span>
            <h1 className="text-2xl font-black mt-1">My Clients</h1>
            <p className="text-base text-slate-400 mt-1">Tap one to manage them, or use the spreadsheet on a bigger screen.</p>
          </div>

          <CrmModeBar
            mode={mode}
            onMode={setMode}
            showArchived={showArchived}
            onShowArchived={setShowArchived}
            archivedCount={archivedCount}
          />

          {adding ? (
            <div className="bg-slate-800 p-4 rounded-xl border border-sky-500/40 space-y-3">
              <input
                autoFocus
                placeholder="Client name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={draftPhone}
                onChange={(e) => setDraftPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500"
              />
              <div className="flex gap-2">
                <button type="button" onClick={confirmAdd} className="flex-1 bg-sky-500 text-slate-950 font-black py-3 rounded-lg">Save</button>
                <button type="button" onClick={() => setAdding(false)} className="flex-1 bg-slate-700 font-bold py-3 rounded-lg">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 font-black py-4 rounded-xl"
            >
              + Add a client
            </button>
          )}

          {mode === 'sheet' ? (
            <CrmSpreadsheet
              rows={visible}
              onChange={(row) => patchPerson(row.id, row)}
              onRowOpen={(row) => openPerson(row.id)}
              columns={[
                { key: 'name', label: 'Name', get: (row) => row.name || '', set: (row, value) => ({ ...row, name: value }) },
                { key: 'email', label: 'Email', type: 'email', get: (row) => row.email || '', set: (row, value) => ({ ...row, email: value || undefined }) },
                { key: 'phone', label: 'Phone', type: 'tel', get: (row) => row.phone || '', set: (row, value) => ({ ...row, phone: value || undefined }) },
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
                    {showArchived ? 'No archived clients.' : 'No active clients yet.'}
                  </p>
                </div>
              ) : (
                visible.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => openPerson(person.id)}
                    className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center hover:border-sky-500/50 transition"
                  >
                    <div>
                      <h4 className="font-bold text-white text-lg">{person.name || 'Unnamed client'}</h4>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {person.email || person.phone || 'No contact yet'}
                        {' · '}
                        {person.tours.length} {person.tours.length === 1 ? 'tour' : 'tours'}
                        {' · '}
                        {homesOnClientTours(person)} homes
                      </p>
                    </div>
                    <span className="text-slate-500">›</span>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      ) : active ? (
        <>
          <OverlayNavButton kind="back" label="Clients" onClick={() => setStep(1)} />
          <h1 className="text-2xl font-black">{active.name || 'Client'}</h1>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Name</span>
              <input
                value={active.name}
                onChange={(e) => patchPerson(active.id, { name: e.target.value })}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</span>
              <input
                type="email"
                value={active.email || ''}
                onChange={(e) => patchPerson(active.id, { email: e.target.value || undefined })}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</span>
              <input
                type="tel"
                value={active.phone || ''}
                onChange={(e) => patchPerson(active.id, { phone: e.target.value || undefined })}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500"
              />
            </label>
          </div>

          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 space-y-3">
            <h2 className="font-black">Client dashboard</h2>
            <p className="text-sm text-slate-400">A page with every tour, listing, and net sheet you’ve made for them.</p>
            <SharePreviewButtons
              url={dashUrl}
              copyLabel="Copy dashboard link"
              accentClass="bg-sky-500 hover:bg-sky-400 text-slate-950"
              onCopy={() => void copyDash()}
              onNeedAuth={userId ? undefined : () => showCustomModal('', true)}
              beforeShare={persistWorkspace}
            />
          </div>

          <div>
            <h2 className="font-black mb-2">Tours</h2>
            {active.tours.length === 0 ? (
              <p className="text-sm text-slate-500">No tours yet. Add them in Driving to a Million Places.</p>
            ) : (
              <div className="space-y-2">
                {active.tours.map((tour) => (
                  <div key={tour.id} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                    <div className="font-bold">{tour.title}</div>
                    <div className="text-sm text-slate-400">{tour.stops.length} {tour.stops.length === 1 ? 'stop' : 'stops'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-black mb-2">Listings</h2>
            <p className="text-sm text-slate-500 mb-3">Attach seller listings so they show on this client’s dashboard.</p>
            <div className="space-y-2">
              {listings.filter((listing) => !isArchived(listing) || listing.clientId === active.id).map((listing) => {
                const on = listing.clientId === active.id
                return (
                  <label key={listing.id} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => updateListings((prev) => prev.map((item) => (
                        item.id === listing.id ? { ...item, clientId: on ? undefined : active.id } : item
                      )))}
                    />
                    <span className="font-medium">{listing.address || 'Untitled listing'}{listing.city ? `, ${listing.city}` : ''}</span>
                  </label>
                )
              })}
              {listings.length === 0 ? (
                <p className="text-sm text-slate-500">No listings yet. Add them under My Homes.</p>
              ) : null}
            </div>
            {assignedListings.length > 0 ? (
              <p className="text-xs text-slate-500 mt-2">{assignedListings.length} attached to this client.</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              patchPerson(active.id, { archived: !isArchived(active) })
              setStep(1)
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold py-4 rounded-xl"
          >
            {isArchived(active) ? 'Move back to active' : 'Archive this client'}
          </button>
        </>
      ) : (
        <OverlayNavButton kind="back" label="Clients" onClick={() => setStep(1)} />
      )}
    </div>
  )
}

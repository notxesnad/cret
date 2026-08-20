'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'
import { ensurePdfUploadsAllowed } from '@/app/actions/upload'
import {
  formatPrice,
  toTimeInput,
  formatTimeDisplay,
  toDateInput,
  formatDateDisplay,
  sortStopsByTime,
} from '@/app/lib/tourFormat'

export interface ClientHome {
  id: string
  address: string
  price?: string
  notes?: string
  photo_url?: string
  mls_pdf_url?: string
}

export interface TourStop {
  homeId: string
  time?: string
}

export interface ClientTour {
  id: string
  title: string
  date?: string
  stops: TourStop[]
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  homes: ClientHome[]
  tours: ClientTour[]
}

interface DrivingViewProps {
  clients: Client[]
  updateClients: (updater: (prev: Client[]) => Client[]) => void
  showCustomModal: (msg: string) => void
  switchView: (view: string) => void
  userId?: string
}

const newId = () => Math.random().toString(36).substr(2, 9)

export function DrivingView({
  clients,
  updateClients,
  showCustomModal,
  switchView,
  userId
}: DrivingViewProps) {
  const [step, setStep] = useState(1)
  const [activeClientId, setActiveClientId] = useState<string | null>(null)
  const [activeTourId, setActiveTourId] = useState<string | null>(null)
  const [activeHomeId, setActiveHomeId] = useState<string | null>(null)

  const [isAddingClient, setIsAddingClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')

  const [isAddingTour, setIsAddingTour] = useState(false)
  const [newTourTitle, setNewTourTitle] = useState('')
  const [newTourDate, setNewTourDate] = useState('')

  const [isAddingHome, setIsAddingHome] = useState(false)
  const [newHomeAddress, setNewHomeAddress] = useState('')
  const [newHomePrice, setNewHomePrice] = useState('')

  const [editHomeForm, setEditHomeForm] = useState<Partial<ClientHome> & { time?: string }>({})
  const [uploading, setUploading] = useState<'photo' | 'mls' | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const activeClient = clients.find(c => c.id === activeClientId)
  const activeTour = activeClient?.tours.find(t => t.id === activeTourId)
  const activeHome = activeClient?.homes.find(h => h.id === activeHomeId)

  const tourHomes = sortStopsByTime(activeTour?.stops || []).map(stop => {
    const home = activeClient?.homes.find(h => h.id === stop.homeId)
    return home ? { stop, home } : null
  }).filter(Boolean) as { stop: TourStop; home: ClientHome }[]

  const unusedHomes = (activeClient?.homes || []).filter(
    h => !(activeTour?.stops || []).some(s => s.homeId === h.id)
  )

  const updateActiveClient = (updater: (client: Client) => Client) => {
    if (!activeClientId) return
    updateClients(prev => prev.map(c => c.id === activeClientId ? updater(c) : c))
  }

  const confirmAddClient = () => {
    if (!newClientName.trim()) return
    const client: Client = {
      id: newId(),
      name: newClientName.trim(),
      email: newClientEmail.trim() || undefined,
      phone: newClientPhone.trim() || undefined,
      homes: [],
      tours: []
    }
    updateClients(prev => [client, ...prev])
    setActiveClientId(client.id)
    setNewClientName('')
    setNewClientEmail('')
    setNewClientPhone('')
    setIsAddingClient(false)
    setStep(2)
  }

  const confirmAddTour = () => {
    if (!newTourTitle.trim() || !activeClientId) return
    const tour: ClientTour = {
      id: newId(),
      title: newTourTitle.trim(),
      date: newTourDate.trim() || undefined,
      stops: []
    }
    updateActiveClient(c => ({ ...c, tours: [tour, ...c.tours] }))
    setActiveTourId(tour.id)
    setNewTourTitle('')
    setNewTourDate('')
    setIsAddingTour(false)
    setStep(3)
  }

  const confirmAddHome = () => {
    if (!newHomeAddress.trim() || !activeClientId || !activeTourId) return
    const home: ClientHome = {
      id: newId(),
      address: newHomeAddress.trim(),
      price: formatPrice(newHomePrice) || undefined
    }
    updateActiveClient(c => ({
      ...c,
      homes: [home, ...c.homes],
      tours: c.tours.map(t => t.id === activeTourId
        ? { ...t, stops: sortStopsByTime([...t.stops, { homeId: home.id }]) }
        : t)
    }))
    setNewHomeAddress('')
    setNewHomePrice('')
    setIsAddingHome(false)
    setActiveHomeId(home.id)
    setEditHomeForm({ ...home, time: '' })
    setStep(4)
  }

  const addExistingHomeToTour = (homeId: string) => {
    if (!activeTourId) return
    updateActiveClient(c => ({
      ...c,
      tours: c.tours.map(t => t.id === activeTourId && !t.stops.some(s => s.homeId === homeId)
        ? { ...t, stops: sortStopsByTime([...t.stops, { homeId }]) }
        : t)
    }))
  }

  const openHome = (homeId: string) => {
    const home = activeClient?.homes.find(h => h.id === homeId)
    const stop = activeTour?.stops.find(s => s.homeId === homeId)
    if (!home) return
    setActiveHomeId(homeId)
    setEditHomeForm({ ...home, time: stop?.time || '' })
    setStep(4)
  }

  const handleSaveHome = () => {
    if (!activeHomeId || !editHomeForm.address?.trim()) return
    updateActiveClient(c => ({
      ...c,
      homes: c.homes.map(h => h.id === activeHomeId
        ? {
            ...h,
            address: editHomeForm.address!.trim(),
            price: formatPrice(editHomeForm.price || '') || undefined,
            notes: editHomeForm.notes?.trim() || undefined,
            photo_url: editHomeForm.photo_url || h.photo_url,
            mls_pdf_url: editHomeForm.mls_pdf_url || h.mls_pdf_url
          }
        : h),
      tours: c.tours.map(t => t.id === activeTourId
        ? {
            ...t,
            stops: sortStopsByTime(t.stops.map(s => s.homeId === activeHomeId
              ? { ...s, time: toTimeInput(editHomeForm.time || '') || undefined }
              : s))
          }
        : t)
    }))
    setStep(3)
  }

  const handleRemoveFromTour = () => {
    if (!activeTourId || !activeHomeId) return
    updateActiveClient(c => ({
      ...c,
      tours: c.tours.map(t => t.id === activeTourId
        ? { ...t, stops: t.stops.filter(s => s.homeId !== activeHomeId) }
        : t)
    }))
    setConfirmRemove(false)
    setActiveHomeId(null)
    setStep(3)
  }

  const uploadFile = async (file: File, kind: 'photo' | 'mls') => {
    if (!userId) {
      showCustomModal('You must be fully logged in to upload files.')
      return
    }

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

    if (!isPhoto) {
      await ensurePdfUploadsAllowed()
    }

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
    if (kind === 'photo') {
      setEditHomeForm(prev => ({ ...prev, photo_url: publicUrl }))
      updateActiveClient(c => ({
        ...c,
        homes: c.homes.map(h => h.id === activeHomeId ? { ...h, photo_url: publicUrl } : h)
      }))
    } else {
      setEditHomeForm(prev => ({ ...prev, mls_pdf_url: publicUrl }))
      updateActiveClient(c => ({
        ...c,
        homes: c.homes.map(h => h.id === activeHomeId ? { ...h, mls_pdf_url: publicUrl } : h)
      }))
    }
    setUploading(null)
  }

  const shareUrl = userId && activeClientId && activeTourId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/tour/${userId}/${activeClientId}/${activeTourId}`
    : ''

  const handleShareLink = () => {
    if (!userId) {
      showCustomModal('You must be fully logged in to share.')
      return
    }
    if (!activeClientId || !activeTourId) {
      showCustomModal('Select a tour to share.')
      return
    }
    navigator.clipboard.writeText(shareUrl).then(() => {
      showCustomModal(`Link copied! Send this to your buyer:\n\n${shareUrl}`)
    }).catch(() => {
      showCustomModal(`Here is your link (copy it manually):\n\n${shareUrl}`)
    })
  }

  const handlePrintPDF = () => {
    if (!userId || !activeClientId || !activeTourId) {
      showCustomModal('You must be fully logged in to create a PDF.')
      return
    }
    window.open(shareUrl, '_blank')
  }

  const mapsUrl = (address: string) => `https://maps.google.com/?q=${encodeURIComponent(address)}`

  return (
    <div id="view-driving" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50 flex flex-col">

      <div className="flex-none h-[72px] flex items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            <span className="text-sm font-bold uppercase tracking-wider hidden sm:inline-block">Back</span>
          </button>
        ) : (
          <button onClick={() => switchView('home')} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            <span className="text-sm font-bold uppercase tracking-wider hidden sm:inline-block">Close</span>
          </button>
        )}

        <div className="flex-1 mx-4 bg-slate-800 rounded-full h-3 overflow-hidden">
          <div
            className="bg-rose-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div
          className="absolute inset-0 flex transition-transform duration-500 ease-in-out h-full"
          style={{ width: '400%', transform: `translateX(-${(step - 1) * 25}%)` }}
        >

          {/* STEP 1: Clients */}
          <div className="w-[25%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar">
            <div className="text-center mb-8">
              <span className="text-sm font-bold tracking-widest text-rose-400 uppercase font-driving">Tour Itinerary</span>
              <h3 className="text-2xl font-black text-white mt-1">My Clients</h3>
              <p className="text-base text-slate-400 mt-2">Clients and their homes are saved for every tool.</p>
            </div>

            {isAddingClient ? (
              <div className="bg-slate-800 p-4 rounded-xl border border-rose-500/50 mb-6 space-y-3">
                <input
                  type="text"
                  autoFocus
                  placeholder="Client name"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-rose-500"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={newClientEmail}
                  onChange={e => setNewClientEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-rose-500"
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={newClientPhone}
                  onChange={e => setNewClientPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-rose-500"
                />
                <div className="flex gap-2">
                  <button onClick={confirmAddClient} className="flex-1 bg-rose-500 text-white font-bold py-3 rounded-lg text-base">Save</button>
                  <button onClick={() => { setIsAddingClient(false); setNewClientName(''); setNewClientEmail(''); setNewClientPhone(''); }} className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-lg text-base">Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingClient(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 mb-6"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Add a Client
              </button>
            )}

            <div className="space-y-3">
              {clients.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <div className="text-4xl mb-3 opacity-50">🚗</div>
                  <p className="text-base text-slate-400 font-medium">No clients yet.<br/>Add one to start building tours.</p>
                </div>
              ) : (
                clients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => { setActiveClientId(client.id); setStep(2) }}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center group cursor-pointer hover:border-rose-500/50 transition"
                  >
                    <div>
                      <h4 className="font-bold text-white text-lg">{client.name}</h4>
                      <p className="text-sm text-slate-400 mt-0.5">{client.tours.length} tours • {client.homes.length} homes</p>
                    </div>
                    <div className="text-slate-500 group-hover:text-rose-400 transition">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* STEP 2: Tours */}
          <div className="w-[25%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar">
            {activeClient && (
              <>
                <div className="mb-6">
                  <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">Tours for</span>
                  <h3 className="text-2xl font-black text-white mt-1">{activeClient.name}</h3>
                </div>

                {isAddingTour ? (
                  <div className="bg-slate-800 p-4 rounded-xl border border-rose-500/50 mb-6 space-y-3">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Tour title (e.g. Saturday Buyer Tour)"
                      value={newTourTitle}
                      onChange={e => setNewTourTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-rose-500"
                    />
                    <div className="relative">
                      {!newTourDate && (
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base">
                          Tour date (optional)
                        </span>
                      )}
                      <input
                        type="date"
                        value={newTourDate}
                        onChange={e => setNewTourDate(e.target.value)}
                        className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-rose-500 [color-scheme:dark] ${newTourDate ? 'text-white' : 'text-transparent'}`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={confirmAddTour} className="flex-1 bg-rose-500 text-white font-bold py-3 rounded-lg text-base">Save</button>
                      <button onClick={() => { setIsAddingTour(false); setNewTourTitle(''); setNewTourDate(''); }} className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-lg text-base">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingTour(true)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 mb-6"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Add a Tour
                  </button>
                )}

                <div className="space-y-3">
                  {activeClient.tours.length === 0 ? (
                    <div className="text-center py-10 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                      <p className="text-base text-slate-400 font-medium">No tours yet for {activeClient.name}.</p>
                    </div>
                  ) : (
                    activeClient.tours.map(tour => (
                      <div
                        key={tour.id}
                        onClick={() => { setActiveTourId(tour.id); setStep(3) }}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center group cursor-pointer hover:border-rose-500/50 transition"
                      >
                        <div>
                          <h4 className="font-bold text-white text-lg">{tour.title}</h4>
                          <p className="text-sm text-slate-400 mt-0.5">
                            {tour.date ? `${formatDateDisplay(tour.date)} • ` : ''}{tour.stops.length} {tour.stops.length === 1 ? 'stop' : 'stops'}
                          </p>
                        </div>
                        <div className="text-slate-500 group-hover:text-rose-400 transition">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* STEP 3: Stops */}
          <div className="w-[25%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar pb-40">
            {activeTour && activeClient && (
              <>
                <div className="mb-6">
                  <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">Itinerary</span>
                  <h3 className="text-2xl font-black text-white mt-1">{activeTour.title}</h3>
                  <input
                    type="date"
                    value={toDateInput(activeTour.date || '')}
                    onChange={e => updateActiveClient(c => ({
                      ...c,
                      tours: c.tours.map(t => t.id === activeTourId ? { ...t, date: e.target.value || undefined } : t)
                    }))}
                    className="mt-2 w-full max-w-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-base text-white focus:outline-none focus:border-rose-500 [color-scheme:dark]"
                  />
                </div>

                {isAddingHome ? (
                  <div className="bg-slate-800 p-4 rounded-xl border border-rose-500/50 mb-6 space-y-3">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Home address"
                      value={newHomeAddress}
                      onChange={e => setNewHomeAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-rose-500"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Price (optional)"
                      value={newHomePrice}
                      onChange={e => setNewHomePrice(formatPrice(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-rose-500"
                    />
                    <div className="flex gap-2">
                      <button onClick={confirmAddHome} className="flex-1 bg-rose-500 text-white font-bold py-3 rounded-lg text-base">Add Home</button>
                      <button onClick={() => { setIsAddingHome(false); setNewHomeAddress(''); setNewHomePrice(''); }} className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-lg text-base">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingHome(true)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 mb-4"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Add a Home
                  </button>
                )}

                {unusedHomes.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">From {activeClient.name}&apos;s homes</p>
                    <div className="flex flex-wrap gap-2">
                      {unusedHomes.map(home => (
                        <button
                          key={home.id}
                          onClick={() => addExistingHomeToTour(home.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-sm font-bold py-2 px-3 rounded-lg transition"
                        >
                          + {home.address}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {tourHomes.length === 0 ? (
                    <p className="text-base text-slate-500 italic text-center py-4 bg-slate-900 rounded-xl border border-slate-800">No homes on this tour yet.</p>
                  ) : (
                    tourHomes.map(({ stop, home }, index) => (
                      <div
                        key={home.id}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex gap-3 group hover:border-rose-400 transition-colors cursor-pointer"
                        onClick={() => openHome(home.id)}
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="text-3xl font-normal text-rose-400">Stop {index + 1}</span>
                            {stop.time && <span className="text-3xl font-bold text-white">{formatTimeDisplay(stop.time)}</span>}
                          </div>
                          <h4 className="font-bold text-white text-lg mt-1">{home.address}</h4>
                          {home.price && <p className="text-base font-black text-emerald-400">{home.price}</p>}
                        </div>
                        <span className="text-slate-400 group-hover:text-rose-400 p-1 self-start" title="Edit home">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l9.414-9.414a2 2 0 000-2.828l-2.172-2.172a2 2 0 00-2.828 0L4.586 14.707A1 1 0 004 15.414V20z"></path></svg>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* STEP 4: Edit Home */}
          <div className="w-[25%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar pb-40">
            {activeHome && (
              <>
                <div className="mb-6">
                  <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">Edit Home</span>
                  <h3 className="text-xl font-black text-white mt-1">Home Details</h3>
                  <p className="text-base text-slate-400 mt-1">This home stays on {activeClient?.name}&apos;s list for future tools.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-400 uppercase block mb-1 tracking-wider">Address</label>
                    <input
                      type="text"
                      value={editHomeForm.address || ''}
                      onChange={e => setEditHomeForm({ ...editHomeForm, address: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base font-bold text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-400 uppercase block mb-1 tracking-wider">Price</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="$1,250,000"
                      value={editHomeForm.price || ''}
                      onChange={e => setEditHomeForm({ ...editHomeForm, price: formatPrice(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base font-bold text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-400 uppercase block mb-1 tracking-wider">Showing Time</label>
                    <input
                      type="time"
                      value={toTimeInput(editHomeForm.time || '')}
                      onChange={e => setEditHomeForm({ ...editHomeForm, time: e.target.value.slice(0, 5) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base font-bold text-white focus:outline-none focus:border-rose-500 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-400 uppercase block mb-1 tracking-wider">Photo of the Home</label>
                    {editHomeForm.photo_url && (
                      <img src={editHomeForm.photo_url} alt="Home" className="w-full h-36 object-cover rounded-xl mb-2 border border-slate-700" />
                    )}
                    <label className="block w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-center cursor-pointer text-base">
                      {uploading === 'photo' ? 'Uploading...' : editHomeForm.photo_url ? 'Replace Photo' : 'Upload Photo'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={!!uploading}
                        onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'photo')}
                      />
                    </label>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-400 uppercase block mb-1 tracking-wider">MLS Details PDF</label>
                    {editHomeForm.mls_pdf_url && (
                      <a href={editHomeForm.mls_pdf_url} target="_blank" rel="noreferrer" className="block text-base text-rose-400 font-bold mb-2 underline">View uploaded MLS PDF</a>
                    )}
                    <label className="block w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-center cursor-pointer text-base">
                      {uploading === 'mls' ? 'Uploading...' : editHomeForm.mls_pdf_url ? 'Replace MLS PDF' : 'Upload MLS PDF'}
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        disabled={!!uploading}
                        onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'mls')}
                      />
                    </label>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-400 uppercase block mb-1 tracking-wider">Notes (Optional)</label>
                    <textarea
                      placeholder="Parking, gate code, things to point out..."
                      value={editHomeForm.notes || ''}
                      onChange={e => setEditHomeForm({ ...editHomeForm, notes: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white focus:outline-none focus:border-rose-500 min-h-[90px]"
                    />
                  </div>
                  {editHomeForm.address && (
                    <a
                      href={mapsUrl(editHomeForm.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="block bg-slate-800 text-center py-3 rounded-xl text-base font-bold hover:bg-slate-700 transition"
                    >
                      📍 Preview in Google Maps
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {step === 3 && (
        <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 z-10 pb-safe">
          <div className="flex gap-3">
            <button
              onClick={handlePrintPDF}
              className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-black py-4 rounded-xl transition shadow text-base"
            >
              PDF
            </button>
            <button
              onClick={handleShareLink}
              className="flex-[2] bg-rose-500 hover:bg-rose-400 text-white font-black py-4 rounded-xl transition shadow text-base"
            >
              Share Live Link
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 z-10 pb-safe">
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmRemove(true)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl transition border border-slate-700"
            >
              Remove
            </button>
            <button
              onClick={handleSaveHome}
              className="flex-[2] bg-rose-500 hover:bg-rose-400 text-white font-black py-4 rounded-xl transition shadow"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {confirmRemove && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
            <p className="text-base font-bold text-white">Remove this home from the tour? It will still stay on the client&apos;s home list.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRemove(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition">Keep it</button>
              <button onClick={handleRemoveFromTour} className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-black py-3 rounded-xl transition">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

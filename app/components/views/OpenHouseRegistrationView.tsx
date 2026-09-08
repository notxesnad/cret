'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useInnerSwipeBack } from '@/app/lib/useInnerSwipeBack'
import QRCode from 'qrcode'
import { type Question } from '@/app/components/Questionnaire'
import { QuizBuilder } from '@/app/components/QuizBuilder'
import { SharePreviewButtons } from '@/app/components/SharePreviewButtons'
import { ToolTile } from '@/app/components/ToolTile'
import { RegistrationExperience } from '@/app/components/RegistrationForm'
import {
  OPENHOUSE_REGISTRATION_KIND,
  STANDARD_REGISTRATION_QUESTIONS,
} from '@/app/lib/openhouseRegistration'
import type { Listing } from '@/app/components/views/SellerTrackerView'

export interface RegistrationCampaign {
  id: string
  kind: typeof OPENHOUSE_REGISTRATION_KIND
  title: string
  description: string
  questions: Question[]
  listingId?: string
  listingAddress?: string
  responses?: Record<string, unknown>[]
  createdAt: string
}

interface OpenHouseRegistrationViewProps {
  campaigns: RegistrationCampaign[]
  updateCampaigns: (updater: (prev: RegistrationCampaign[]) => RegistrationCampaign[]) => void
  listings: Listing[]
  updateListings: (updater: (prev: Listing[]) => Listing[]) => void
  switchView: (view: string) => void
  showCustomModal: (msg: string, requireAuth?: boolean) => void
  userId: string | undefined
  persistWorkspace?: () => Promise<boolean>
  agentHeader?: ReactNode
}

type OhStep = 'home' | 'how' | 'list' | 'listing' | 'template' | 'custom' | 'detail' | 'responses'

const OH_RANK: Record<OhStep, number> = {
  home: 1,
  how: 2,
  list: 2,
  listing: 2,
  template: 3,
  custom: 4,
  detail: 5,
  responses: 6,
}

const STANDARD_TEMPLATE = {
  title: 'Open House Registration',
  description: 'Sign in so the hosting agent has your info. Takes about 20 seconds.',
  questions: STANDARD_REGISTRATION_QUESTIONS,
}

export function OpenHouseRegistrationView({
  campaigns,
  updateCampaigns,
  listings,
  updateListings,
  switchView,
  showCustomModal,
  userId,
  persistWorkspace,
  agentHeader,
}: OpenHouseRegistrationViewProps) {
  const [step, setStep] = useState<OhStep>('home')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [isAddingListing, setIsAddingListing] = useState(false)
  const [newListingAddress, setNewListingAddress] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customQuestions, setCustomQuestions] = useState<Question[]>([])
  const [preview, setPreview] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const stepRank = OH_RANK[step] + (preview ? 1 : 0)
  useInnerSwipeBack(stepRank, 1, () => {
    if (preview) {
      setPreview(false)
      return
    }
    if (step === 'custom') setStep('template')
    else if (step === 'template') setStep('listing')
    else if (step === 'responses') setStep('detail')
    else if (step === 'detail') setStep('list')
    else setStep('home')
  })

  const goBack = () => {
    if (preview) {
      setPreview(false)
      return
    }
    if (step === 'custom') setStep('template')
    else if (step === 'template') setStep('listing')
    else if (step === 'responses') setStep('detail')
    else if (step === 'detail') setStep('list')
    else setStep('home')
  }

  const activeCampaign = campaigns.find(c => c.id === activeId)
  const selectedListing = listings.find(l => l.id === selectedListingId)
  const pageUrl = userId && activeId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register/${userId}/${activeId}` : ''

  useEffect(() => {
    if ((step !== 'detail' && !preview) || !pageUrl) {
      setQrDataUrl('')
      return
    }
    let cancelled = false
    void QRCode.toDataURL(pageUrl, {
      width: 720,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1e3a8a', light: '#ffffff' },
    }).then((data) => {
      if (!cancelled) setQrDataUrl(data)
    }).catch(() => {
      if (!cancelled) setQrDataUrl('')
    })
    return () => {
      cancelled = true
    }
  }, [step, preview, pageUrl])

  const newCampaignId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10)

  const startCreate = () => {
    setSelectedListingId(null)
    setIsAddingListing(false)
    setNewListingAddress('')
    setStep('listing')
  }

  const openCampaign = (id: string) => {
    setActiveId(id)
    setStep('detail')
  }

  const confirmAddListing = () => {
    const address = newListingAddress.trim()
    if (!address) return
    const listing: Listing = {
      id: crypto.randomUUID().replace(/-/g, '').slice(0, 10),
      address,
      activities: []
    }
    updateListings(prev => [listing, ...prev])
    setSelectedListingId(listing.id)
    setNewListingAddress('')
    setIsAddingListing(false)
    setStep('template')
  }

  const chooseListing = (id: string) => {
    setSelectedListingId(id)
    setStep('template')
  }

  const saveCampaign = (title: string, description: string, questions: Question[]) => {
    if (!selectedListing) {
      showCustomModal('Pick a listing before creating a registration page.')
      return
    }
    const newId = newCampaignId()
    updateCampaigns(prev => [
      {
        id: newId,
        kind: OPENHOUSE_REGISTRATION_KIND,
        title,
        description,
        questions,
        listingId: selectedListing.id,
        listingAddress: selectedListing.address,
        responses: [],
        createdAt: new Date().toISOString()
      },
      ...(prev || [])
    ])
    openCampaign(newId)
  }

  const handleCreateStandard = () => {
    saveCampaign(STANDARD_TEMPLATE.title, STANDARD_TEMPLATE.description, STANDARD_TEMPLATE.questions)
  }

  const handleCreateCustom = () => {
    if (!customTitle.trim()) {
      showCustomModal('Please enter a title for your registration page.')
      return
    }
    saveCampaign(
      customTitle.trim(),
      customDesc.trim(),
      [...STANDARD_REGISTRATION_QUESTIONS, ...customQuestions]
    )
  }

  const handleShare = () => {
    if (!userId) {
      showCustomModal('', true)
      return
    }
    if (!activeId || !pageUrl) {
      showCustomModal('You must select a registration page to share.')
      return
    }
    navigator.clipboard.writeText(pageUrl).then(() => {
      showCustomModal(`Link copied. Open this on your iPad, or let visitors scan the QR.\n\n${pageUrl}`)
    })
  }

  const previewCampaign = activeCampaign || {
    title: STANDARD_TEMPLATE.title,
    description: STANDARD_TEMPLATE.description,
    questions: STANDARD_TEMPLATE.questions,
    listingAddress: selectedListing?.address,
  }

  const secondaryBtn = 'w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-black py-4 rounded-xl transition shadow'
  const primaryBtn = 'w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 rounded-xl transition shadow'

  return (
    <div id="view-ohregistration" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50 flex flex-col">
      <div className="flex-none h-[72px] flex justify-between items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
        {step !== 'home' || preview ? (
          <button onClick={goBack} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            <span className="text-xs font-bold uppercase tracking-wider">Back</span>
          </button>
        ) : (
          <button onClick={() => switchView('openhouse')} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            <span className="text-xs font-bold uppercase tracking-wider">Open House</span>
          </button>
        )}
      </div>

      {preview ? (
        <div className="flex-1 min-h-0 flex flex-col bg-slate-50">
          {agentHeader ? <div className="flex-none [&>*]:mb-0">{agentHeader}</div> : null}
          <div className="flex-1 min-h-0">
            <RegistrationExperience
              address={previewCampaign.listingAddress}
              title={previewCampaign.title}
              description={previewCampaign.description}
              questions={previewCampaign.questions}
              qrDataUrl={qrDataUrl}
              onSubmit={async () => {}}
            />
          </div>
        </div>
      ) : (
        <>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden hide-scrollbar bg-slate-900">
        <div className="p-6">
          {step === 'home' && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase block mb-2">Open House Tools</span>
                <h1 className="font-openhouse text-3xl md:text-4xl text-white">Open House Registration</h1>
                <p className="text-lg text-slate-300 mt-4 leading-relaxed">A full-page sign-in with your header, the listing, and a QR code for phones.</p>
              </div>

              <div className="space-y-4">
                <ToolTile
                  onClick={() => setStep('how')}
                  className="group relative bg-indigo-100 hover:bg-white text-slate-900 p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden border-2 border-transparent hover:border-indigo-300"
                >
                  <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:-rotate-6">💡</div>
                  <span className="text-xs font-bold tracking-wider uppercase opacity-70">A 30-second tour</span>
                  <h2 className="font-openhouse text-2xl md:text-3xl mt-1">What does this thing do</h2>
                </ToolTile>
                <ToolTile
                  onClick={startCreate}
                  className="group relative bg-indigo-600 hover:bg-indigo-500 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden"
                >
                  <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">✏️</div>
                  <span className="text-xs font-bold tracking-wider uppercase opacity-70">Start here</span>
                  <h2 className="font-openhouse text-2xl md:text-3xl mt-1">Make a Registration Page</h2>
                </ToolTile>
                <ToolTile
                  onClick={() => setStep('list')}
                  className="group relative bg-white hover:bg-indigo-50 text-slate-900 p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden border-2 border-transparent hover:border-indigo-300"
                >
                  <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition">📋</div>
                  <span className="text-xs font-bold tracking-wider uppercase opacity-70">
                    {campaigns.length === 1 ? '1 saved' : `${campaigns.length} saved`}
                  </span>
                  <h2 className="font-openhouse text-2xl md:text-3xl mt-1">See the ones I&apos;ve built already</h2>
                </ToolTile>
              </div>
            </div>
          )}

          {step === 'how' && (
            <div className="animate-fade-in-up space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-black text-white">What this does</h2>
                <p className="text-base text-slate-300 mt-3 leading-relaxed">
                  Put this page on an iPad at the door. Visitors sign in with their name, or scan the QR and do it on their phone.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { n: '1', t: 'Pick the listing', d: 'Use one you already have, or add a new address.' },
                  { n: '2', t: 'Use the standard form — or add your own questions', d: 'Name, a phone or email, and the realtor question are always included.' },
                  { n: '3', t: 'Open the link on your iPad', d: 'Or print / show the QR so people can sign in on their phones.' },
                  { n: '4', t: 'Read who came by', d: 'Names, numbers, and whether they are a realtor or already have one.' },
                ].map(item => (
                  <div key={item.n} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex gap-4">
                    <div className="flex-none w-9 h-9 rounded-full bg-indigo-500 text-white font-black flex items-center justify-center">{item.n}</div>
                    <div>
                      <p className="font-black text-white">{item.t}</p>
                      <p className="text-sm text-slate-400 mt-1">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => setPreview(true)} className={primaryBtn}>
                Preview what visitors see
              </button>
            </div>
          )}

          {step === 'list' && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white">Your registration pages</h2>
                <p className="text-base text-slate-400 mt-2">Tap one to copy the link, show the QR, or see who signed in.</p>
              </div>
              <div className="space-y-3">
                {campaigns.length === 0 ? (
                  <div className="text-center space-y-4 py-6">
                    <p className="text-slate-400">None yet. Make one and it will show up here.</p>
                    <button type="button" onClick={startCreate} className={primaryBtn}>
                      Make a Registration Page
                    </button>
                  </div>
                ) : (
                  campaigns.map(c => (
                    <div
                      key={c.id}
                      onClick={() => openCampaign(c.id)}
                      className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/50 cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <h3 className="text-white font-bold">{c.listingAddress || c.title}</h3>
                        <p className="text-xs text-slate-400">{c.listingAddress ? c.title : new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-xs font-bold px-2 py-1 rounded bg-slate-700 text-indigo-300">
                        {c.responses?.length || 0} Signed in
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 'listing' && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white">Which listing?</h2>
                <p className="text-base text-slate-400 mt-2">Every registration page is tied to a property.</p>
              </div>

              {isAddingListing ? (
                <div className="bg-slate-800 p-4 rounded-xl border border-indigo-500/50 mb-6">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter property address..."
                    value={newListingAddress}
                    onChange={e => setNewListingAddress(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && confirmAddListing()}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 mb-3"
                  />
                  <div className="flex gap-2">
                    <button onClick={confirmAddListing} className="flex-1 bg-indigo-500 text-white font-bold py-2 rounded-lg">Save</button>
                    <button onClick={() => { setIsAddingListing(false); setNewListingAddress('') }} className="flex-1 bg-slate-700 text-white font-bold py-2 rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingListing(true)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 mb-6"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Add a Listing
                </button>
              )}

              <div className="space-y-3">
                {listings.length === 0 ? (
                  <p className="text-slate-500 text-center italic py-4">No listings yet. Add one above — it also shows up in Seller Tracking.</p>
                ) : (
                  listings.map(listing => (
                    <div
                      key={listing.id}
                      onClick={() => chooseListing(listing.id)}
                      className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:border-indigo-500/50 transition"
                    >
                      <div>
                        <h4 className="font-bold text-white text-lg">{listing.address}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{listing.activities?.length || 0} seller activities logged</p>
                      </div>
                      <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 'template' && (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-black text-white mb-2">Select a Template</h2>
              {selectedListing && (
                <p className="text-sm text-indigo-300 font-bold mb-6">{selectedListing.address}</p>
              )}
              <div className="space-y-4">
                <div
                  className="bg-indigo-500/10 border-2 border-dashed border-indigo-500/50 rounded-xl p-5 hover:bg-indigo-500/20 hover:border-indigo-500 transition cursor-pointer flex flex-col items-center justify-center text-center mb-6 min-h-[140px]"
                  onClick={() => {
                    setCustomTitle(selectedListing?.address ? `${selectedListing.address} Registration` : 'Open House Registration')
                    setCustomDesc('')
                    setCustomQuestions([])
                    setStep('custom')
                  }}
                >
                  <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center mb-2 shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                  </div>
                  <h3 className="text-lg font-bold text-indigo-400">Create your own</h3>
                  <p className="text-sm text-indigo-300/70">Keep the standard sign-in fields, then add extra questions</p>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-400"></div>
                  <span className="flex-shrink-0 mx-4 text-white text-xs font-bold uppercase tracking-widest">Or choose template</span>
                  <div className="flex-grow border-t border-slate-400"></div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition cursor-pointer" onClick={handleCreateStandard}>
                  <h3 className="text-lg font-bold text-white mb-2">{STANDARD_TEMPLATE.title}</h3>
                  <p className="text-sm text-slate-400 mb-4">{STANDARD_TEMPLATE.description}</p>
                  <div className="flex gap-2 items-center flex-wrap">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        setPreview(true)
                      }}
                      className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                    >
                      Preview
                    </button>
                    <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">Name &amp; contact</span>
                    <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">Realtor question</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'custom' && (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-black text-white mb-6">Build Your Registration</h2>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Page Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder="e.g. 123 Ocean Drive Registration"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Intro Text (Optional)</label>
                  <textarea
                    value={customDesc}
                    onChange={e => setCustomDesc(e.target.value)}
                    placeholder="This text appears under the address..."
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  ></textarea>
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Always included</p>
                <p className="text-sm text-slate-200 font-bold">Name, phone or email, and the realtor question.</p>
              </div>
              <div className="mb-8 border-t border-slate-800 pt-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-4">Extra questions (optional)</label>
                <QuizBuilder questions={customQuestions} onChange={setCustomQuestions} bank="registration" />
              </div>
            </div>
          )}

          {step === 'detail' && activeCampaign && (
            <div className="animate-fade-in-up pb-8">
              <div className="mb-8">
                <h2 className="font-openhouse text-3xl md:text-5xl text-indigo-400 leading-tight">
                  {activeCampaign.listingAddress || 'Registration'}
                </h2>
                <p className="text-xl font-black text-white mt-3 leading-tight">{activeCampaign.title}</p>
              </div>

              <div className="bg-slate-800 rounded-xl p-5 mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Open on your device</p>
                <p className="text-sm text-slate-400 mt-1 mb-4 leading-relaxed">
                  Copy the link or scan this QR with your iPad. Visitors can sign in there, or scan the QR on the page onto their phone.
                </p>
                {qrDataUrl ? (
                  <div className="bg-white rounded-2xl p-4 mb-4 flex justify-center">
                    <img src={qrDataUrl} alt="Registration QR code" className="w-56 h-56" />
                  </div>
                ) : null}
                <SharePreviewButtons
                  url={pageUrl}
                  copyLabel="Copy Link"
                  accentClass="bg-indigo-500 hover:bg-indigo-400 text-white"
                  onCopy={handleShare}
                  onNeedAuth={!userId ? () => showCustomModal('', true) : undefined}
                  beforeShare={persistWorkspace}
                />
              </div>

              <div className="bg-slate-800 rounded-xl p-5 mb-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-500 text-white rounded-full flex items-center justify-center mb-3 shadow-lg text-2xl font-black">
                  {activeCampaign.responses?.length || 0}
                </div>
                <h3 className="text-white font-bold mb-4">Who signed in</h3>
                <button
                  type="button"
                  onClick={() => setStep('responses')}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 rounded-xl transition shadow"
                >
                  See Registrations
                </button>
              </div>

              <button type="button" onClick={() => setPreview(true)} className={secondaryBtn}>
                Preview the page
              </button>
            </div>
          )}

          {step === 'responses' && activeCampaign && (
            <div className="animate-fade-in-up pb-8">
              <div className="mb-8">
                <h2 className="font-openhouse text-3xl md:text-5xl text-indigo-400 leading-tight">
                  {activeCampaign.listingAddress || 'Registration'}
                </h2>
                <p className="text-xl font-black text-white mt-3 leading-tight">Who signed in</p>
              </div>

              <div className="w-16 h-16 bg-indigo-500 text-white rounded-full flex items-center justify-center mb-6 shadow-lg text-2xl font-black mx-auto">
                {activeCampaign.responses?.length || 0}
              </div>

              {activeCampaign.responses && activeCampaign.responses.length > 0 ? (
                <div className="space-y-4">
                  {activeCampaign.responses.slice().reverse().map((resp, i) => {
                    const answers = (resp as { answers?: Record<string, string> }).answers || {}
                    return (
                      <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                        <p className="text-lg font-black text-white">{answers.name || 'Guest'}</p>
                        <p className="text-sm text-indigo-300 mt-1">{answers.phone || ''}{answers.email ? ` · ${answers.email}` : ''}</p>
                        <p className="text-xs text-slate-400 mt-2">{new Date((resp as { date?: string }).date || '').toLocaleDateString()} at {new Date((resp as { date?: string }).date || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <div className="space-y-3 mt-3">
                          {activeCampaign.questions.filter(q => !['name', 'phone', 'email', 'contact'].includes(q.id)).map((q) => (
                            <div key={q.id}>
                              <p className="text-xs font-bold text-slate-300 mb-1">{q.text}</p>
                              <p className="text-sm text-indigo-300 bg-slate-900 p-2 rounded">{String(answers[q.id] || 'No answer')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <p className="text-lg font-black text-white">Nobody has signed in yet</p>
                  <p className="text-slate-400 text-sm mt-2">Open the link on your iPad or share the QR, then check back during the open house.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {step === 'custom' && (
        <div className="flex-none border-t border-slate-800 bg-slate-900 p-4 pb-safe w-full z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
          <button
            onClick={handleCreateCustom}
            className={`w-full font-black py-4 rounded-xl shadow-lg transition text-lg uppercase tracking-wide ${
              customTitle.trim()
                ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Save Registration Page
          </button>
        </div>
      )}
        </>
      )}
    </div>
  )
}

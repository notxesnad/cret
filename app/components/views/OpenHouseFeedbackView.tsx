'use client'

import { useState, type ReactNode } from 'react'
import { useInnerSwipeBack } from '@/app/lib/useInnerSwipeBack'
import QRCode from 'qrcode'
import { Question, Questionnaire } from '@/app/components/Questionnaire'
import { QuizBuilder } from '@/app/components/QuizBuilder'
import { SharePreviewButtons } from '@/app/components/SharePreviewButtons'
import { ToolTile } from '@/app/components/ToolTile'
import { ClientThemeToggle } from '@/app/components/ClientThemeToggle'
import { OPENHOUSE_FEEDBACK_KIND } from '@/app/lib/openhouseFeedback'
import { normalizeOpenHouseTheme, type QuizTheme } from '@/app/lib/quizTheme'
import type { Listing } from '@/app/components/views/SellerTrackerView'

export interface FeedbackCampaign {
  id: string
  kind: typeof OPENHOUSE_FEEDBACK_KIND
  title: string
  description: string
  questions: Question[]
  listingId?: string
  listingAddress?: string
  theme?: QuizTheme
  responses?: Record<string, unknown>[]
  createdAt: string
}

interface OpenHouseFeedbackViewProps {
  campaigns: FeedbackCampaign[]
  updateCampaigns: (updater: (prev: FeedbackCampaign[]) => FeedbackCampaign[]) => void
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

const templates: { title: string; description: string; questions: Question[] }[] = [
  {
    title: 'Anonymous Open House Feedback',
    description: 'Thank you for visiting our open house. This is 100% anonymous — no name or phone number required.',
    questions: [
      { id: 'q1', type: 'rating', maxRating: 5, text: 'Overall, how would you rate this property?' },
      { id: 'q2', type: 'text', optional: true, text: 'What did you like most about the home?', placeholder: 'e.g., The natural light, the backyard, the kitchen...' },
      { id: 'q3', type: 'text', optional: true, text: 'Any suggestions for improvement?', placeholder: 'e.g., The paint color in the bedroom, the old carpet...' },
      { id: 'q4', type: 'choice', text: "How does this home compare to others you've seen?", options: ["It's one of the best I've seen", "It's about the same as others", "It doesn't quite compare"] },
      { id: 'q5', type: 'choice', text: 'Are you currently working with a real estate agent?', options: ['Yes, I am', "No, I'm currently searching on my own"] },
    ]
  },
  {
    title: 'Price & Offer Check',
    description: 'Quick anonymous thoughts on price and next steps. Takes about 20 seconds.',
    questions: [
      { id: 'q1', type: 'choice', text: 'How does the asking price feel?', options: ['Priced too high', 'About right', 'A good value'] },
      { id: 'q2', type: 'rating', maxRating: 5, text: 'How likely are you to make an offer?' },
      { id: 'q3', type: 'text', optional: true, text: 'What would need to change for you to write an offer?', placeholder: 'e.g., Price, repairs, a credit for the roof...' },
    ]
  },
  {
    title: 'Staging & First Impression',
    description: 'Help us see the home through a visitor\'s eyes. Anonymous and fast.',
    questions: [
      { id: 'q1', type: 'rating', maxRating: 5, text: 'How would you rate the first impression from the curb?' },
      { id: 'q2', type: 'choice', text: 'Which area felt the strongest?', options: ['Kitchen', 'Primary suite', 'Living spaces', 'Outdoor / backyard', 'Location'] },
      { id: 'q3', type: 'text', optional: true, text: 'What felt dated, empty, or off?', placeholder: 'e.g., Paint, flooring, furniture layout...' },
    ]
  }
]

const DEMO_PREVIEW = templates[0]

export function OpenHouseFeedbackView({
  campaigns,
  updateCampaigns,
  listings,
  updateListings,
  switchView,
  showCustomModal,
  userId,
  persistWorkspace,
  agentHeader,
}: OpenHouseFeedbackViewProps) {
  const [step, setStep] = useState<OhStep>('home')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [isAddingListing, setIsAddingListing] = useState(false)
  const [newListingAddress, setNewListingAddress] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customQuestions, setCustomQuestions] = useState<Question[]>([])
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [preview, setPreview] = useState<{ title: string; description: string; questions: Question[] } | null>(null)

  const stepRank = OH_RANK[step] + (preview ? 1 : 0)
  useInnerSwipeBack(stepRank, 1, () => {
    if (preview) {
      setPreview(null)
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
      setPreview(null)
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
  const quizUrl = userId && activeId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/feedback/${userId}/${activeId}` : ''
  const printUrl = quizUrl ? `${quizUrl}/print` : ''
  const reportUrl = quizUrl ? `${quizUrl}/report` : ''
  const fileSlug = (activeCampaign?.listingAddress || activeCampaign?.title || 'open-house')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'open-house'

  const newCampaignId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10)

  const startCreate = () => {
    setSelectedListingId(null)
    setIsAddingListing(false)
    setNewListingAddress('')
    setStep('listing')
  }

  const loadQr = async (id: string) => {
    if (!userId) {
      setQrDataUrl('')
      return
    }
    const url = `${window.location.origin}/feedback/${userId}/${id}`
    try {
      const data = await QRCode.toDataURL(url, {
        width: 256,
        margin: 1,
        errorCorrectionLevel: 'L',
        color: { dark: '#0f172a', light: '#ffffff' },
      })
      setQrDataUrl(data)
    } catch {
      setQrDataUrl('')
    }
  }

  const openCampaign = (id: string) => {
    setActiveId(id)
    setStep('detail')
    void loadQr(id)
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

  const handleCreate = (template: (typeof templates)[number]) => {
    if (!selectedListing) {
      showCustomModal('Pick a listing before creating a questionnaire.')
      return
    }
    const newId = newCampaignId()
    updateCampaigns(prev => [
      {
        id: newId,
        kind: OPENHOUSE_FEEDBACK_KIND,
        title: template.title,
        description: template.description,
        questions: template.questions,
        listingId: selectedListing.id,
        listingAddress: selectedListing.address,
        theme: 'light',
        responses: [],
        createdAt: new Date().toISOString()
      },
      ...(prev || [])
    ])
    openCampaign(newId)
  }

  const handleCreateCustom = () => {
    if (!selectedListing) {
      showCustomModal('Pick a listing before creating a questionnaire.')
      return
    }
    if (!customTitle.trim()) {
      showCustomModal('Please enter a title for your questionnaire.')
      return
    }
    if (customQuestions.length === 0) {
      showCustomModal('Please add at least one question to your quiz.')
      return
    }

    const newId = newCampaignId()
    updateCampaigns(prev => [
      {
        id: newId,
        kind: OPENHOUSE_FEEDBACK_KIND,
        title: customTitle,
        description: customDesc,
        questions: customQuestions,
        listingId: selectedListing.id,
        listingAddress: selectedListing.address,
        theme: 'light',
        responses: [],
        createdAt: new Date().toISOString()
      },
      ...(prev || [])
    ])
    openCampaign(newId)
  }

  const requireSignedIn = () => {
    if (!userId) {
      showCustomModal('', true)
      return false
    }
    return true
  }

  const persistThen = async (action: () => void) => {
    if (!requireSignedIn()) return
    if (persistWorkspace) {
      const ok = await persistWorkspace()
      if (ok === false) return
    }
    action()
  }

  const downloadQrPng = async () => {
    if (!requireSignedIn() || !userId || !activeId) return
    const url = `${window.location.origin}/feedback/${userId}/${activeId}`
    try {
      const data = await QRCode.toDataURL(url, {
        width: 1024,
        margin: 1,
        errorCorrectionLevel: 'L',
        color: { dark: '#0f172a', light: '#ffffff' },
      })
      const link = document.createElement('a')
      link.href = data
      link.download = `${fileSlug}-qr.png`
      link.click()
    } catch {
      showCustomModal('Could not download the QR code. Please try again.')
    }
  }

  const handleShare = () => {
    if (!userId) {
      showCustomModal('', true)
      return
    }
    if (!activeId || !quizUrl) {
      showCustomModal('You must select a questionnaire to share.')
      return
    }
    navigator.clipboard.writeText(quizUrl).then(() => {
      showCustomModal(`Link copied! Visitors stay anonymous.\n\n${quizUrl}`)
    })
  }

  const handleCopyClientLink = () => {
    if (!requireSignedIn()) return
    if (!reportUrl) {
      showCustomModal('You must select a questionnaire first.')
      return
    }
    navigator.clipboard.writeText(reportUrl).then(() => {
      showCustomModal(`Client link copied. Send this to your seller.\n\n${reportUrl}`)
    })
  }

  const previewLead = {
    title: 'Want a free monthly neighborhood snapshot?',
    body: selectedListing
      ? `I'll send a short recap of prices, inventory, and what actually sold in the ${selectedListing.address} area. No listing pitches — just useful local numbers.`
      : "I'll send a short recap of prices, inventory, and what actually sold nearby. No listing pitches — just useful local numbers.",
    cta: 'Send me the monthly snapshot',
    onSubmit: async () => {},
  }

  const secondaryBtn = 'w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-black py-4 rounded-xl transition shadow'
  const primaryBtn = 'w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 rounded-xl transition shadow'

  return (
    <div id="view-ohfeedback" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50 flex flex-col">
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
            <Questionnaire
              key={`${preview.title}-${preview.questions.length}`}
              title={preview.title}
              description={preview.description}
              questions={preview.questions}
              onSubmit={async () => {}}
              accentColor="indigo"
              theme="light"
              captureLead={previewLead}
            />
          </div>
        </div>
      ) : (
        <>
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar bg-slate-900">
        <div className="p-6">
          {step === 'home' && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase block mb-2">Open House Tools</span>
                <h1 className="font-openhouse text-3xl md:text-4xl text-white">Collect Anonymous Open House Feedback</h1>
                <p className="text-lg text-slate-300 mt-4 leading-relaxed">Visitors share honest thoughts without leaving a name.</p>
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
                  <h2 className="font-openhouse text-2xl md:text-3xl mt-1">Make a Questionnaire</h2>
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
                  Visitors scan a QR code on their phone and answer a few quick questions. No name required, so you actually hear what they think.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { n: '1', t: 'You make a short questionnaire', d: 'Pick a listing and a template. Takes a minute.' },
                  { n: '2', t: 'Print a QR sign', d: 'Leave copies on the kitchen counter, the flyer table, or the front door.' },
                  { n: '3', t: 'They tap through on their phone', d: 'Price, staging, first impression — honest answers while you host.' },
                  { n: '4', t: 'You read the notes later', d: 'Sellers get real feedback they would never say to your face.' },
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

              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
                <p className="font-black text-indigo-200">Why sellers like it</p>
                <p className="text-sm text-slate-300 leading-relaxed">No clipboard staring at them. No pressure. You still catch people who are willing to talk — after they submit, we ask if they want a free monthly neighborhood snapshot. They can skip it. The quiz itself stays anonymous.</p>
              </div>

              <button
                type="button"
                onClick={() => setPreview(DEMO_PREVIEW)}
                className={primaryBtn}
              >
                Preview what visitors see
              </button>
            </div>
          )}

          {step === 'list' && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white">Your questionnaires</h2>
                <p className="text-base text-slate-400 mt-2">Tap one to share, print a QR sign, or read responses.</p>
              </div>
              <div className="space-y-3">
                {campaigns.length === 0 ? (
                  <div className="text-center space-y-4 py-6">
                    <p className="text-slate-400">None yet. Make one and it will show up here.</p>
                    <button type="button" onClick={startCreate} className={primaryBtn}>
                      Make a Questionnaire
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
                        {c.responses?.length || 0} Responses
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
                <p className="text-base text-slate-400 mt-2">Every questionnaire is tied to a property so feedback stays organized.</p>
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
                    setCustomTitle(selectedListing?.address || '')
                    setCustomDesc('')
                    setCustomQuestions([])
                    setStep('custom')
                  }}
                >
                  <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center mb-2 shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                  </div>
                  <h3 className="text-lg font-bold text-indigo-400">Build from Scratch</h3>
                  <p className="text-sm text-indigo-300/70">Create a completely custom questionnaire</p>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-400"></div>
                  <span className="flex-shrink-0 mx-4 text-white text-xs font-bold uppercase tracking-widest">Or choose template</span>
                  <div className="flex-grow border-t border-slate-400"></div>
                </div>

                {templates.map((tpl, i) => (
                  <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition cursor-pointer" onClick={() => handleCreate(tpl)}>
                    <h3 className="text-lg font-bold text-white mb-2">{tpl.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{tpl.description}</p>
                    <div className="flex gap-2 items-center flex-wrap">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          setPreview(tpl)
                        }}
                        className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                      >
                        Preview
                      </button>
                      <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">{tpl.questions.length} Questions</span>
                      <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">Anonymous</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'custom' && (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-black text-white mb-6">Build Custom Quiz</h2>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Questionnaire Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder="e.g. 123 Ocean Drive Open House"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Intro Text (Optional)</label>
                  <textarea
                    value={customDesc}
                    onChange={e => setCustomDesc(e.target.value)}
                    placeholder="This text appears on the first question to remind visitors the quiz is anonymous..."
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  ></textarea>
                </div>
              </div>
              <div className="mb-8 border-t border-slate-800 pt-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-4">Quiz Questions</label>
                <QuizBuilder questions={customQuestions} onChange={setCustomQuestions} bank="openhouse" />
              </div>
            </div>
          )}

          {step === 'detail' && activeCampaign && (
            <div className="animate-fade-in-up pb-8">
              <div className="mb-8">
                <h2 className="font-openhouse text-3xl md:text-5xl text-indigo-400 leading-tight">
                  {activeCampaign.listingAddress || 'Questionnaire'}
                </h2>
                <p className="text-xl font-black text-white mt-3 leading-tight">{activeCampaign.title}</p>
              </div>

              <div className="mb-6">
                <ClientThemeToggle
                  value={normalizeOpenHouseTheme(activeCampaign.theme)}
                  onChange={(theme) => {
                    updateCampaigns(prev => prev.map(c => c.id === activeCampaign.id ? { ...c, theme } : c))
                  }}
                />
              </div>

              <div className="bg-slate-800 rounded-xl p-5 mb-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-500 text-white rounded-full flex items-center justify-center mb-3 shadow-lg text-2xl font-black">
                  {activeCampaign.responses?.length || 0}
                </div>
                <h3 className="text-white font-bold mb-4">Anonymous Responses</h3>
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="Feedback QR code" className="w-28 h-28 bg-white rounded-lg mb-4" />
                )}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => void persistThen(() => {
                      if (printUrl) window.open(printUrl, '_blank', 'noopener,noreferrer')
                    })}
                    className="bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 px-2 rounded-xl transition text-sm leading-tight"
                  >
                    Print my QR Sign
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadQrPng()}
                    className="bg-white hover:bg-slate-100 text-slate-900 font-black py-4 px-2 rounded-xl transition text-sm leading-tight"
                  >
                    Download QR code
                  </button>
                </div>
              </div>

            </div>
          )}

          {step === 'responses' && activeCampaign && (
            <div className="animate-fade-in-up pb-8">
              <div className="mb-8">
                <h2 className="font-openhouse text-3xl md:text-5xl text-indigo-400 leading-tight">
                  {activeCampaign.listingAddress || 'Questionnaire'}
                </h2>
                <p className="text-xl font-black text-white mt-3 leading-tight">What visitors said</p>
              </div>

              <div className="w-16 h-16 bg-indigo-500 text-white rounded-full flex items-center justify-center mb-6 shadow-lg text-2xl font-black mx-auto">
                {activeCampaign.responses?.length || 0}
              </div>

              {activeCampaign.responses && activeCampaign.responses.length > 0 ? (
                <div className="space-y-4">
                  {activeCampaign.responses.slice().reverse().map((resp, i) => (
                    <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-3">{new Date((resp as { date?: string }).date || '').toLocaleDateString()} at {new Date((resp as { date?: string }).date || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <div className="space-y-3">
                        {activeCampaign.questions.map((q) => (
                          <div key={q.id}>
                            <p className="text-xs font-bold text-slate-300 mb-1">{q.text}</p>
                            <p className="text-sm text-indigo-300 bg-slate-900 p-2 rounded">{String((resp as { answers?: Record<string, string> }).answers?.[q.id] || 'No answer')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <p className="text-lg font-black text-white">Nobody has answered yet</p>
                  <p className="text-slate-400 text-sm mt-2">Print the QR sign or share the quiz link, then check back after the open house.</p>
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
              customTitle.trim() && customQuestions.length > 0
                ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Save Questionnaire
          </button>
        </div>
      )}

      {step === 'detail' && (
        <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 z-10 pb-safe">
          <SharePreviewButtons
            url={quizUrl}
            copyLabel="Copy Link"
            accentClass="bg-indigo-500 hover:bg-indigo-400 text-white"
            onCopy={handleShare}
            onNeedAuth={!userId ? () => showCustomModal('', true) : undefined}
            beforeShare={persistWorkspace}
            extra={
              <button
                type="button"
                onClick={() => setStep('responses')}
                className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl transition text-sm text-center"
              >
                See Responses
              </button>
            }
          />
        </div>
      )}

      {step === 'responses' && (
        <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 z-10 pb-safe">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void persistThen(() => {
                if (reportUrl) window.open(reportUrl, '_blank', 'noopener,noreferrer')
              })}
              className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-black py-4 rounded-xl transition shadow text-base"
            >
              Client PDF
            </button>
            <button
              type="button"
              onClick={() => void persistThen(handleCopyClientLink)}
              className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 rounded-xl transition shadow text-base"
            >
              Copy Client Link
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

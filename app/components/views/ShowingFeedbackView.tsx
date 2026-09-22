'use client'

import { useState, type ReactNode } from 'react'
import { useInnerSwipeBack } from '@/app/lib/useInnerSwipeBack'
import { Question, Questionnaire } from '@/app/components/Questionnaire'
import { QuizBuilder } from '@/app/components/QuizBuilder'
import { SharePreviewButtons } from '@/app/components/SharePreviewButtons'
import { ToolTile } from '@/app/components/ToolTile'
import { HowToTour } from '@/app/components/HowToTour'
import { OverlayNavButton } from '@/app/components/OverlayNavButton'
import { TemplateDivider } from '@/app/components/TemplateDivider'
import {
  SHOWING_FEEDBACK_KIND,
  SHOWING_FEEDBACK_TEMPLATES,
} from '@/app/lib/showingFeedback'
import { SHOWING_FEEDBACK_TOUR } from '@/app/lib/toolTours'
import { csvFilename, downloadResponsesCsv, formatCsvDate, type CsvResponse } from '@/app/lib/csvDownload'
import { type QuizTheme } from '@/app/lib/quizTheme'
import type { Listing } from '@/app/components/views/SellerTrackerView'

export interface ShowingFeedbackCampaign {
  id: string
  kind: typeof SHOWING_FEEDBACK_KIND
  title: string
  description: string
  questions: Question[]
  listingId?: string
  listingAddress?: string
  theme?: QuizTheme
  responses?: Record<string, unknown>[]
  createdAt: string
}

interface ShowingFeedbackViewProps {
  campaigns: ShowingFeedbackCampaign[]
  updateCampaigns: (updater: (prev: ShowingFeedbackCampaign[]) => ShowingFeedbackCampaign[]) => void
  listings: Listing[]
  updateListings: (updater: (prev: Listing[]) => Listing[]) => void
  switchView: (view: string) => void
  showCustomModal: (msg: string, requireAuth?: boolean) => void
  userId: string | undefined
  persistWorkspace?: () => Promise<boolean>
  agentHeader?: ReactNode
}

type Step = 'home' | 'how' | 'list' | 'listing' | 'template' | 'custom' | 'detail' | 'responses'

const STEP_RANK: Record<Step, number> = {
  home: 1,
  how: 2,
  list: 2,
  listing: 2,
  template: 3,
  custom: 4,
  detail: 5,
  responses: 6,
}

const DEMO_PREVIEW = SHOWING_FEEDBACK_TEMPLATES[0]

export function ShowingFeedbackView({
  campaigns,
  updateCampaigns,
  listings,
  updateListings,
  switchView,
  showCustomModal,
  userId,
  persistWorkspace,
  agentHeader,
}: ShowingFeedbackViewProps) {
  const [step, setStep] = useState<Step>('home')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [isAddingListing, setIsAddingListing] = useState(false)
  const [newListingAddress, setNewListingAddress] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customQuestions, setCustomQuestions] = useState<Question[]>([])
  const [preview, setPreview] = useState<{ title: string; description: string; questions: Question[] } | null>(null)
  const [previewFromHow, setPreviewFromHow] = useState(false)
  const [howPage, setHowPage] = useState(0)
  const howLast = howPage >= SHOWING_FEEDBACK_TOUR.length - 1
  const closeHow = (step === 'how' && howLast) || (Boolean(preview) && previewFromHow)

  const stepRank = STEP_RANK[step] + (preview ? 1 : 0) + (step === 'how' ? howPage : 0)
  const exitHow = () => {
    setPreview(null)
    setPreviewFromHow(false)
    setHowPage(0)
    setStep('home')
  }
  const goBack = () => {
    if (preview && previewFromHow) {
      exitHow()
      return
    }
    if (preview) {
      setPreview(null)
      return
    }
    if (step === 'how' && howLast) {
      exitHow()
      return
    }
    if (step === 'how' && howPage > 0) {
      setHowPage(page => page - 1)
      return
    }
    if (step === 'custom') setStep('template')
    else if (step === 'template') setStep('listing')
    else if (step === 'responses') setStep('detail')
    else if (step === 'detail') setStep('list')
    else setStep('home')
  }
  useInnerSwipeBack(stepRank, 1, goBack)

  const activeCampaign = campaigns.find(c => c.id === activeId)
  const selectedListing = listings.find(l => l.id === selectedListingId)
  const quizUrl = userId && activeId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/showing-feedback/${userId}/${activeId}` : ''
  const reportUrl = quizUrl ? `${quizUrl}/report` : ''
  const feedbackCountFor = (listingId: string) =>
    campaigns
      .filter(c => c.listingId === listingId)
      .reduce((n, c) => n + (c.responses?.length || 0), 0)

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

  const handleCreate = (template: (typeof SHOWING_FEEDBACK_TEMPLATES)[number]) => {
    if (!selectedListing) {
      showCustomModal('Pick a listing before creating a questionnaire.')
      return
    }
    const newId = newCampaignId()
    updateCampaigns(prev => [
      {
        id: newId,
        kind: SHOWING_FEEDBACK_KIND,
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
        kind: SHOWING_FEEDBACK_KIND,
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
      showCustomModal(`Link copied. Text this to the agent who showed the home.\n\n${quizUrl}`)
    })
  }

  const handleCopyClientLink = () => {
    if (!requireSignedIn()) return
    if (!reportUrl) {
      showCustomModal('You must select a questionnaire first.')
      return
    }
    navigator.clipboard.writeText(reportUrl).then(() => {
      showCustomModal(`Seller report copied. Send this to your seller.\n\n${reportUrl}`)
    })
  }

  const handleDownloadCsv = () => {
    if (!activeCampaign?.responses?.length) return
    downloadResponsesCsv(
      csvFilename('showing-feedback', activeCampaign.listingAddress || activeCampaign.title),
      [
        { header: 'Submitted', get: r => formatCsvDate(r.date) },
        ...activeCampaign.questions.map(q => ({
          header: q.text,
          get: (r: CsvResponse) => String(r.answers?.[q.id] ?? ''),
        })),
      ],
      activeCampaign.responses as CsvResponse[],
    )
  }

  const primaryBtn = 'w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-4 rounded-xl transition shadow'

  return (
    <div id="view-showingfeedback" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50 flex flex-col">
      <div className="flex-none h-[72px] flex justify-between items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
        {step === 'home' && !preview ? (
          <OverlayNavButton kind="back" label="Seller Tools" onClick={() => switchView('seller')} />
        ) : closeHow ? (
          <OverlayNavButton kind="close" label="Close" onClick={goBack} />
        ) : (
          <OverlayNavButton kind="back" label="Back" onClick={goBack} />
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
              accentColor="teal"
              theme="light"
              doneTitle="Thanks for the notes."
              doneBody="The listing agent will use this to keep the seller informed. You can close this page."
            />
          </div>
        </div>
      ) : step === 'how' ? (
        <div className="flex-1 min-h-0 p-6 pb-safe bg-slate-900">
          <HowToTour
            pages={SHOWING_FEEDBACK_TOUR}
            page={howPage}
            onPageChange={setHowPage}
            onDone={() => {
              setPreviewFromHow(true)
              setPreview(DEMO_PREVIEW)
            }}
            doneLabel="Preview what showing agents see"
            accent="teal"
            titleClass="font-seller"
          />
        </div>
      ) : (
        <>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden hide-scrollbar bg-slate-900">
        <div className="p-6">
          {step === 'home' && (
            <div className="animate-fade-in-up">
              {agentHeader ? (
                <div className="mb-6 -mx-6 bg-white [&>*]:mb-0">
                  {agentHeader}
                </div>
              ) : null}
              <div className="text-center mb-8">
                <span className="text-xs font-bold tracking-widest text-teal-500 uppercase block mb-2 font-seller">Seller Tools</span>
                <h1 className="font-seller text-3xl md:text-4xl text-white">Showing Agent Feedback</h1>
                <p className="text-lg text-slate-300 mt-4 leading-relaxed">Get honest notes from agents who showed your listing.</p>
              </div>

              <div className="space-y-4">
                <ToolTile
                  onClick={startCreate}
                  className="group relative bg-teal-500 hover:bg-teal-400 text-slate-950 p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden"
                >
                  <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">✏️</div>
                  <span className="text-xs font-bold tracking-wider uppercase opacity-70">Start here</span>
                  <h2 className="font-seller text-2xl md:text-3xl mt-1">Make a Questionnaire</h2>
                </ToolTile>
                <ToolTile
                  onClick={() => setStep('list')}
                  className="group relative bg-white hover:bg-teal-50 text-slate-900 p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden border-2 border-transparent hover:border-teal-300"
                >
                  <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition">📋</div>
                  <span className="text-xs font-bold tracking-wider uppercase opacity-70">
                    {campaigns.length === 1 ? '1 saved' : `${campaigns.length} saved`}
                  </span>
                  <h2 className="font-seller text-2xl md:text-3xl mt-1">See the ones I&apos;ve built already</h2>
                </ToolTile>
                <ToolTile
                  onClick={() => {
                    setHowPage(0)
                    setStep('how')
                  }}
                  className="group relative bg-teal-100 hover:bg-white text-slate-900 p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden border-2 border-transparent hover:border-teal-300"
                >
                  <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:-rotate-6">💡</div>
                  <span className="text-xs font-bold tracking-wider uppercase opacity-70">A 30-second tour</span>
                  <h2 className="font-seller text-2xl md:text-3xl mt-1">What does this thing do</h2>
                </ToolTile>
              </div>
            </div>
          )}

          {step === 'list' && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white">Your questionnaires</h2>
                <p className="text-base text-slate-400 mt-2">Tap one to share the link or read what showing agents said.</p>
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
                      <div className="text-xs font-bold px-2 py-1 rounded bg-slate-700 text-teal-300">
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
                <div className="bg-slate-800 p-4 rounded-xl border border-teal-500/50 mb-6">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter property address..."
                    value={newListingAddress}
                    onChange={e => setNewListingAddress(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && confirmAddListing()}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 mb-3"
                  />
                  <div className="flex gap-2">
                    <button onClick={confirmAddListing} className="flex-1 bg-teal-500 text-slate-950 font-bold py-2 rounded-lg">Save</button>
                    <button onClick={() => { setIsAddingListing(false); setNewListingAddress('') }} className="flex-1 bg-slate-700 text-white font-bold py-2 rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingListing(true)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 mb-6"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Add a Listing
                </button>
              )}

              <div className="space-y-3">
                {listings.length === 0 ? (
                  <p className="text-slate-500 text-center italic py-4">No listings yet. Add one above — it also shows up in Seller Tracking.</p>
                ) : (
                  listings.map(listing => {
                    const count = feedbackCountFor(listing.id)
                    return (
                    <div
                      key={listing.id}
                      onClick={() => chooseListing(listing.id)}
                      className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:border-teal-500/50 transition"
                    >
                      <div>
                        <h4 className="font-bold text-white text-lg">{listing.address}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {count === 1 ? '1 agent feedback' : `${count} agent feedbacks`}
                        </p>
                      </div>
                      <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {step === 'template' && (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-black text-white mb-2">Select a Template</h2>
              {selectedListing && (
                <p className="text-sm text-teal-300 font-bold mb-6">{selectedListing.address}</p>
              )}
              <div className="space-y-4">
                <div
                  className="bg-teal-500/10 border-2 border-dashed border-teal-500/50 rounded-xl p-5 hover:bg-teal-500/20 hover:border-teal-500 transition cursor-pointer flex flex-col items-center justify-center text-center mb-6 min-h-[140px]"
                  onClick={() => {
                    setCustomTitle(selectedListing?.address || '')
                    setCustomDesc('')
                    setCustomQuestions([])
                    setStep('custom')
                  }}
                >
                  <div className="w-10 h-10 bg-teal-500 text-slate-950 rounded-full flex items-center justify-center mb-2 shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                  </div>
                  <h3 className="text-lg font-bold text-teal-400">Build from Scratch</h3>
                  <p className="text-sm text-teal-300/70">Create a completely custom questionnaire</p>
                </div>

                <TemplateDivider />

                {SHOWING_FEEDBACK_TEMPLATES.map((tpl, i) => (
                  <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-teal-500 transition cursor-pointer" onClick={() => handleCreate(tpl)}>
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
                      <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">Name optional</span>
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
                    placeholder="e.g. 123 Oak Showing Feedback"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Intro Text (Optional)</label>
                  <textarea
                    value={customDesc}
                    onChange={e => setCustomDesc(e.target.value)}
                    placeholder="This text appears on the first question..."
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-teal-500 resize-none"
                  ></textarea>
                </div>
              </div>
              <div className="mb-8 border-t border-slate-800 pt-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-4">Quiz Questions</label>
                <QuizBuilder questions={customQuestions} onChange={setCustomQuestions} bank="showing" />
              </div>
            </div>
          )}

          {step === 'detail' && activeCampaign && (
            <div className="animate-fade-in-up pb-8">
              <div className="mb-8">
                <h2 className="font-seller text-3xl md:text-5xl text-teal-400 leading-tight">
                  {activeCampaign.listingAddress || 'Questionnaire'}
                </h2>
                <p className="text-xl font-black text-white mt-3 leading-tight">{activeCampaign.title}</p>
              </div>

              <div className="bg-slate-800 rounded-xl p-5 mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing agent link</p>
                <p className="text-sm text-slate-400 mt-1 mb-4 leading-relaxed">
                  Preview the quiz, then text the link after a showing.
                </p>
                <SharePreviewButtons
                  url={quizUrl}
                  copyLabel="Copy Showing Link"
                  accentClass="bg-teal-500 hover:bg-teal-400 text-slate-950"
                  onCopy={handleShare}
                  onNeedAuth={!userId ? () => showCustomModal('', true) : undefined}
                  beforeShare={persistWorkspace}
                />
              </div>

              <div className="bg-slate-800 rounded-xl p-5 mb-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-teal-500 text-slate-950 rounded-full flex items-center justify-center mb-3 shadow-lg text-2xl font-black">
                  {activeCampaign.responses?.length || 0}
                </div>
                <h3 className="text-white font-bold mb-4">Showing Responses</h3>
                <button
                  type="button"
                  onClick={() => setStep('responses')}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-4 rounded-xl transition shadow"
                >
                  See Responses
                </button>
              </div>
            </div>
          )}

          {step === 'responses' && activeCampaign && (
            <div className="animate-fade-in-up pb-8">
              <div className="mb-8">
                <h2 className="font-seller text-3xl md:text-5xl text-teal-400 leading-tight">
                  {activeCampaign.listingAddress || 'Questionnaire'}
                </h2>
                <p className="text-xl font-black text-white mt-3 leading-tight">What showing agents said</p>
              </div>

              <div className="w-16 h-16 bg-teal-500 text-slate-950 rounded-full flex items-center justify-center mb-6 shadow-lg text-2xl font-black mx-auto">
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
                            <p className="text-sm text-teal-300 bg-slate-900 p-2 rounded">{String((resp as { answers?: Record<string, string> }).answers?.[q.id] || 'No answer')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <p className="text-lg font-black text-white">Nobody has answered yet</p>
                  <p className="text-slate-400 text-sm mt-2">Text the quiz link after a showing, then check back here.</p>
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
                ? 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Save Questionnaire
          </button>
        </div>
      )}

      {step === 'responses' && (
        <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 z-10 pb-safe">
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={!activeCampaign?.responses?.length}
            className={`w-full font-black py-4 rounded-xl transition shadow mb-3 ${
              activeCampaign?.responses?.length
                ? 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Download CSV
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void persistThen(() => {
                if (reportUrl) window.open(reportUrl, '_blank', 'noopener,noreferrer')
              })}
              className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-black py-4 rounded-xl transition shadow text-base"
            >
              Seller PDF
            </button>
            <button
              type="button"
              onClick={() => void persistThen(handleCopyClientLink)}
              className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-4 rounded-xl transition shadow text-base"
            >
              Copy Seller Link
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

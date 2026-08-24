'use client'

import { useState } from 'react'
import QRCode from 'qrcode'
import { Question } from '@/app/components/Questionnaire'
import { QuizBuilder } from '@/app/components/QuizBuilder'
import { OPENHOUSE_FEEDBACK_KIND } from '@/app/lib/openhouseFeedback'

export interface FeedbackCampaign {
  id: string
  kind: typeof OPENHOUSE_FEEDBACK_KIND
  title: string
  description: string
  questions: Question[]
  responses?: any[]
  createdAt: string
}

interface OpenHouseFeedbackViewProps {
  campaigns: FeedbackCampaign[]
  updateCampaigns: (updater: (prev: FeedbackCampaign[]) => FeedbackCampaign[]) => void
  switchView: (view: string) => void
  showCustomModal: (msg: string) => void
  userId: string | undefined
}

const templates = [
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

export function OpenHouseFeedbackView({ campaigns, updateCampaigns, switchView, showCustomModal, userId }: OpenHouseFeedbackViewProps) {
  const [step, setStep] = useState(1)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customQuestions, setCustomQuestions] = useState<Question[]>([])
  const [qrDataUrl, setQrDataUrl] = useState('')

  const activeCampaign = campaigns.find(c => c.id === activeId)
  const quizUrl = userId && activeId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/feedback/${userId}/${activeId}` : ''
  const printUrl = quizUrl ? `${quizUrl}/print` : ''

  const newCampaignId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10)

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
    setStep(3)
    void loadQr(id)
  }

  const handleCreate = (template: (typeof templates)[number]) => {
    const newId = newCampaignId()
    updateCampaigns(prev => [
      {
        id: newId,
        kind: OPENHOUSE_FEEDBACK_KIND,
        title: template.title,
        description: template.description,
        questions: template.questions,
        responses: [],
        createdAt: new Date().toISOString()
      },
      ...(prev || [])
    ])
    openCampaign(newId)
  }

  const handleCreateCustom = () => {
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
        responses: [],
        createdAt: new Date().toISOString()
      },
      ...(prev || [])
    ])
    openCampaign(newId)
  }

  const handleShare = () => {
    if (!userId) {
      showCustomModal('You must be fully logged in to share.')
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

  return (
    <div id="view-ohfeedback" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50 flex flex-col">
      <div className="flex-none h-[72px] flex justify-between items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
        {step > 1 ? (
          <button onClick={() => setStep(step === 4 ? 2 : 1)} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">Back</span>
          </button>
        ) : (
          <button onClick={() => switchView('openhouse')} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">Open House</span>
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar bg-slate-900">
        <div className="p-6">
          {step === 1 && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase block mb-2">Open House Tools</span>
                <h1 className="text-3xl font-black text-white">Anonymous Feedback</h1>
                <p className="text-sm text-slate-400 mt-2">Print a QR sign. Visitors share honest thoughts without leaving a name.</p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 mb-6"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Create a Questionnaire
              </button>

              <div className="space-y-3">
                {campaigns.length === 0 ? (
                  <p className="text-slate-500 text-center italic py-4">No questionnaires yet.</p>
                ) : (
                  campaigns.map(c => (
                    <div
                      key={c.id}
                      onClick={() => openCampaign(c.id)}
                      className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/50 cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <h3 className="text-white font-bold">{c.title}</h3>
                        <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</p>
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

          {step === 2 && (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-black text-white mb-6">Select a Template</h2>
              <div className="space-y-4">
                <div
                  className="bg-indigo-500/10 border-2 border-dashed border-indigo-500/50 rounded-xl p-5 hover:bg-indigo-500/20 hover:border-indigo-500 transition cursor-pointer flex flex-col items-center justify-center text-center mb-6 min-h-[140px]"
                  onClick={() => {
                    setCustomTitle('')
                    setCustomDesc('')
                    setCustomQuestions([])
                    setStep(4)
                  }}
                >
                  <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center mb-2 shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                  </div>
                  <h3 className="text-lg font-bold text-indigo-400">Build from Scratch</h3>
                  <p className="text-sm text-indigo-300/70">Create a completely custom questionnaire</p>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase tracking-widest">Or choose template</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                {templates.map((tpl, i) => (
                  <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition cursor-pointer" onClick={() => handleCreate(tpl)}>
                    <h3 className="text-lg font-bold text-white mb-2">{tpl.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{tpl.description}</p>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">{tpl.questions.length} Questions</span>
                      <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">Anonymous</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
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
                <QuizBuilder questions={customQuestions} onChange={setCustomQuestions} />
              </div>
            </div>
          )}

          {step === 3 && activeCampaign && (
            <div className="animate-fade-in-up">
              <div className="mb-8">
                <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase block mb-1">Questionnaire</span>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{activeCampaign.title}</h2>
                <p className="text-slate-400 mt-2">{activeCampaign.description}</p>
              </div>

              <div className="bg-slate-800 rounded-xl p-5 mb-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-500 text-white rounded-full flex items-center justify-center mb-3 shadow-lg text-2xl font-black">
                  {activeCampaign.responses?.length || 0}
                </div>
                <h3 className="text-white font-bold mb-4">Anonymous Responses</h3>
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="Feedback QR code" className="w-24 h-24 bg-white rounded-lg mb-4" />
                )}
                <div className="w-full flex flex-col gap-2">
                  <button
                    onClick={handleShare}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-3 rounded-lg transition text-sm flex items-center justify-center gap-2"
                  >
                    Copy Quiz Link
                  </button>
                  <a
                    href={printUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-3 rounded-lg transition text-sm flex items-center justify-center gap-2 ${!printUrl ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Print QR Sign
                  </a>
                </div>
              </div>

              {activeCampaign.responses && activeCampaign.responses.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-white font-bold mb-4 border-b border-slate-800 pb-2">Recent Responses</h3>
                  {activeCampaign.responses.slice().reverse().map((resp: any, i: number) => (
                    <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-3">{new Date(resp.date).toLocaleDateString()} at {new Date(resp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <div className="space-y-3">
                        {activeCampaign.questions.map((q: any) => (
                          <div key={q.id}>
                            <p className="text-xs font-bold text-slate-300 mb-1">{q.text}</p>
                            <p className="text-sm text-indigo-300 bg-slate-900 p-2 rounded">{resp.answers[q.id] || 'Skipped'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <p className="text-slate-400 text-sm">No responses yet. Print the QR sign or share the link.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {step === 4 && (
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
    </div>
  )
}

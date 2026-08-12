'use client'

import { useState } from 'react'

export interface OutreachCampaign {
  id: string
  title: string
  description: string
  questions: any[]
  responses?: any[]
  createdAt: string
}

interface OutreachViewProps {
  campaigns: OutreachCampaign[]
  updateCampaigns: (updater: (prev: OutreachCampaign[]) => OutreachCampaign[]) => void
  switchView: (view: string) => void
  showCustomModal: (msg: string) => void
  userId: string | undefined
}

export function OutreachView({ campaigns, updateCampaigns, switchView, showCustomModal, userId }: OutreachViewProps) {
  const [step, setStep] = useState(1) // 1: list, 2: template select, 3: view campaign details
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeCampaign = campaigns.find(c => c.id === activeId)

  const templates = [
    {
      title: "Marketing & Brand Feedback",
      description: "Hi! I'm working on updating my brand and marketing this year and value your taste. Could you take 25 seconds to give me your honest opinion? It means a lot.",
      questions: [
        { id: 'q1', type: 'choice', text: 'Which of these taglines feels most authentic to me?', options: ['"Your trusted local guide"', '"Real estate made ridiculously easy"', '"Results, not promises"'] },
        { id: 'q2', type: 'rating', maxRating: 5, text: 'On a scale of 1-5, how would you rate my current social media presence?' },
        { id: 'q3', type: 'text', text: 'If you had to describe my professional style in one word, what would it be?' }
      ]
    },
    {
      title: "Past Client Service Review",
      description: "Hi! I'm constantly trying to improve the experience for my clients. Since we worked together, I'd love your totally honest feedback. Takes 30 seconds max.",
      questions: [
        { id: 'q1', type: 'rating', maxRating: 10, text: 'How likely are you to recommend me to a friend or colleague? (1 = Never, 10 = Absolutely)' },
        { id: 'q2', type: 'choice', text: 'What was the BEST part about working with me?', options: ['Communication & Responsiveness', 'Market Knowledge', 'Negotiation Skills', 'Making it stress-free'] },
        { id: 'q3', type: 'text', text: 'If I could improve one single thing about my service, what should it be?' }
      ]
    },
    {
      title: "Local Market Prediction",
      description: "Hey! I'm putting together a local market report and want to include what my smartest clients think is going to happen next year.",
      questions: [
        { id: 'q1', type: 'choice', text: 'Where do you think home prices will be this time next year?', options: ['Higher than today', 'About the same', 'Lower than today'] },
        { id: 'q2', type: 'rating', maxRating: 5, text: 'On a scale of 1-5, how would you rate the current local economy?' },
        { id: 'q3', type: 'text', text: 'What is the biggest factor keeping people from buying/selling right now in your opinion?' }
      ]
    }
  ]

  const handleCreate = (template: any) => {
    const newId = Math.random().toString(36).substring(2, 9)
    updateCampaigns(prev => [
      {
        id: newId,
        title: template.title,
        description: template.description,
        questions: template.questions,
        responses: [],
        createdAt: new Date().toISOString()
      },
      ...(prev || [])
    ])
    
    setActiveId(newId)
    setStep(3)
  }

  const handleShare = () => {
    if (!userId || !activeId) {
      showCustomModal("You must be fully logged in to share.")
      return
    }
    const url = `${window.location.origin}/advice/${userId}/${activeId}`
    navigator.clipboard.writeText(url).then(() => {
      showCustomModal(`Link copied! Text this to your close friends/clients:\n\nHey! Quick favor - ${activeCampaign?.description}\n\n${url}`)
    })
  }

  return (
    <div id="view-outreach" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50 flex flex-col">
      
      {/* HEADER */}
      <div className="flex-none h-[72px] flex justify-between items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
        {step > 1 ? (
          <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">Back</span>
          </button>
        ) : (
          <button onClick={() => switchView('home')} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">Close</span>
          </button>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 relative overflow-y-auto bg-slate-900 pb-24">
        <div className="p-6">

          {/* STEP 1: Dashboard / List */}
          {step === 1 && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <span className="text-xs font-bold tracking-widest text-sky-400 uppercase block mb-2">Client Outreach</span>
                <h1 className="text-3xl font-black text-white">Ask for Advice</h1>
                <p className="text-sm text-slate-400 mt-2">People love giving advice. Send a 25-second quiz to engage your network without being salesy.</p>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 mb-6"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Create a New Quiz
              </button>

              <div className="space-y-3">
                {campaigns.length === 0 ? (
                  <p className="text-slate-500 text-center italic py-4">No quizzes created yet.</p>
                ) : (
                  campaigns.map(c => (
                    <div 
                      key={c.id}
                      onClick={() => {
                        setActiveId(c.id)
                        setStep(3)
                      }}
                      className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/50 cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <h3 className="text-white font-bold">{c.title}</h3>
                        <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-xs font-bold px-2 py-1 rounded bg-slate-700 text-sky-300">
                        {c.responses?.length || 0} Responses
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Templates */}
          {step === 2 && (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-black text-white mb-6">Select a Template</h2>
              
              <div className="space-y-4">
                {templates.map((tpl, i) => (
                  <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-sky-500 transition cursor-pointer" onClick={() => handleCreate(tpl)}>
                    <h3 className="text-lg font-bold text-white mb-2">{tpl.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{tpl.description}</p>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">{tpl.questions.length} Questions</span>
                      <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">Takes ~25 sec</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Detail / Responses */}
          {step === 3 && activeCampaign && (
            <div className="animate-fade-in-up">
              <div className="mb-8">
                <span className="text-xs font-bold tracking-widest text-sky-400 uppercase block mb-1">Campaign</span>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{activeCampaign.title}</h2>
                <p className="text-slate-400 mt-2">{activeCampaign.description}</p>
              </div>

              <div className="bg-slate-800 rounded-xl p-5 mb-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-sky-500 text-white rounded-full flex items-center justify-center mb-3 shadow-lg text-2xl font-black">
                  {activeCampaign.responses?.length || 0}
                </div>
                <h3 className="text-white font-bold mb-4">Total Responses</h3>
                <button 
                  onClick={handleShare}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-slate-900 font-black py-3 rounded-lg transition text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                  Copy Share Link
                </button>
              </div>

              {activeCampaign.responses && activeCampaign.responses.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-white font-bold mb-4 border-b border-slate-800 pb-2">Recent Responses</h3>
                  {activeCampaign.responses.slice().reverse().map((resp: any, i: number) => (
                    <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-3">{new Date(resp.date).toLocaleDateString()} at {new Date(resp.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      <div className="space-y-3">
                        {activeCampaign.questions.map((q: any) => (
                          <div key={q.id}>
                            <p className="text-xs font-bold text-slate-300 mb-1">{q.text}</p>
                            <p className="text-sm text-sky-300 bg-slate-900 p-2 rounded">{resp.answers[q.id] || 'Skipped'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <p className="text-slate-400 text-sm">No responses yet. Share your link to get started!</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'

interface Neighborhood {
  id: string;
  name: string;
  cityState: string;
  prompt: string;
  csvData: string;
  questions: any[];
}

interface NeighborhoodExpertViewProps {
  neighborhoods: Neighborhood[];
  updateNeighborhoods: (updater: (prev: any[]) => any[]) => void;
  switchView: (viewId: string) => void;
  showCustomModal: (msg: string) => void;
  userEmail: string | undefined;
}

export function NeighborhoodExpertView({
  neighborhoods,
  updateNeighborhoods,
  switchView,
  showCustomModal,
  userEmail
}: NeighborhoodExpertViewProps) {
  const [step, setStep] = useState(1) // 1: List, 2: Add New, 3: Detail/Upload, 4: Quiz
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newCity, setNewCity] = useState('')
  
  // Detail / Upload State
  const [csvInput, setCsvInput] = useState('')

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [quizStatus, setQuizStatus] = useState<'answering' | 'correct' | 'incorrect'>('answering')

  const activeNeighborhood = neighborhoods.find(n => n.id === activeId)

  // -- Prompt Generation --
  const generatePrompt = (name: string, city: string) => {
    return `Act as an expert real estate data analyst. I need precise data about the neighborhood: "${name}" in "${city}". 
Please provide:
- Median Sale Price
- Average price per square foot for NEW construction homes
- Average price per square foot for RESALE homes
- Average lot price
- Average Days on Market
- Average Monthly HOA Fees
- Estimated Property Tax Rate
- Average Year Built
- Most Common Architectural Style
- Top Rated Schools (Elementary, Middle, High)
- Top 3 amenities/features

Output this EXACTLY in CSV format with the headers: Category, Metric, Value. 
Do not include any markdown formatting, no explanations, just the raw CSV text.`
  }

  // -- Step 1: Add New Neighborhood --
  const handleAddNew = () => {
    if (!newName.trim() || !newCity.trim()) {
      showCustomModal("Please enter both the neighborhood name and city/state.")
      return
    }

    const promptText = generatePrompt(newName, newCity)
    const newId = Math.random().toString(36).substr(2, 9)

    updateNeighborhoods(prev => [
      {
        id: newId,
        name: newName,
        cityState: newCity,
        prompt: promptText,
        csvData: '',
        questions: []
      },
      ...prev
    ])

    setNewName('')
    setNewCity('')
    setActiveId(newId)
    setCsvInput('')
    setStep(3)
  }

  // -- Step 3: Handle CSV Data Parsing --
  const parseCSVToQuestions = (csv: string) => {
    const lines = csv.split('\n').map(l => l.trim()).filter(l => l)
    if (lines.length < 2) return []

    const questions: any[] = []
    
    // We assume structure is Category, Metric, Value
    // Skip header line[0]
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim())
      if (parts.length >= 3) {
        // e.g., Pricing, Price/SqFt (New), $250
        // e.g., parts[0], parts[1], parts[2]
        const metric = parts[1].replace(/['"]/g, '')
        const correctAnswer = parts.slice(2).join(',').replace(/['"]/g, '') // Join in case value had commas
        
        // Generate some fake dummy answers for the multiple choice
        let fake1, fake2, fake3
        
        // Very basic fake generator logic based on numbers
        const numMatch = correctAnswer.match(/[\d.]+/)
        if (numMatch) {
          const num = parseFloat(numMatch[0])
          const prefix = correctAnswer.split(numMatch[0])[0]
          const suffix = correctAnswer.split(numMatch[0])[1]
          
          fake1 = `${prefix}${Math.round(num * 0.85)}${suffix}`
          fake2 = `${prefix}${Math.round(num * 1.15)}${suffix}`
          fake3 = `${prefix}${Math.round(num * 1.4)}${suffix}`
        } else {
          // If it's text (like amenities, schools, styles)
          if (metric.toLowerCase().includes('style')) {
            fake1 = "Modern Farmhouse, Ranch"
            fake2 = "Craftsman, Tudor"
            fake3 = "Mediterranean, Contemporary"
          } else if (metric.toLowerCase().includes('school')) {
            fake1 = "Lincoln Elem, Washington Mid, Kennedy High"
            fake2 = "Oak Creek Elem, Pine Mid, Cedar High"
            fake3 = "Not assigned to top-rated schools"
          } else {
            fake1 = "Pool, Clubhouse, Tennis"
            fake2 = "Walking Trails, Gated Entry, Golf"
            fake3 = "No notable amenities listed"
          }
        }

        // Shuffle options
        const options = [correctAnswer, fake1, fake2, fake3].sort(() => 0.5 - Math.random())

        questions.push({
          question: `What is the ${metric}?`,
          correctAnswer,
          options
        })
      }
    }
    return questions
  }

  const handleSaveCSV = () => {
    if (!csvInput.trim()) {
      showCustomModal("Please paste the CSV data first.")
      return
    }

    const generatedQuestions = parseCSVToQuestions(csvInput)
    if (generatedQuestions.length === 0) {
      showCustomModal("Could not parse the CSV. Make sure it has Category, Metric, Value format.")
      return
    }

    updateNeighborhoods(prev => prev.map(n => {
      if (n.id === activeId) {
        return { ...n, csvData: csvInput, questions: generatedQuestions }
      }
      return n
    }))

    showCustomModal("Data loaded successfully! You can now start the quiz.")
  }

  // -- Step 4: Quiz Logic --
  const handleAnswerSelect = (option: string) => {
    if (quizStatus !== 'answering') return
    setSelectedAnswer(option)
  }

  const checkAnswer = () => {
    if (!activeNeighborhood || !selectedAnswer) return

    const currentQ = activeNeighborhood.questions[quizIndex]
    if (selectedAnswer === currentQ.correctAnswer) {
      setQuizStatus('correct')
      setQuizScore(prev => prev + 1)
    } else {
      setQuizStatus('incorrect')
    }
  }

  const nextQuestion = () => {
    if (!activeNeighborhood) return

    if (quizIndex + 1 < activeNeighborhood.questions.length) {
      setQuizIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setQuizStatus('answering')
    } else {
      // Quiz over
      showCustomModal(`Quiz complete! You scored ${quizScore} out of ${activeNeighborhood.questions.length}.`)
      setStep(3)
      setQuizIndex(0)
      setQuizScore(0)
      setSelectedAnswer(null)
      setQuizStatus('answering')
    }
  }

  return (
    <div id="view-neighborhoods" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50 flex flex-col">
      
      {/* HEADER */}
      <div className="flex-none h-[72px] flex items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
        {step > 1 ? (
          <button onClick={() => {
            if (step === 4) {
              setStep(3) // Quit quiz to detail
              setQuizIndex(0)
              setQuizScore(0)
              setSelectedAnswer(null)
              setQuizStatus('answering')
            } else if (step === 3 || step === 2) {
              setStep(1)
            }
          }} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">Back</span>
          </button>
        ) : (
          <button onClick={() => switchView('home')} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">Close</span>
          </button>
        )}
        
        <div className="flex-1 mx-4 bg-slate-800 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${step === 4 ? 'bg-fuchsia-500' : 'bg-slate-700'}`}
            style={{ 
              width: step === 4 && activeNeighborhood?.questions && activeNeighborhood.questions.length > 0 
                ? `${(quizIndex / activeNeighborhood.questions.length) * 100}%` 
                : `${(step / 4) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-900">
        <div className="p-6">

          {/* STEP 1: Dashboard / List */}
          {step === 1 && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <span className="text-xs font-bold tracking-widest text-fuchsia-400 uppercase block mb-2">Learn My Market</span>
                <h1 className="text-3xl font-black text-white">Neighborhood Expert</h1>
                <p className="text-sm text-slate-400 mt-2">Use AI to pull market data and take memory quizzes.</p>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-fuchsia-400 border border-slate-700 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 mb-6"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Add a New Neighborhood
              </button>

              <div className="space-y-3">
                {neighborhoods.length === 0 ? (
                  <p className="text-slate-500 text-center italic py-4">No neighborhoods added yet.</p>
                ) : (
                  neighborhoods.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        setActiveId(n.id)
                        setCsvInput(n.csvData || '')
                        setStep(3)
                      }}
                      className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/50 cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <h3 className="text-white font-bold">{n.name}</h3>
                        <p className="text-xs text-slate-400">{n.cityState}</p>
                      </div>
                      <div className="text-xs font-bold px-2 py-1 rounded bg-slate-700 text-slate-300">
                        {n.questions?.length > 0 ? `${n.questions.length} Qs` : 'Needs Data'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Add New */}
          {step === 2 && (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-black text-white mb-6">Add Neighborhood</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Neighborhood Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Whispering Pines" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">City & State</label>
                  <input 
                    type="text" 
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    placeholder="e.g. Austin, TX" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Detail / Upload */}
          {step === 3 && activeNeighborhood && (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-black text-white mb-1">{activeNeighborhood.name}</h2>
              <p className="text-slate-400 mb-6">{activeNeighborhood.cityState}</p>

              <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl p-4 mb-6">
                <h3 className="text-fuchsia-400 font-bold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                  Step 1: Get AI Data
                </h3>
                <p className="text-sm text-slate-300 mb-4">Copy this prompt, run it in ChatGPT, Claude, or Gemini, and copy the CSV output.</p>
                <div className="bg-slate-900 rounded p-3 text-xs font-mono text-slate-400 mb-3 h-24 overflow-y-auto">
                  {activeNeighborhood.prompt}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(activeNeighborhood.prompt).catch(() => {})
                    showCustomModal("Prompt copied to clipboard!")
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded transition text-sm"
                >
                  Copy Prompt
                </button>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 mb-6">
                <h3 className="text-white font-bold mb-2">Step 2: Paste CSV Output</h3>
                <textarea 
                  value={csvInput}
                  onChange={e => setCsvInput(e.target.value)}
                  placeholder="Paste the CSV data from the AI here..."
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-fuchsia-500 mb-3"
                ></textarea>
                <button 
                  onClick={handleSaveCSV}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded transition text-sm"
                >
                  Parse & Save Data
                </button>
              </div>

              {activeNeighborhood.questions && activeNeighborhood.questions.length > 0 && (
                <button 
                  onClick={() => {
                    setQuizIndex(0)
                    setQuizScore(0)
                    setSelectedAnswer(null)
                    setQuizStatus('answering')
                    setStep(4)
                  }}
                  className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black py-4 rounded-xl transition shadow-lg text-lg uppercase tracking-wide"
                >
                  Take the Quiz!
                </button>
              )}
            </div>
          )}

          {/* STEP 4: Duolingo Quiz */}
          {step === 4 && activeNeighborhood && activeNeighborhood.questions.length > 0 && (
            <div className="animate-fade-in-up h-full flex flex-col justify-between">
              
              <div className="mb-8">
                <h2 className="text-xl text-slate-400 font-bold mb-2">Question {quizIndex + 1} of {activeNeighborhood.questions.length}</h2>
                <h1 className="text-3xl font-black text-white leading-tight">
                  {activeNeighborhood.questions[quizIndex].question}
                </h1>
              </div>

              <div className="space-y-3">
                {activeNeighborhood.questions[quizIndex].options.map((opt: string, i: number) => {
                  let btnClass = "bg-slate-800 border-slate-700 text-white"
                  
                  if (quizStatus === 'answering') {
                    if (selectedAnswer === opt) {
                      btnClass = "bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-100 ring-2 ring-fuchsia-500"
                    }
                  } else {
                    // Show correct/incorrect states
                    if (opt === activeNeighborhood.questions[quizIndex].correctAnswer) {
                      btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500" // The right answer
                    } else if (selectedAnswer === opt) {
                      btnClass = "bg-rose-500/20 border-rose-500 text-rose-400 ring-2 ring-rose-500" // Wrong choice
                    }
                  }

                  return (
                    <button 
                      key={i}
                      onClick={() => handleAnswerSelect(opt)}
                      disabled={quizStatus !== 'answering'}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all font-bold text-lg ${btnClass}`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* FOOTER BUTTONS (Pinned) */}
      {(step === 2 || step === 4) && (
        <div className="flex-none border-t border-slate-800 bg-slate-900 p-4 pb-safe w-full z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
        
        {step === 2 && (
          <button 
            onClick={handleAddNew}
            className={`w-full font-black py-4 rounded-xl shadow-lg transition text-lg uppercase tracking-wide ${
              newName.trim() && newCity.trim()
                ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Generate Prompt
          </button>
        )}

        {step === 4 && (
          <button 
            onClick={() => {
              if (quizStatus === 'answering') {
                checkAnswer()
              } else {
                nextQuestion()
              }
            }}
            disabled={!selectedAnswer && quizStatus === 'answering'}
            className={`w-full font-black py-4 rounded-xl shadow-lg transition text-lg uppercase tracking-wide ${
              !selectedAnswer && quizStatus === 'answering'
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : quizStatus === 'correct'
                ? 'bg-emerald-500 text-slate-900'
                : quizStatus === 'incorrect'
                ? 'bg-rose-500 text-white'
                : 'bg-fuchsia-600 text-white'
            }`}
          >
            {quizStatus === 'answering' ? 'Check Answer' : 'Continue'}
          </button>
        )}
      </div>
      )}

    </div>
  )
}

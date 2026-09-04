'use client'

import { useState } from 'react'
import { ConfirmDeleteDialog } from '@/app/components/ConfirmDeleteDialog'
import { Question, QuestionType } from './Questionnaire'

const ADVICE_QUESTION_BANK: Omit<Question, 'id'>[] = [
  { type: 'rating', maxRating: 10, text: 'How likely are you to recommend me to a friend or family member? (1=Never, 10=Absolutely)' },
  { type: 'choice', text: 'What is your preferred method of communication?', options: ['Text Message', 'Email', 'Phone Call', 'In-Person'] },
  { type: 'text', text: 'If I could improve one single thing about my service, what should it be?' },
  { type: 'choice', text: 'What was the BEST part about working with me?', options: ['Communication & Responsiveness', 'Market Knowledge', 'Negotiation Skills', 'Making it stress-free'] },
  { type: 'choice', text: 'Are you considering moving or investing in the next 12 months?', options: ['Yes', 'No', 'Maybe'] },
  { type: 'choice', text: 'Where do you think home prices will be this time next year?', options: ['Higher than today', 'About the same', 'Lower than today'] },
  { type: 'rating', maxRating: 5, text: 'On a scale of 1-5, how would you rate the current local economy?' },
  { type: 'text', text: 'If you had to describe my professional style in one word, what would it be?' },
  { type: 'rating', maxRating: 5, text: 'On a scale of 1-5, how would you rate my current social media presence?' },
]

const OPENHOUSE_QUESTION_BANK: Omit<Question, 'id'>[] = [
  { type: 'rating', maxRating: 5, text: 'Overall, how would you rate this home?' },
  { type: 'choice', text: 'How does the asking price feel?', options: ['Priced too high', 'About right', 'A good value'] },
  { type: 'choice', text: 'Would you consider making an offer on this home?', options: ['Yes, I could see writing an offer', 'Maybe, if something changed', 'No, this is not the right home'] },
  { type: 'choice', text: 'How does this home compare to others you have toured?', options: ["One of the best I've seen", 'About the same as others', "It doesn't quite compare"] },
  { type: 'choice', text: 'Which part of the home felt strongest?', options: ['Kitchen', 'Primary suite', 'Living spaces', 'Outdoor / backyard', 'Location / neighborhood'] },
  { type: 'choice', text: 'What felt like the biggest drawback?', options: ['Price', 'Layout / flow', 'Condition or updates needed', 'Size of the rooms', 'Location'] },
  { type: 'rating', maxRating: 5, text: 'How would you rate the first impression from the curb?' },
  { type: 'rating', maxRating: 5, text: 'How would you rate the staging and presentation inside?' },
  { type: 'text', optional: true, text: 'What did you like most about the home?', placeholder: 'e.g., The light, the backyard, the kitchen...' },
  { type: 'text', optional: true, text: 'What would need to change for you to write an offer?', placeholder: 'e.g., Price, repairs, a credit for the roof...' },
  { type: 'text', optional: true, text: 'Anything that felt dated, cramped, or off?', placeholder: 'e.g., Paint, flooring, the hallway bath...' },
  { type: 'choice', text: 'Are you currently working with a real estate agent?', options: ['Yes, I am', "No, I'm searching on my own"] },
]

export function QuizBuilder({
  questions,
  onChange,
  bank = 'advice',
}: {
  questions: Question[]
  onChange: (q: Question[]) => void
  bank?: 'advice' | 'openhouse'
}) {
  const [bankOpen, setBankOpen] = useState(false)
  const [pendingDeleteQuestionId, setPendingDeleteQuestionId] = useState<string | null>(null)
  const [pendingDeleteOption, setPendingDeleteOption] = useState<{ qId: string; optIndex: number } | null>(null)
  const questionBank = bank === 'openhouse' ? OPENHOUSE_QUESTION_BANK : ADVICE_QUESTION_BANK

  const addBankQuestion = (q: Omit<Question, 'id'>) => {
    onChange([...questions, { ...q, id: Math.random().toString(36).substr(2, 9) }])
    setBankOpen(false)
  }

  const addEmptyQuestion = (type: QuestionType) => {
    onChange([...questions, { 
      id: Math.random().toString(36).substr(2, 9), 
      type, 
      text: '', 
      options: type === 'choice' ? ['', ''] : undefined,
      maxRating: type === 'rating' ? 5 : undefined
    }])
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  const removeQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id))
  }

  const updateOption = (qId: string, optIndex: number, val: string) => {
    onChange(questions.map(q => {
      if (q.id === qId && q.options) {
        const newOpts = [...q.options]
        newOpts[optIndex] = val
        return { ...q, options: newOpts }
      }
      return q
    }))
  }

  const addOption = (qId: string) => {
    onChange(questions.map(q => {
      if (q.id === qId && q.options) {
        return { ...q, options: [...q.options, ''] }
      }
      return q
    }))
  }

  const removeOption = (qId: string, optIndex: number) => {
    onChange(questions.map(q => {
      if (q.id === qId && q.options) {
        return { ...q, options: q.options.filter((_, i) => i !== optIndex) }
      }
      return q
    }))
  }

  const addButtons = bankOpen ? (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 animate-fade-in-up">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">Select from Question Bank</h3>
        <button onClick={() => setBankOpen(false)} className="text-slate-400 hover:text-white">Cancel</button>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {questionBank.map((bankQ, i) => (
          <button
            key={i}
            onClick={() => addBankQuestion(bankQ)}
            className="w-full text-left bg-slate-900 hover:bg-slate-700 border border-slate-700 p-3 rounded-lg transition"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase text-sky-400">{bankQ.type}</span>
            </div>
            <p className="text-sm font-bold text-slate-200">{bankQ.text}</p>
          </button>
        ))}
      </div>
    </div>
  ) : (
    <div className="space-y-3">
      <button onClick={() => setBankOpen(true)} className="w-full bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-base font-bold py-6 px-4 rounded-xl transition">
        Question Bank
      </button>
      <p className="text-sm font-bold text-slate-400 text-center">Or make your own question</p>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => addEmptyQuestion('choice')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 text-xs font-bold py-3 rounded-xl transition">
          + Choice Q
        </button>
        <button onClick={() => addEmptyQuestion('rating')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 text-xs font-bold py-3 rounded-xl transition">
          + Rating Q
        </button>
        <button onClick={() => addEmptyQuestion('text')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 text-xs font-bold py-3 rounded-xl transition">
          + Text Q
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {addButtons}

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 relative animate-fade-in-up">
            <button 
              onClick={() => setPendingDeleteQuestionId(q.id)}
              className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 transition"
              title="Remove Question"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
            
            <span className="text-[10px] font-bold tracking-wider uppercase text-sky-400 bg-sky-900/30 px-2 py-1 rounded inline-block mb-3">
              {i + 1}. {q.type}
            </span>

            <input 
              type="text" 
              value={q.text}
              onChange={e => updateQuestion(q.id, { text: e.target.value })}
              placeholder="Type your question here..." 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold mb-3 focus:outline-none focus:border-sky-500"
            />

            {q.type === 'choice' && (
              <div className="space-y-2 ml-4 border-l-2 border-slate-700 pl-4">
                {q.options?.map((opt, optIndex) => (
                  <div key={optIndex} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={opt}
                      onChange={e => updateOption(q.id, optIndex, e.target.value)}
                      placeholder={`Option ${optIndex + 1}`} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
                    />
                    <button onClick={() => setPendingDeleteOption({ qId: q.id, optIndex })} className="text-slate-500 hover:text-rose-400" disabled={q.options && q.options.length <= 2}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => addOption(q.id)}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 mt-2 inline-block"
                >
                  + Add Option
                </button>
              </div>
            )}

            {q.type === 'rating' && (
              <div className="flex items-center gap-3 ml-4">
                <label className="text-xs font-bold text-slate-400 uppercase">Max Rating (1-X):</label>
                <select 
                  value={q.maxRating} 
                  onChange={e => updateQuestion(q.id, { maxRating: parseInt(e.target.value) })}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:outline-none"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                </select>
              </div>
            )}
          </div>
        ))}
        
        {questions.length === 0 && (
          <div className="text-center p-8 bg-slate-800/50 rounded-xl border border-slate-700/50 border-dashed">
            <p className="text-slate-400 text-base">No questions added yet. Start building your quiz above.</p>
          </div>
        )}
      </div>

      {pendingDeleteQuestionId && (
        <ConfirmDeleteDialog
          message="Delete this question? This can't be undone."
          onCancel={() => setPendingDeleteQuestionId(null)}
          onConfirm={() => {
            removeQuestion(pendingDeleteQuestionId)
            setPendingDeleteQuestionId(null)
          }}
        />
      )}
      {pendingDeleteOption && (
        <ConfirmDeleteDialog
          message="Remove this option?"
          confirmLabel="Remove"
          onCancel={() => setPendingDeleteOption(null)}
          onConfirm={() => {
            removeOption(pendingDeleteOption.qId, pendingDeleteOption.optIndex)
            setPendingDeleteOption(null)
          }}
        />
      )}

    </div>
  )
}

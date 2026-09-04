import { renderAgentHeader } from '@/app/components/AgentHeader'
import { PrintButtons } from '@/app/components/PrintControls'
import type { Question } from '@/app/components/Questionnaire'

type FeedbackResponse = {
  id?: string
  date?: string
  createdAt?: string
  answers?: Record<string, string | number>
  [key: string]: unknown
}

function getAnswers(resp: FeedbackResponse): Record<string, string | number> {
  if (resp?.answers && typeof resp.answers === 'object' && !Array.isArray(resp.answers)) {
    return resp.answers
  }
  const skip = new Set(['id', 'date', 'createdAt', 'answers'])
  const rest: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(resp || {})) {
    if (skip.has(key)) continue
    if (typeof value === 'string' || typeof value === 'number') rest[key] = value
  }
  return rest
}

function isBlank(value: unknown) {
  return value === undefined || value === null || String(value).trim() === '' || String(value) === 'No answer'
}

function responseDate(resp: FeedbackResponse) {
  const raw = resp.date || resp.createdAt
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatWhen(resp: FeedbackResponse) {
  const d = responseDate(resp)
  if (!d) return 'Time not recorded'
  return `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

function formatAnswer(question: Question, value: unknown) {
  if (isBlank(value)) return 'No answer'
  if (question.type === 'rating') return `${value} out of ${question.maxRating || 5}`
  return String(value)
}

function peopleLabel(count: number) {
  if (count === 1) return '1 person answered'
  return `${count} people answered`
}

export function OpenHouseFeedbackReportView({ profile, campaign }: { profile: any; campaign: any }) {
  const questions: Question[] = Array.isArray(campaign.questions) ? campaign.questions : []
  const responses: FeedbackResponse[] = Array.isArray(campaign.responses)
    ? [...campaign.responses].sort((a, b) => {
        const da = responseDate(a)?.getTime() || 0
        const db = responseDate(b)?.getTime() || 0
        return da - db
      })
    : []
  const address = campaign.listingAddress || campaign.title || 'Open house'
  const count = responses.length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body { background: white !important; }
          #report-print-root table { width: 100%; border-collapse: collapse; }
          #report-print-root thead { display: table-header-group; }
          #report-print-root td { padding: 0; }
          .print-break-inside-avoid {
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            overflow: visible !important;
          }
          #report-print-root, #report-print-root * {
            box-shadow: none !important;
            text-shadow: none !important;
            filter: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div id="report-print-root" className="w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <td className="p-0">
                <div id="report-print-header">
                  {renderAgentHeader(profile)}
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-0">
                <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-6">
                  <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl print-break-inside-avoid">
                    <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                      <div>
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block mb-2">What visitors said</span>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{address}</h1>
                        {campaign.listingAddress && campaign.title ? (
                          <p className="text-base text-slate-500 mt-2">{campaign.title}</p>
                        ) : null}
                      </div>
                      <PrintButtons listingAddress={`${address}-visitor-feedback`} />
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <span className="text-sm font-black bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full">
                        {peopleLabel(count)}
                      </span>
                      <span className="text-sm font-black bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
                        100% anonymous
                      </span>
                    </div>
                    <p className="text-slate-500 mt-4 leading-relaxed">
                      Nobody left a name. These are the honest notes from people who walked through the home.
                    </p>
                  </div>

                  {count === 0 ? (
                    <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-2xl text-center print-break-inside-avoid">
                      <p className="text-xl font-black text-slate-900">No answers yet</p>
                      <p className="text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                        Print the QR sign, leave it out at the open house, and check back after visitors come through.
                      </p>
                    </div>
                  ) : (
                    <>
                      {questions.map((question, qi) => (
                        <QuestionSummary
                          key={question.id}
                          question={question}
                          index={qi + 1}
                          values={responses.map((resp) => getAnswers(resp)[question.id])}
                        />
                      ))}

                      <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl">
                        <h2 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">
                          Every visitor, one by one
                        </h2>
                        <div className="space-y-6">
                          {responses.map((resp, i) => (
                            <div key={resp.id || i} className="print-break-inside-avoid border border-slate-100 rounded-2xl p-5 bg-slate-50">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                <p className="text-base font-black text-slate-900">Visitor {i + 1}</p>
                                <p className="text-sm font-bold text-slate-500">{formatWhen(resp)}</p>
                              </div>
                              <div className="space-y-4">
                                {questions.map((question) => (
                                  <div key={question.id}>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{question.text}</p>
                                    <p className="text-base text-slate-800 leading-relaxed">
                                      {formatAnswer(question, getAnswers(resp)[question.id])}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function QuestionSummary({
  question,
  index,
  values,
}: {
  question: Question
  index: number
  values: Array<string | number | undefined>
}) {
  const answered = values.filter((value): value is string | number => !isBlank(value))

  return (
    <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl print-break-inside-avoid">
      <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Question {index}</p>
      <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">{question.text}</h2>
      {question.type === 'rating' ? (
        <RatingSummary values={answered} max={question.maxRating || 5} />
      ) : question.type === 'choice' ? (
        <ChoiceSummary options={question.options || []} values={answered} />
      ) : (
        <TextSummary values={answered} />
      )}
    </div>
  )
}

function RatingSummary({ values, max }: { values: Array<string | number>; max: number }) {
  const nums = values.map(Number).filter((n) => Number.isFinite(n))
  if (nums.length === 0) {
    return <p className="text-slate-400 italic mt-4">Nobody answered this one.</p>
  }
  const avg = nums.reduce((sum, n) => sum + n, 0) / nums.length
  const rounded = Math.round(avg)
  const display = Number.isInteger(avg) ? String(avg) : avg.toFixed(1)

  return (
    <div className="mt-6 text-center">
      <p className="text-6xl font-black text-indigo-600 leading-none">{display}</p>
      <p className="text-sm font-bold text-slate-500 mt-2">average out of {max}</p>
      <div className="flex justify-center gap-1 mt-3 text-3xl" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={i < rounded ? 'text-indigo-500' : 'text-slate-200'}>★</span>
        ))}
      </div>
      <p className="text-sm text-slate-400 mt-3">{peopleLabel(nums.length)}</p>
    </div>
  )
}

function ChoiceSummary({ options, values }: { options: string[]; values: Array<string | number> }) {
  if (values.length === 0) {
    return <p className="text-slate-400 italic mt-4">Nobody answered this one.</p>
  }
  const labels = [...options]
  for (const value of values) {
    const label = String(value)
    if (!labels.includes(label)) labels.push(label)
  }
  const total = values.length

  return (
    <div className="mt-6 space-y-3">
      {labels.map((option) => {
        const n = values.filter((value) => String(value) === option).length
        const pct = Math.round((n / total) * 100)
        return (
          <div key={option}>
            <div className="flex justify-between gap-3 mb-1">
              <p className="text-base font-bold text-slate-800">{option}</p>
              <p className="text-base font-black text-indigo-600 whitespace-nowrap">{n}</p>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
      <p className="text-sm text-slate-400 pt-1">{peopleLabel(values.length)}</p>
    </div>
  )
}

function TextSummary({ values }: { values: Array<string | number> }) {
  if (values.length === 0) {
    return <p className="text-slate-400 italic mt-4">Nobody wrote extra comments.</p>
  }

  return (
    <div className="mt-6 space-y-3">
      {values.map((value, i) => (
        <blockquote key={i} className="bg-indigo-50 border-l-4 border-indigo-400 rounded-r-xl px-4 py-3 text-lg text-slate-800 leading-relaxed">
          “{String(value)}”
        </blockquote>
      ))}
    </div>
  )
}

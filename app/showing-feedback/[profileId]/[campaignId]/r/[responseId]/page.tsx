import { renderAgentHeader } from '@/app/components/AgentHeader'
import { AgentHeaderFrame, PREVIEW_LINK_HEADER_CTA } from '@/app/components/AgentHeaderCta'
import { billingFromProfile, hasShareAccess } from '@/app/lib/billing'
import { ShareUnavailable } from '@/app/components/ShareUnavailable'
import { adminClient, findPublicCampaign } from '@/app/lib/workspacePublic'
import { withShowingAgentQuestion } from '@/app/lib/showingFeedback'
import type { Question } from '@/app/components/Questionnaire'

export const dynamic = 'force-dynamic'

function getAnswers(resp: any): Record<string, string | number> {
  if (resp?.answers && typeof resp.answers === 'object' && !Array.isArray(resp.answers)) {
    return resp.answers
  }
  return {}
}

function formatValue(question: Question, answers: Record<string, string | number>) {
  if (question.type === 'name_email') {
    const name = String(answers.agent_name || '').trim()
    const email = String(answers.agent_email || answers.email || '').trim()
    const bits = [name, email].filter(Boolean)
    return bits.length ? bits.join(' · ') : '—'
  }
  const value = answers[question.id]
  if (value === undefined || value === null || String(value).trim() === '') return '—'
  if (question.type === 'rating') return `${value} out of ${question.maxRating || 5}`
  return String(value)
}

export default async function ShowingFeedbackOnePage({
  params,
}: {
  params: Promise<{ profileId: string; campaignId: string; responseId: string }>
}) {
  const { profileId, campaignId, responseId } = await params
  const supabase = adminClient()
  const { profile, campaign } = await findPublicCampaign(supabase, profileId, campaignId, 'showing')

  if (!profile || !campaign) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Notes not found</h1>
        <p className="text-slate-500 max-w-md mx-auto">This link may have expired or the questionnaire was removed.</p>
      </div>
    )
  }

  if (!hasShareAccess(billingFromProfile(profile))) {
    return <ShareUnavailable profile={profile} />
  }

  let response = (campaign.responses || []).find((item: { id?: string }) => item.id === responseId) || null
  if (!response) {
    const { data } = await supabase
      .from('campaign_responses')
      .select('*')
      .eq('id', responseId)
      .eq('campaign_id', campaignId)
      .eq('profile_id', profileId)
      .maybeSingle()
    if (data) response = { id: data.id, date: data.created_at, answers: data.answers }
  }

  if (!response) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Notes not found</h1>
        <p className="text-slate-500 max-w-md mx-auto">This link may have expired or the questionnaire was removed.</p>
      </div>
    )
  }

  const questions = withShowingAgentQuestion(campaign.questions)
  const answers = getAnswers(response)
  const address = campaign.listingAddress || campaign.title || 'Listing'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6">
        <AgentHeaderFrame cta={PREVIEW_LINK_HEADER_CTA}>
          {renderAgentHeader(profile)}
        </AgentHeaderFrame>
      </div>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-6">
        <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl">
          <span className="text-xs font-bold uppercase tracking-widest block mb-2 text-seller-deep">Your showing notes</span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{address}</h1>
          <p className="text-base text-slate-500 mt-2">Just what you sent the listing agent.</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl space-y-6">
          {questions.map((question, index) => (
            <div key={question.id}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Question {index + 1}</p>
              <p className="text-base font-black text-slate-900 mb-2">{question.text}</p>
              <p className="text-base text-slate-800 leading-relaxed">{formatValue(question, answers)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

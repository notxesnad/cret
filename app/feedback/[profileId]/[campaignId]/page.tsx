import { renderAgentHeader } from '@/app/components/AgentHeader'
import { FeedbackClient } from './FeedbackClient'
import { normalizeOpenHouseTheme } from '@/app/lib/quizTheme'
import { billingFromProfile, hasShareAccess } from '@/app/lib/billing'
import { ShareUnavailable } from '@/app/components/ShareUnavailable'
import { adminClient, findPublicCampaign } from '@/app/lib/workspacePublic'

export const dynamic = 'force-dynamic'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
}

export default async function OpenHouseFeedbackPage({ params }: { params: Promise<{ profileId: string; campaignId: string }> }) {
  const { profileId, campaignId } = await params
  const { profile, campaign } = await findPublicCampaign(adminClient(), profileId, campaignId, 'feedback')

  if (!profile || !campaign) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-100 mb-2">Questionnaire Not Found</h1>
        <p className="text-slate-400 max-w-md mx-auto mb-4">This feedback form may have been removed or the link is incorrect.</p>
      </div>
    )
  }

  if (!hasShareAccess(billingFromProfile(profile))) {
    return <ShareUnavailable profile={profile} />
  }

  const theme = normalizeOpenHouseTheme(campaign.theme)
  const isDark = theme === 'dark'

  return (
    <div className={`h-[100dvh] flex flex-col font-sans ${isDark ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <div className="flex-none w-full max-w-xl mx-auto [&>*]:mb-0">
        {renderAgentHeader(profile)}
      </div>
      <div className="flex-1 min-h-0 max-w-xl mx-auto w-full">
        <FeedbackClient
          profileId={profileId}
          campaignId={campaignId}
          campaign={campaign}
        />
      </div>
    </div>
  )
}

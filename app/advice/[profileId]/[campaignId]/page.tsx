import { renderAgentHeader } from '@/app/components/AgentHeader'
import { AdviceClient } from './AdviceClient'
import { normalizeQuizTheme } from '@/app/lib/quizTheme'
import { adminClient, findPublicCampaign } from '@/app/lib/workspacePublic'

export const dynamic = 'force-dynamic'

export default async function AdvicePage({ params }: { params: Promise<{ profileId: string; campaignId: string }> }) {
  const { profileId, campaignId } = await params
  const { profile, campaign } = await findPublicCampaign(adminClient(), profileId, campaignId, 'advice')

  if (!profile || !campaign) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-100 mb-2">Campaign Not Found</h1>
        <p className="text-slate-400 max-w-md mx-auto mb-4">This questionnaire may have been removed or the link is incorrect.</p>
      </div>
    )
  }

  const theme = normalizeQuizTheme(campaign.theme)
  const isDark = theme === 'dark'

  return (
    <div className={`h-[100dvh] flex flex-col font-sans ${isDark ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <div className="flex-none w-full max-w-xl mx-auto [&>*]:mb-0">
        {renderAgentHeader(profile)}
      </div>
      <div className="flex-1 min-h-0 max-w-xl mx-auto w-full">
        <AdviceClient
          profileId={profileId}
          campaignId={campaignId}
          campaign={campaign}
        />
      </div>
    </div>
  )
}

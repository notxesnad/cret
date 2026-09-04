import { billingFromProfile, hasShareAccess } from '@/app/lib/billing'
import { ShareUnavailable } from '@/app/components/ShareUnavailable'
import { OpenHouseFeedbackReportView } from '@/app/components/OpenHouseFeedbackReportView'
import { adminClient, findPublicCampaign } from '@/app/lib/workspacePublic'

export const dynamic = 'force-dynamic'

export default async function OpenHouseFeedbackReportPage({ params }: { params: Promise<{ profileId: string; campaignId: string }> }) {
  const { profileId, campaignId } = await params
  const { profile, campaign } = await findPublicCampaign(adminClient(), profileId, campaignId, 'feedback')

  if (!profile || !campaign) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Report Not Found</h1>
        <p className="text-slate-500 max-w-md mx-auto">This questionnaire may have been removed or the link is incorrect.</p>
      </div>
    )
  }

  if (!hasShareAccess(billingFromProfile(profile))) {
    return <ShareUnavailable profile={profile} />
  }

  return <OpenHouseFeedbackReportView profile={profile} campaign={campaign} />
}

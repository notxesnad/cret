import { headers } from 'next/headers'
import QRCode from 'qrcode'
import { OpenHouseFeedbackSigns } from '@/app/components/OpenHouseFeedbackSigns'
import { billingFromProfile, hasShareAccess } from '@/app/lib/billing'
import { ShareUnavailable } from '@/app/components/ShareUnavailable'
import { adminClient, findPublicCampaign } from '@/app/lib/workspacePublic'

export const dynamic = 'force-dynamic'

async function getShareUrl(path: string) {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host')
  const proto = headerList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
  if (host) return `${proto}://${host}${path}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${path}`
  return path
}

export default async function OpenHouseFeedbackPrintPage({ params }: { params: Promise<{ profileId: string; campaignId: string }> }) {
  const { profileId, campaignId } = await params
  const { profile, campaign } = await findPublicCampaign(adminClient(), profileId, campaignId, 'feedback')

  if (!profile || !campaign) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Sign Not Found</h1>
        <p className="text-slate-500 max-w-md mx-auto">This questionnaire may have been removed or the link is incorrect.</p>
      </div>
    )
  }

  if (!hasShareAccess(billingFromProfile(profile))) {
    return <ShareUnavailable profile={profile} />
  }

  const quizUrl = await getShareUrl(`/feedback/${profileId}/${campaignId}`)
  const qrDataUrl = await QRCode.toDataURL(quizUrl, {
    width: 520,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#1a1612', light: '#ffffff' },
  })

  return (
    <OpenHouseFeedbackSigns
      address={campaign.listingAddress}
      title={campaign.title}
      qrDataUrl={qrDataUrl}
    />
  )
}

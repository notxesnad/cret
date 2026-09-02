import { billingFromProfile, hasShareAccess } from '@/app/lib/billing'
import { ShareUnavailable } from '@/app/components/ShareUnavailable'
import { SellerReportView } from '@/app/components/SellerReportView'
import { isSellerDemoListing } from '@/app/lib/sellerDemo'
import { adminClient, findPublicListing } from '@/app/lib/workspacePublic'

export const dynamic = 'force-dynamic'

export default async function SellerReportPage({ params }: { params: Promise<{ profileId: string; listingId: string }> }) {
  const { profileId, listingId } = await params
  const supabaseAdmin = adminClient()
  const { profile, listing } = await findPublicListing(supabaseAdmin, profileId, listingId)

  if (!profile || !listing) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Report Not Found</h1>
        <p className="text-slate-500 max-w-md mx-auto mb-4">This listing might have been removed or the link is incorrect.</p>
        {!process.env.SUPABASE_SERVICE_ROLE_KEY && (
          <div className="bg-amber-50 text-amber-800 text-sm p-4 rounded-xl max-w-md border border-amber-200">
            <strong>Security Warning:</strong> You are missing the <code>SUPABASE_SERVICE_ROLE_KEY</code> environment variable in your deployed environment.
          </div>
        )}
      </div>
    )
  }

  if (!isSellerDemoListing(listing) && !hasShareAccess(billingFromProfile(profile))) {
    return <ShareUnavailable profile={profile} />
  }

  return <SellerReportView profile={profile} listing={listing} />
}

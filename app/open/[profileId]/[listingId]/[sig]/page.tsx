import { OpenEditorClient } from '@/app/components/OpenEditorClient'
import { editorSignature } from '@/app/lib/editorLink'
import { asEditorListing } from '@/app/lib/openListingCache'
import { adminClient } from '@/app/lib/workspacePublic'

export const dynamic = 'force-dynamic'

export default async function OpenSignedEditorPage({
  params,
}: {
  params: Promise<{ profileId: string; listingId: string; sig: string }>
}) {
  const { profileId, listingId, sig } = await params
  if (sig !== editorSignature(profileId, listingId)) {
    return <OpenEditorClient profileId={profileId} listingId={listingId} sig={sig} />
  }

  const listing = await adminClient()
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .eq('profile_id', profileId)
    .maybeSingle()

  return (
    <OpenEditorClient
      profileId={profileId}
      listingId={listingId}
      sig={sig}
      listing={listing.data?.id ? asEditorListing(listing.data) : undefined}
    />
  )
}

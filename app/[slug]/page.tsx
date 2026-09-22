import { notFound } from 'next/navigation'
import { OpenEditorClient } from '@/app/components/OpenEditorClient'
import { editorSignature } from '@/app/lib/editorLink'
import { isEditorSlug, listingIdFromFallbackSlug } from '@/app/lib/editorSlug'
import { asEditorListing } from '@/app/lib/openListingCache'
import { adminClient } from '@/app/lib/workspacePublic'

export const dynamic = 'force-dynamic'

export default async function PrettyEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const needle = slug.trim().toLowerCase()
  const fallbackId = listingIdFromFallbackSlug(needle)
  if (!isEditorSlug(needle) && !fallbackId) notFound()

  const db = adminClient()
  const listing = isEditorSlug(needle)
    ? await db.from('listings').select('*').eq('editor_slug', needle).maybeSingle()
    : await db.from('listings').select('*').eq('id', fallbackId).maybeSingle()

  if (listing.error || !listing.data?.id || !listing.data.profile_id) notFound()

  return (
    <OpenEditorClient
      profileId={listing.data.profile_id}
      listingId={listing.data.id}
      sig={editorSignature(listing.data.profile_id, listing.data.id)}
      listing={asEditorListing(listing.data)}
    />
  )
}

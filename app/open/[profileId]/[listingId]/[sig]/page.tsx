import { OpenEditorClient } from '@/app/components/OpenEditorClient'

export const dynamic = 'force-dynamic'

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function OpenSignedEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ profileId: string; listingId: string; sig: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { profileId, listingId, sig } = await params
  const query = await searchParams
  return (
    <OpenEditorClient
      profileId={profileId}
      listingId={listingId}
      sig={sig}
      next={first(query.next)}
      via={first(query.via)}
    />
  )
}

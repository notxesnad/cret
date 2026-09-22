import { OpenEditorTokenClient } from './OpenEditorTokenClient'

export const dynamic = 'force-dynamic'

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function OpenTokenEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ profileId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { profileId: token } = await params
  const query = await searchParams
  const listingId = first(query.listing) || ''
  return (
    <OpenEditorTokenClient
      token={token}
      listingId={listingId}
      next={first(query.next)}
      via={first(query.via)}
    />
  )
}

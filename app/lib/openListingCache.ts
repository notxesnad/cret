const OPEN_LISTING_KEY = 'crt-open-listing'

export type EditorListing = {
  id: string
  address: string
  city?: string
  state?: string
  county?: string
  clientId?: string
  archived: boolean
  activities: unknown[]
}

export function asEditorListing(row: {
  id: string
  address?: string | null
  city?: string | null
  state?: string | null
  county?: string | null
  client_id?: string | null
  archived?: boolean | null
  activities?: unknown
}): EditorListing {
  return {
    id: row.id,
    address: row.address || '',
    city: row.city || undefined,
    state: row.state || undefined,
    county: row.county || undefined,
    clientId: row.client_id || undefined,
    archived: row.archived === true,
    activities: Array.isArray(row.activities) ? row.activities : [],
  }
}

export function editorLandingHref(listingId: string, next?: string, via?: string) {
  const params = new URLSearchParams()
  const view = next === 'profile' ? 'profile' : 'sellertracker'
  params.set('view', view)
  if (view === 'sellertracker') params.set('listing', listingId)
  params.set('utm_source', 'email')
  params.set('utm_medium', via === 'html' ? 'html' : 'plain')
  params.set('utm_campaign', 'realtors-st-made')
  params.set('utm_content', view === 'profile' ? 'header' : 'editor')
  return `/?${params.toString()}`
}

export function stashOpenListing(listing: EditorListing) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(OPEN_LISTING_KEY, JSON.stringify(listing))
  } catch {
    // Editor still loads from the workspace.
  }
}

export function takeOpenListing(listingId?: string | null): EditorListing | null {
  if (typeof window === 'undefined' || !listingId) return null
  try {
    const raw = sessionStorage.getItem(OPEN_LISTING_KEY)
    if (!raw) return null
    const listing = JSON.parse(raw) as EditorListing
    if (!listing?.id || listing.id !== listingId) return null
    sessionStorage.removeItem(OPEN_LISTING_KEY)
    return listing
  } catch {
    return null
  }
}

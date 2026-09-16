import { createHmac } from 'node:crypto'

export function publicOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://coolrealestatetools.com').replace(/\/$/, '')
}

function editorSecret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'cool-real-estate-tools'
}

export function editorSignature(profileId: string, listingId: string) {
  return createHmac('sha256', editorSecret()).update(`${profileId}.${listingId}`).digest('hex').slice(0, 32)
}

export function editorHref(
  profileId: string,
  listingId: string,
  extra?: Record<string, string | undefined>
) {
  const url = new URL(`${publicOrigin()}/open/${profileId}/${listingId}/${editorSignature(profileId, listingId)}`)
  for (const [key, value] of Object.entries(extra || {})) {
    if (value) url.searchParams.set(key, value)
  }
  return url.toString()
}

export function reportHref(profileId: string, listingId: string) {
  return `${publicOrigin()}/report/${profileId}/${listingId}`
}

export function isImportedProfile(profile?: { imported?: boolean | null; promo_code?: string | null } | null) {
  return profile?.imported === true || profile?.promo_code === 'imported'
}

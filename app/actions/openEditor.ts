'use server'

import { createClient } from '@supabase/supabase-js'
import { editorSignature, publicOrigin } from '@/app/lib/editorLink'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function startEditorLogin(input: {
  profileId: string
  listingId: string
  sig: string
  next?: string
  via?: string
}): Promise<{ error: string } | { tokenHash: string; nextUrl: string }> {
  const profileId = input.profileId.trim()
  const listingId = input.listingId.trim()
  const sig = input.sig.trim()
  if (!profileId || !listingId || !sig) return { error: 'That link isn’t working.' }
  if (sig !== editorSignature(profileId, listingId)) return { error: 'That link isn’t working.' }

  const db = admin()
  const profile = await db.from('profiles').select('id, email').eq('id', profileId).maybeSingle()
  if (profile.error || !profile.data?.email) return { error: 'That link isn’t working.' }

  const listing = await db
    .from('listings')
    .select('id')
    .eq('id', listingId)
    .eq('profile_id', profileId)
    .maybeSingle()
  if (listing.error || !listing.data?.id) return { error: 'That listing isn’t on this account.' }

  const next = input.next === 'profile' ? 'profile' : 'sellertracker'
  const via = input.via === 'html' ? 'html' : 'plain'
  const dest = new URL(publicOrigin())
  dest.searchParams.set('view', next)
  if (next === 'sellertracker') dest.searchParams.set('listing', listingId)
  dest.searchParams.set('utm_source', 'email')
  dest.searchParams.set('utm_medium', via)
  dest.searchParams.set('utm_campaign', 'realtors-st-made')
  dest.searchParams.set('utm_content', next === 'profile' ? 'header' : 'editor')

  const { data, error } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email: profile.data.email,
    options: { redirectTo: dest.toString() },
  })
  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) {
    console.error('startEditorLogin generateLink', error)
    return { error: 'Couldn’t open the editor. Try the link once more.' }
  }

  return { tokenHash, nextUrl: dest.toString() }
}

export async function startEditorLoginByToken(input: {
  token: string
  listingId: string
  next?: string
  via?: string
}): Promise<{ error: string } | { tokenHash: string; nextUrl: string }> {
  const token = input.token.trim()
  const listingId = input.listingId.trim()
  if (!token || !listingId) return { error: 'That link isn’t working.' }
  const db = admin()
  const profile = await db.from('profiles').select('id').eq('editor_token', token).maybeSingle()
  if (profile.error || !profile.data?.id) return { error: 'That link isn’t working.' }
  return startEditorLogin({
    profileId: profile.data.id,
    listingId,
    sig: editorSignature(profile.data.id, listingId),
    next: input.next,
    via: input.via,
  })
}

export async function markImportedOpened(input: {
  profileId: string
  listingId: string
  sig: string
}): Promise<void> {
  if (input.sig !== editorSignature(input.profileId, input.listingId)) return
  const db = admin()
  const { data } = await db
    .from('profiles')
    .select('id, promo_code')
    .eq('id', input.profileId)
    .maybeSingle()
  if (!data?.id) return
  const patch: Record<string, unknown> = {
    imported: false,
    updated_at: new Date().toISOString(),
  }
  if (data.promo_code === 'imported') patch.promo_code = null
  await db.from('profiles').update(patch).eq('id', data.id)
}

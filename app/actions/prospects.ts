'use server'

import { createClient } from '@supabase/supabase-js'
import {
  PROSPECT_KIND,
  PROSPECT_STORE_ID,
  PROSPECT_STORE_KIND,
  type Prospect,
  type ProspectSourceTool,
} from '@/app/lib/prospects'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function saveProspect(input: {
  profileId: string
  name?: string
  email?: string
  phone?: string
  sourceTool: ProspectSourceTool
  sourceId?: string
  listingId?: string
  listingAddress?: string
}) {
  const email = input.email?.trim() || ''
  const phone = input.phone?.trim() || ''
  const name = input.name?.trim() || ''
  if (!input.profileId || (!email && !phone && !name)) {
    return { error: 'Add an email or phone number.' }
  }

  const prospect: Prospect = {
    id: crypto.randomUUID(),
    kind: PROSPECT_KIND,
    profileId: input.profileId,
    name: name || undefined,
    email: email || undefined,
    phone: phone || undefined,
    sourceTool: input.sourceTool,
    sourceId: input.sourceId,
    listingId: input.listingId,
    listingAddress: input.listingAddress,
    createdAt: new Date().toISOString(),
  }

  const supabase = admin()

  const tableInsert = await supabase.from('prospects').insert({
    id: prospect.id,
    profile_id: prospect.profileId,
    name: prospect.name || null,
    email: prospect.email || null,
    phone: prospect.phone || null,
    source_tool: prospect.sourceTool,
    source_id: prospect.sourceId || null,
    listing_id: prospect.listingId || null,
    listing_address: prospect.listingAddress || null,
    created_at: prospect.createdAt,
  })

  if (!tableInsert.error) return { success: true, id: prospect.id }

  const { data: profile, error: readError } = await supabase
    .from('profiles')
    .select('outreach_campaigns')
    .eq('id', input.profileId)
    .single()

  if (readError || !profile) return { error: 'Could not save contact.' }

  const campaigns = Array.isArray(profile.outreach_campaigns) ? [...profile.outreach_campaigns] : []
  const storeIndex = campaigns.findIndex(
    (c: { id?: string; kind?: string }) => c.id === PROSPECT_STORE_ID || c.kind === PROSPECT_STORE_KIND
  )

  if (storeIndex >= 0) {
    const store = campaigns[storeIndex]
    campaigns[storeIndex] = {
      ...store,
      id: PROSPECT_STORE_ID,
      kind: PROSPECT_STORE_KIND,
      items: [...(store.items || []), prospect],
    }
  } else {
    campaigns.push({
      id: PROSPECT_STORE_ID,
      kind: PROSPECT_STORE_KIND,
      items: [prospect],
    })
  }

  const { error: writeError } = await supabase
    .from('profiles')
    .update({ outreach_campaigns: campaigns })
    .eq('id', input.profileId)

  if (writeError) return { error: writeError.message }
  return { success: true, id: prospect.id }
}

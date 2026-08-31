'use server'

import { createClient } from '@supabase/supabase-js'
import {
  PROSPECT_KIND,
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

  const { error } = await admin().from('prospects').insert({
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

  if (!error) return { success: true, id: prospect.id }

  console.error('Error saving prospect:', error)
  return { error: 'Could not save contact.' }
}

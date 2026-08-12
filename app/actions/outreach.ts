'use server'

import { createClient } from '@supabase/supabase-js'

export async function submitOutreachResponse(profileId: string, campaignId: string, response: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('outreach_campaigns')
    .eq('id', profileId)
    .single()

  if (error || !profile) return { error: 'Profile not found' }

  const campaigns = profile.outreach_campaigns || []
  const idx = campaigns.findIndex((c: any) => c.id === campaignId)
  if (idx === -1) return { error: 'Campaign not found' }

  if (!campaigns[idx].responses) {
    campaigns[idx].responses = []
  }

  campaigns[idx].responses.push({
    id: Math.random().toString(36).substring(2, 9),
    date: new Date().toISOString(),
    answers: response
  })

  await supabase
    .from('profiles')
    .update({ outreach_campaigns: campaigns })
    .eq('id', profileId)

  return { success: true }
}

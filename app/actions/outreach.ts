'use server'

import { createClient } from '@supabase/supabase-js'

export async function submitOutreachResponse(profileId: string, campaignId: string, response: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const row = {
    id: crypto.randomUUID(),
    campaign_id: campaignId,
    profile_id: profileId,
    answers: response,
    created_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('campaign_responses').insert(row)
  if (!error) return { success: true }

  console.error('Error saving campaign response:', error)
  return { error: 'Could not save your response.' }
}

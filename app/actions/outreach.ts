'use server'

import { createClient } from '@supabase/supabase-js'
import { findPublicCampaign } from '@/app/lib/workspacePublic'
import { isShowingFeedback } from '@/app/lib/showingFeedback'
import { sendShowingFeedbackEmails } from '@/app/lib/showingFeedbackEmails'

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
  if (error) {
    console.error('Error saving campaign response:', error)
    return { error: 'Could not save your response.' }
  }

  try {
    const { profile, campaign } = await findPublicCampaign(supabase, profileId, campaignId, 'showing')
    if (profile && campaign && isShowingFeedback(campaign.kind)) {
      await sendShowingFeedbackEmails({
        profile,
        campaign,
        profileId,
        campaignId,
        responseId: row.id,
        answers: response || {},
      })
    }
  } catch (err) {
    console.error('Showing feedback notify failed', err)
  }

  return { success: true }
}

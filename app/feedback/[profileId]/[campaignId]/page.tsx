import { createClient } from '@supabase/supabase-js'
import { renderAgentHeader } from '@/app/components/AgentHeader'
import { FeedbackClient } from './FeedbackClient'
import { OPENHOUSE_FEEDBACK_KIND } from '@/app/lib/openhouseFeedback'

export default async function OpenHouseFeedbackPage({ params }: { params: Promise<{ profileId: string; campaignId: string }> }) {
  const { profileId, campaignId } = await params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (error) {
    console.error('Supabase Error fetching profile for open house feedback:', error)
  }

  const campaign = (profile?.outreach_campaigns || []).find(
    (c: any) => c.id === campaignId && c.kind === OPENHOUSE_FEEDBACK_KIND
  )

  if (!profile || !campaign) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-100 mb-2">Questionnaire Not Found</h1>
        <p className="text-slate-400 max-w-md mx-auto mb-4">This feedback form may have been removed or the link is incorrect.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-50 font-sans pb-20">
      <div className="max-w-xl mx-auto pt-6 px-4 md:px-8">
        {renderAgentHeader(profile)}
      </div>
      <div className="max-w-xl mx-auto px-4 md:px-8 mt-6">
        <FeedbackClient
          profileId={profileId}
          campaignId={campaignId}
          campaign={campaign}
        />
      </div>
    </div>
  )
}

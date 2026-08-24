import { createClient } from '@supabase/supabase-js'
import { renderAgentHeader } from '@/app/components/AgentHeader'
import { AdviceClient } from './AdviceClient'
import { OPENHOUSE_FEEDBACK_KIND } from '@/app/lib/openhouseFeedback'
import { PROSPECT_STORE_KIND } from '@/app/lib/prospects'
import { normalizeQuizTheme } from '@/app/lib/quizTheme'

export const dynamic = 'force-dynamic'

export default async function AdvicePage({ params }: { params: Promise<{ profileId: string; campaignId: string }> }) {
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
    console.error("Supabase Error fetching profile for advice:", error)
  }

  let campaign = null

  if (profile && profile.outreach_campaigns) {
    campaign = profile.outreach_campaigns.find(
      (c: { id?: string; kind?: string }) =>
        c.id === campaignId && c.kind !== OPENHOUSE_FEEDBACK_KIND && c.kind !== PROSPECT_STORE_KIND
    )
  }

  if (!profile || !campaign) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-100 mb-2">Campaign Not Found</h1>
        <p className="text-slate-400 max-w-md mx-auto mb-4">This questionnaire may have been removed or the link is incorrect.</p>
      </div>
    )
  }

  const theme = normalizeQuizTheme(campaign.theme)
  const isDark = theme === 'dark'

  return (
    <div className={`h-[100dvh] flex flex-col font-sans ${isDark ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <div className="flex-none w-full [&>*]:mb-0">
        {renderAgentHeader(profile)}
      </div>
      <div className="flex-1 min-h-0 max-w-xl mx-auto w-full">
        <AdviceClient
          profileId={profileId}
          campaignId={campaignId}
          campaign={campaign}
        />
      </div>
    </div>
  )
}

import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import QRCode from 'qrcode'
import { renderAgentHeader } from '@/app/components/AgentHeader'
import { PrintButtons } from '@/app/components/PrintControls'
import { OPENHOUSE_FEEDBACK_KIND } from '@/app/lib/openhouseFeedback'

async function getShareUrl(path: string) {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host')
  const proto = headerList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
  if (host) return `${proto}://${host}${path}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${path}`
  return path
}

export default async function OpenHouseFeedbackPrintPage({ params }: { params: Promise<{ profileId: string; campaignId: string }> }) {
  const { profileId, campaignId } = await params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  const campaign = (profile?.outreach_campaigns || []).find(
    (c: any) => c.id === campaignId && c.kind === OPENHOUSE_FEEDBACK_KIND
  )

  if (!profile || !campaign) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Sign Not Found</h1>
        <p className="text-slate-500 max-w-md mx-auto">This questionnaire may have been removed or the link is incorrect.</p>
      </div>
    )
  }

  const quizUrl = await getShareUrl(`/feedback/${profileId}/${campaignId}`)
  const qrDataUrl = await QRCode.toDataURL(quizUrl, {
    width: 360,
    margin: 1,
    errorCorrectionLevel: 'L',
    color: { dark: '#0f172a', light: '#ffffff' },
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body { background: white !important; }
        }
      `}</style>

      <div id="report-print-root" className="w-full">
        <div className="w-full [&>*]:mb-0">
          {renderAgentHeader(profile)}
        </div>

        <div className="max-w-3xl mx-auto px-4 md:px-8 py-6">
          <div className="flex justify-end mb-4 no-print">
            <PrintButtons listingAddress={`${campaign.listingAddress || campaign.title}-feedback-sign`} />
          </div>

          <div className="bg-white border border-slate-200 p-8 md:p-12 text-center print-break-inside-avoid">
            <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">Open House</p>
            {campaign.listingAddress && (
              <p className="text-sm font-black text-indigo-600 mb-2">{campaign.listingAddress}</p>
            )}
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">We&apos;d love your anonymous feedback</h1>
            <p className="text-lg text-slate-600 mt-4 max-w-md mx-auto">
              Scan this code to share your thoughts. No name required — it takes about 30 seconds.
            </p>
            <img src={qrDataUrl} alt="Scan for anonymous feedback" className="w-44 h-44 mx-auto mt-8 bg-white" />
            <p className="text-sm font-bold text-slate-500 mt-4">{campaign.title}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

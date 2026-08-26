import { createClient } from '@supabase/supabase-js'
import { renderAgentHeader } from '@/app/components/AgentHeader'
import { NetSheetDocument } from '@/app/components/NetSheetDocument'
import { PrintButtons } from '@/app/components/PrintControls'
import { asNetSheet, sheetTitle } from '@/app/lib/netSheet'

export const dynamic = 'force-dynamic'

export default async function NetSheetSharePage({
  params,
}: {
  params: Promise<{ profileId: string; sheetId: string }>
}) {
  const { profileId, sheetId } = await params
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  const listings = Array.isArray(profile?.listings) ? profile.listings : []
  const fromListings = listings.find((item: { id?: string }) => item.id === sheetId)
  const fromColumn = Array.isArray(profile?.net_sheets)
    ? profile.net_sheets.find((item: { id?: string }) => item.id === sheetId)
    : null
  const raw = fromListings || fromColumn
  const sheet = asNetSheet(raw)

  if (!profile || !sheet) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Net Sheet Not Found</h1>
        <p className="text-slate-500 max-w-md mx-auto">This estimate might have been removed or the link is incorrect.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#ece8df] text-slate-900 font-sans pb-20">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body { background: white !important; }
          #report-print-root, #report-print-root * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
      <div id="report-print-root" className="w-full max-w-3xl mx-auto bg-white shadow-xl my-0 md:my-8">
        <NetSheetDocument
          sheet={sheet}
          header={renderAgentHeader(profile)}
        />
      </div>
      <div className="no-print max-w-3xl mx-auto px-5 md:px-8 mt-6 mb-10">
        <PrintButtons listingAddress={sheetTitle(sheet)} />
      </div>
    </div>
  )
}

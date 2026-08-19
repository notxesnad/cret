import { createClient } from '@supabase/supabase-js'
import { renderAgentHeader } from '@/app/components/AgentHeader'
import { PrintButtons } from '@/app/components/PrintControls'

export default async function SellerReportPage({ params }: { params: Promise<{ profileId: string; listingId: string }> }) {
  const { profileId, listingId } = await params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Fall back to anon key if service role is missing during build time
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (error) {
    console.error("Supabase Error fetching profile:", error)
  }

  let listing = null

  if (profile && profile.listings) {
    listing = profile.listings.find((l: any) => l.id === listingId)
  }

  if (!profile || !listing) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Report Not Found</h1>
        <p className="text-slate-500 max-w-md mx-auto mb-4">This listing might have been removed or the link is incorrect.</p>
        {!process.env.SUPABASE_SERVICE_ROLE_KEY && (
          <div className="bg-amber-50 text-amber-800 text-sm p-4 rounded-xl max-w-md border border-amber-200">
            <strong>Security Warning:</strong> You are missing the <code>SUPABASE_SERVICE_ROLE_KEY</code> environment variable in your deployed environment.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* Hide controls from print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body { background: white !important; }
          .print-break-inside-avoid { break-inside: avoid; }
          #report-print-root, #report-print-root * {
            box-shadow: none !important;
            text-shadow: none !important;
            filter: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div id="report-print-root" className="max-w-3xl mx-auto pt-6 px-4 md:px-8 space-y-6">
        {/* Brand Header */}
        {renderAgentHeader(profile)}

        {/* Report Title */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Seller Activity Report</span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{listing.address}</h1>
          </div>
          <PrintButtons listingAddress={listing.address} />
        </div>

        {/* Activity Timeline */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl">
          <h2 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">Marketing & Activity Timeline</h2>
          
          {(!listing.activities || listing.activities.length === 0) ? (
            <p className="text-slate-500 italic py-4">No activities logged yet for this listing.</p>
          ) : (
            <div className="relative border-l-2 border-slate-100 ml-3 md:ml-4 space-y-8 pb-4">
              {listing.activities.map((act: any, i: number) => {
                const isCompleted = act.status === 'completed' || !act.status
                const isUpcoming = act.status === 'upcoming'
                
                return (
                  <div key={act.id} className="relative pl-6 md:pl-8 print-break-inside-avoid">
                    {/* Timeline Dot */}
                    <div className={`absolute w-3.5 h-3.5 rounded-full -left-[9px] top-1.5 border-2 border-white ${isCompleted ? 'bg-emerald-500' : isUpcoming ? 'bg-cyan-400' : 'bg-amber-400'}`}></div>
                    
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${isCompleted ? 'text-slate-500 bg-slate-100' : isUpcoming ? 'text-cyan-700 bg-cyan-50' : 'text-amber-700 bg-amber-50'}`}>
                        {act.date}
                      </span>
                      {!isCompleted && (
                        <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${isUpcoming ? 'text-cyan-700 bg-cyan-50' : 'text-amber-700 bg-amber-50'}`}>
                          {act.status}
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`text-lg font-bold mt-1 ${!isCompleted ? 'text-slate-600' : 'text-slate-900'}`}>{act.label}</h3>
                    
                    {act.notes && (
                      <p className="text-base text-slate-500 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                        {act.notes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

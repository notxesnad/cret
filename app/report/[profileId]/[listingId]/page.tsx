'use client'

import { useEffect, useState, use } from 'react'
import { supabase } from '@/utils/supabase'
import { renderAgentHeader } from '@/app/components/AgentHeader'

export default function SellerReportPage({ params }: { params: Promise<{ profileId: string; listingId: string }> }) {
  const unwrappedParams = use(params)
  const { profileId, listingId } = unwrappedParams
  const [profile, setProfile] = useState<any>(null)
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReport() {
      // In a real app with RLS, we'd either have public read access to profiles
      // or a specific edge function. Assuming we can read public info for now.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (data && data.listings) {
        setProfile(data)
        const found = data.listings.find((l: any) => l.id === listingId)
        if (found) {
          setListing(found)
        }
      }
      setLoading(false)

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('print') === 'true') {
        setTimeout(() => window.print(), 1000)
      }
    }
    fetchReport()
  }, [profileId, listingId])

  if (loading) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-400">Loading Report...</div>
  }

  if (!profile || !listing) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Report Not Found</h1>
        <p className="text-slate-500">This listing might have been removed or the link is incorrect.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* Hide controls from print */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      {/* Brand Header */}
      <div className="max-w-3xl mx-auto pt-6 px-4 md:px-8">
        {renderAgentHeader(profile)}
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-6">
        
        {/* Report Title */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Seller Activity Report</span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{listing.address}</h1>
          </div>
          <button 
            onClick={() => window.print()}
            className="no-print bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 text-sm max-w-fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print / Save as PDF
          </button>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl">
          <h2 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">Marketing & Activity Timeline</h2>
          
          {listing.activities.length === 0 ? (
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
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${isCompleted ? 'text-slate-500 bg-slate-100' : isUpcoming ? 'text-cyan-700 bg-cyan-50' : 'text-amber-700 bg-amber-50'}`}>
                        {act.date}
                      </span>
                      {!isCompleted && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${isUpcoming ? 'text-cyan-700 bg-cyan-50' : 'text-amber-700 bg-amber-50'}`}>
                          {act.status}
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`text-base font-bold ${!isCompleted ? 'text-slate-600' : 'text-slate-900'}`}>{act.label}</h3>
                    
                    {act.notes && (
                      <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
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

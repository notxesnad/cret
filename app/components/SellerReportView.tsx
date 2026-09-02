import { renderAgentHeader } from '@/app/components/AgentHeader'
import { PrintButtons } from '@/app/components/PrintControls'
import { formatDateDisplay } from '@/app/lib/tourFormat'

export const SELLER_DEMO_PUBLIC_PROFILE = {
  full_name: 'Alex Rivera',
  brokerage: 'Cool Real Estate Tools',
  phone: '(555) 555-0100',
  email: 'hello@coolrealestatetools.com',
  pdf_look: 'look1',
}

export function SellerReportView({ profile, listing }: { profile: any; listing: any }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body { background: white !important; }
          #report-print-root table { width: 100%; border-collapse: collapse; }
          #report-print-root thead { display: table-header-group; }
          #report-print-root td { padding: 0; }
          .print-break-inside-avoid {
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            overflow: visible !important;
          }
          #report-print-root, #report-print-root * {
            box-shadow: none !important;
            text-shadow: none !important;
            filter: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div id="report-print-root" className="w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <td className="p-0">
                <div id="report-print-header">
                  {renderAgentHeader(profile)}
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-0">
                <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-6">
                  <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl flex flex-col md:flex-row justify-between md:items-end gap-4 print-break-inside-avoid">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Seller Activity Report</span>
                      <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{listing.address}</h1>
                    </div>
                    <PrintButtons listingAddress={listing.address} />
                  </div>

                  <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl">
                    <h2 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">Marketing & Activity Timeline</h2>

                    {(!listing.activities || listing.activities.length === 0) ? (
                      <p className="text-slate-500 italic py-4">No activities logged yet for this listing.</p>
                    ) : (
                      <div className="relative border-l-2 border-slate-100 ml-3 md:ml-4 space-y-8 pb-4">
                        {listing.activities.map((act: any) => {
                          const isCompleted = act.status === 'completed' || !act.status
                          const isUpcoming = act.status === 'upcoming'

                          return (
                            <div key={act.id} className="relative pl-6 md:pl-8 print-break-inside-avoid">
                              <div className={`absolute w-3.5 h-3.5 rounded-full -left-[9px] top-1.5 border-2 border-white ${isCompleted ? 'bg-emerald-500' : isUpcoming ? 'bg-cyan-400' : 'bg-amber-400'}`}></div>

                              <div className="flex flex-wrap gap-2 mb-1">
                                <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${isCompleted ? 'text-slate-500 bg-slate-100' : isUpcoming ? 'text-cyan-700 bg-cyan-50' : 'text-amber-700 bg-amber-50'}`}>
                                  {formatDateDisplay(act.date)}
                                </span>
                                <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${isCompleted ? 'text-emerald-700 bg-emerald-50' : isUpcoming ? 'text-cyan-700 bg-cyan-50' : 'text-amber-700 bg-amber-50'}`}>
                                  {isCompleted ? 'Completed' : act.status}
                                </span>
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

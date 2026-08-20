import { createClient } from '@supabase/supabase-js'
import { renderAgentHeader } from '@/app/components/AgentHeader'
import { PrintButtons } from '@/app/components/PrintControls'
import { formatDateDisplay, formatTimeDisplay, formatPrice, sortStopsByTime } from '@/app/lib/tourFormat'

export default async function TourItineraryPage({
  params
}: {
  params: Promise<{ profileId: string; clientId: string; tourId: string }>
}) {
  const { profileId, clientId, tourId } = await params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (error) {
    console.error('Supabase Error fetching profile for tour:', error)
  }

  const client = profile?.clients?.find((c: any) => c.id === clientId)
  const tour = client?.tours?.find((t: any) => t.id === tourId)
  const homes = client?.homes || []

  const stops = sortStopsByTime(tour?.stops || []).map((stop: any, index: number) => {
    const home = homes.find((h: any) => h.id === stop.homeId)
    return home ? { ...stop, home, index } : null
  }).filter(Boolean)

  if (!profile || !client || !tour) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Tour Not Found</h1>
        <p className="text-slate-500 max-w-md mx-auto">This itinerary might have been removed or the link is incorrect.</p>
      </div>
    )
  }

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

      <div id="report-print-root" className="max-w-3xl mx-auto pt-6 px-4 md:px-8">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <td>
                <div id="report-print-header">
                  {renderAgentHeader(profile)}
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl flex flex-col md:flex-row justify-between md:items-end gap-4 print-break-inside-avoid">
                    <div>
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">Tour Itinerary</span>
                      <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{tour.title}</h1>
                      {tour.date && (
                        <p className="text-2xl md:text-3xl font-bold text-slate-800 mt-2">{formatDateDisplay(tour.date)}</p>
                      )}
                      <p className="text-base text-slate-500 mt-2">
                        Prepared for {client.name}
                        {` • ${stops.length} ${stops.length === 1 ? 'stop' : 'stops'}`}
                      </p>
                    </div>
                    <PrintButtons listingAddress={tour.title} />
                  </div>

                  {stops.length === 0 ? (
                    <div className="bg-white border border-slate-200 p-8 rounded-2xl text-slate-500 italic">
                      No homes have been added to this tour yet.
                    </div>
                  ) : (
                    stops.map((item: any) => (
                      <div key={item.home.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden print-break-inside-avoid">
                        {item.home.photo_url && (
                          <img src={item.home.photo_url} alt={item.home.address} className="w-full h-52 object-cover" />
                        )}
                        <div className="p-6 md:p-8">
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div>
                              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <span className="text-3xl font-normal text-rose-600">Stop {item.index + 1}</span>
                                {item.time && (
                                  <span className="text-3xl font-bold text-slate-900">{formatTimeDisplay(item.time)}</span>
                                )}
                              </div>
                              <h2 className="text-xl font-black text-slate-900 mt-2">{item.home.address}</h2>
                            </div>
                            {item.home.price && (
                              <div className="text-lg font-black text-emerald-600 whitespace-nowrap">{formatPrice(item.home.price) || item.home.price}</div>
                            )}
                          </div>

                          {item.home.notes && (
                            <p className="text-base text-slate-600 mb-4 whitespace-pre-wrap">{item.home.notes}</p>
                          )}

                          <div className="flex flex-wrap gap-2 no-print">
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(item.home.address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm"
                            >
                              Open in Google Maps
                            </a>
                            {item.home.mls_pdf_url && (
                              <a
                                href={item.home.mls_pdf_url}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-rose-500 hover:bg-rose-400 text-white px-4 py-2 rounded-xl font-bold text-sm"
                              >
                                MLS Details PDF
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { renderAgentHeader } from '@/app/components/AgentHeader'
import { formatCityState, formatDateDisplay, formatPrice } from '@/app/lib/tourFormat'
import { isNetSheet, sheetTitle } from '@/app/lib/netSheet'
import { isArchived } from '@/app/lib/archive'
import type { TourClient, TourHome } from '@/app/lib/tourHomes'

function DashCard({
  href,
  eyebrow,
  title,
  meta,
}: {
  href: string
  eyebrow: string
  title: string
  meta?: string
}) {
  return (
    <a
      href={href}
      className="block bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-400 transition"
    >
      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{eyebrow}</div>
      <div className="text-lg font-black text-slate-900 mt-1">{title}</div>
      {meta ? <div className="text-sm text-slate-500 mt-1">{meta}</div> : null}
    </a>
  )
}

export function ClientDashboardView({
  profile,
  client,
  homes,
  listings,
  profileId,
}: {
  profile: any
  client: TourClient
  homes: TourHome[]
  listings: any[]
  profileId: string
}) {
  const clientListings = listings.filter((item: any) => !isNetSheet(item) && item.clientId === client.id)
  const sheets = listings.filter((item: any) => isNetSheet(item) && (
    item.listingId && clientListings.some((listing: any) => listing.id === item.listingId)
  ))
  const tourHomeIds = new Set((client.tours || []).flatMap((tour) => (tour.stops || []).map((stop) => stop.homeId)))
  const showingHomes = homes.filter((home) => tourHomeIds.has(home.id))

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <div className="max-w-xl mx-auto bg-white shadow-xl min-h-screen">
        <div className="px-1 pt-2">
          {renderAgentHeader(profile)}
        </div>
        <div className="px-5 pb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Your dashboard</p>
          <h1 className="text-3xl font-black mt-1">{client.name || 'Your agent’s tools'}</h1>
          {(client.email || client.phone) ? (
            <p className="text-slate-500 mt-2">
              {[client.email, client.phone].filter(Boolean).join(' · ')}
            </p>
          ) : null}

          {(client.tours || []).length > 0 ? (
            <section className="mt-8 space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Tours</h2>
              {client.tours.map((tour) => (
                <DashCard
                  key={tour.id}
                  href={`/tour/${profileId}/${client.id}/${tour.id}`}
                  eyebrow="Tour itinerary"
                  title={tour.title || 'Tour'}
                  meta={[tour.date ? formatDateDisplay(tour.date) : '', `${(tour.stops || []).length} ${(tour.stops || []).length === 1 ? 'stop' : 'stops'}`].filter(Boolean).join(' · ')}
                />
              ))}
            </section>
          ) : null}

          {showingHomes.length > 0 ? (
            <section className="mt-8 space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Homes on your tours</h2>
              {showingHomes.map((home) => (
                <div key={home.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="text-lg font-black">{home.address}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {[formatCityState(home.city, home.state), home.price ? formatPrice(home.price) : ''].filter(Boolean).join(' · ')}
                  </div>
                  {client.homeNotes?.[home.id] ? (
                    <p className="text-sm text-slate-600 mt-2">{client.homeNotes[home.id]}</p>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}

          {clientListings.length > 0 ? (
            <section className="mt-8 space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Your listings</h2>
              {clientListings.map((listing: any) => (
                <DashCard
                  key={listing.id}
                  href={`/report/${profileId}/${listing.id}`}
                  eyebrow="Seller report"
                  title={[listing.address, listing.city].filter(Boolean).join(', ') || 'Listing'}
                  meta={isArchived(listing) ? 'Archived' : undefined}
                />
              ))}
            </section>
          ) : null}

          {sheets.length > 0 ? (
            <section className="mt-8 space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Net sheets</h2>
              {sheets.map((sheet: any) => (
                <DashCard
                  key={sheet.id}
                  href={`/netsheet/${profileId}/${sheet.id}`}
                  eyebrow="Seller net sheet"
                  title={sheetTitle(sheet)}
                />
              ))}
            </section>
          ) : null}

          {(client.tours || []).length === 0 && clientListings.length === 0 && sheets.length === 0 ? (
            <p className="text-slate-500 mt-10">Nothing to show yet. Your agent will add tours and reports here.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

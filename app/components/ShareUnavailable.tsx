export function ShareUnavailable({ profile }: { profile: {
  full_name?: string | null
  phone?: string | null
  email?: string | null
  brokerage?: string | null
} }) {
  const name = (profile.full_name || '').trim() || 'your agent'
  const phone = (profile.phone || '').trim()
  const email = (profile.email || '').trim()
  const brokerage = (profile.brokerage || '').trim()

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4">
        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Cool Real Estate Tools</p>
        <h1 className="text-2xl font-black text-slate-900">This link is no longer active</h1>
        <p className="text-slate-600">Please contact {name} for an updated copy.</p>
        {brokerage && <p className="text-sm text-slate-400">{brokerage}</p>}
        <div className="space-y-2 pt-2">
          {phone && (
            <a href={`tel:${phone}`} className="block text-emerald-700 font-bold hover:underline">
              {phone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="block text-emerald-700 font-bold hover:underline">
              {email}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

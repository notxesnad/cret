export function renderAgentHeader(profile: any, themeOverride: string | null = null) {
  if (!profile) return null;
  const look = themeOverride || profile.pdf_look || 'look1'
  const name = profile.full_name || 'Jane Doe'
  const brokerage = profile.brokerage || 'Luxury Real Estate'
  const phone = profile.phone || '(555) 123-4567'
  const showHeadshot = profile.show_headshot !== false && !!profile.headshot_url
  const headshot = profile.headshot_url
  const logo = profile.logo_url

  switch(look) {
    case 'look1': 
      return (
        <div className="bg-white border-b border-slate-100 pb-5 mb-5 flex flex-col items-center text-center px-4 pt-2">
          {logo ? (
            <img src={logo} alt="Logo" className="h-10 md:h-12 w-auto max-w-full object-contain mb-4" />
          ) : (
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4 uppercase">{brokerage}</h2>
          )}
          <div className="flex items-center gap-4">
            {showHeadshot && <img src={headshot} alt="Agent" className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200" />}
            <div className={showHeadshot ? "text-left" : "text-center"}>
              <h3 className="font-semibold text-slate-900 text-sm tracking-wide">{name}</h3>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">{phone}</p>
            </div>
          </div>
        </div>
      )

    case 'look2': 
      return (
        <div className="bg-slate-950 text-amber-50 p-5 rounded-xl flex justify-between items-center mb-5 shadow-lg border border-slate-800">
          <div className="flex-1 flex flex-col justify-center">
            {logo ? (
              <img src={logo} alt="Logo" className="h-8 md:h-10 w-auto max-w-[160px] object-contain object-left mb-2 brightness-0 invert" />
            ) : (
              <span className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-2 block">{brokerage}</span>
            )}
            <h3 className="font-serif text-lg tracking-wide text-white">{name}</h3>
            <p className="text-[10px] text-slate-400 tracking-widest">{phone}</p>
          </div>
          {showHeadshot && (
            <div className="ml-4 flex-shrink-0">
              <img src={headshot} alt="Agent" className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-500/30" />
            </div>
          )}
        </div>
      )

    case 'look3': 
      return (
        <div className="bg-teal-50/50 border border-teal-100 p-5 rounded-2xl flex justify-between items-center mb-5">
          <div className="flex items-center gap-4">
            {showHeadshot && <img src={headshot} alt="Agent" className="w-14 h-14 rounded-xl object-cover shadow-sm" />}
            <div>
              <h3 className="font-bold text-teal-950 text-lg">{name}</h3>
              <p className="text-[11px] text-teal-700 font-medium">{phone}</p>
            </div>
          </div>
          <div className="text-right">
            {logo ? (
              <img src={logo} alt="Logo" className="h-9 w-auto max-w-[140px] object-contain object-right" />
            ) : (
              <span className="font-serif italic text-teal-800 text-sm">{brokerage}</span>
            )}
          </div>
        </div>
      )

    case 'look4': 
      return (
        <div className="border-t-4 border-b border-slate-900 py-5 mb-5 flex justify-between items-start text-slate-900 bg-white">
          <div className="flex-1">
            {logo && <img src={logo} alt="Logo" className="h-7 w-auto max-w-[150px] object-contain object-left mb-3 grayscale" />}
            <h3 className="font-serif text-2xl tracking-tight leading-none mb-1">{name}</h3>
            <p className="text-[9px] font-mono tracking-widest uppercase text-slate-500 mt-1">{phone} &mdash; {brokerage}</p>
          </div>
          {showHeadshot && <img src={headshot} alt="Agent" className="w-16 h-16 object-cover grayscale contrast-125 rounded-tl-full rounded-tr-full" />}
        </div>
      )

    case 'look5': 
      return (
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl flex flex-col items-center mb-5">
          {logo ? (
            <img src={logo} alt="Logo" className="h-14 md:h-16 w-auto max-w-full object-contain mb-5" />
          ) : (
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-5">{brokerage}</h2>
          )}
          <div className="w-full border-t border-slate-200 pt-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {showHeadshot && <img src={headshot} alt="Agent" className="w-10 h-10 rounded-full object-cover" />}
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">{name}</h3>
            </div>
            <p className="text-[11px] font-medium text-slate-600">{phone}</p>
          </div>
        </div>
      )

    case 'look6': 
      return (
        <div className="bg-blue-950 p-1 mb-5 shadow-sm rounded-lg">
          <div className="bg-white p-4 rounded-md border-2 border-blue-900/10 flex justify-between items-center">
            <div className="flex-1">
              <h3 className="font-bold text-blue-950 text-xl tracking-tight">{name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-4 h-[1px] bg-amber-500"></span>
                <p className="text-[10px] text-blue-900 uppercase font-semibold tracking-wider">{brokerage}</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">{phone}</p>
            </div>
            <div className="flex items-center gap-4">
              {logo && <img src={logo} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" />}
              {showHeadshot && <img src={headshot} alt="Agent" className="w-12 h-12 rounded object-cover shadow-sm border border-slate-100" />}
            </div>
          </div>
        </div>
      )

    case 'look7': 
      return (
        <div className="relative p-5 rounded-2xl mb-5 overflow-hidden bg-white shadow-md border border-slate-100">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-fuchsia-500 to-rose-500"></div>
          <div className="flex justify-between items-center pl-2">
            <div>
              {logo && <img src={logo} alt="Logo" className="h-8 w-auto max-w-[150px] object-contain object-left mb-2" />}
              <h3 className="font-black text-slate-900 text-lg">{name}</h3>
              <p className="text-[11px] font-medium text-slate-500">{phone}</p>
            </div>
            {showHeadshot && <img src={headshot} alt="Agent" className="w-14 h-14 rounded-2xl object-cover shadow-sm" />}
          </div>
        </div>
      )

    case 'look8': 
      return (
        <div className="border-4 border-black p-4 mb-5 bg-white flex justify-between items-center">
          <div className="flex flex-col">
            <h3 className="font-black text-black text-xl uppercase tracking-tighter">{name}</h3>
            <p className="text-[10px] font-bold text-black uppercase tracking-widest mt-1">{brokerage}</p>
            <p className="text-[10px] font-medium text-slate-600 mt-1">{phone}</p>
          </div>
          <div className="flex items-center gap-3">
            {logo && <img src={logo} alt="Logo" className="h-8 w-auto max-w-[100px] object-contain grayscale" />}
            {showHeadshot && <img src={headshot} alt="Agent" className="w-12 h-12 object-cover grayscale border-2 border-black" />}
          </div>
        </div>
      )

    case 'look9': 
      return (
        <div className="bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-100 p-5 rounded-xl flex justify-between items-center mb-5">
          <div className="flex items-center gap-4">
            {showHeadshot && <img src={headshot} alt="Agent" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />}
            <div>
              <h3 className="font-bold text-slate-900 text-base">{name}</h3>
              <p className="text-[10px] text-orange-800 font-medium uppercase tracking-wider">{brokerage}</p>
            </div>
          </div>
          <div className="text-right">
            {logo && <img src={logo} alt="Logo" className="h-9 w-auto max-w-[120px] object-contain object-right mix-blend-multiply" />}
            <p className="text-[10px] text-slate-500 font-medium mt-1">{phone}</p>
          </div>
        </div>
      )

    case 'look10': 
    default:
      return (
        <div className="bg-slate-100/50 backdrop-blur-md border border-white/60 p-4 rounded-2xl flex justify-between items-center mb-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col justify-center">
            {logo && <img src={logo} alt="Logo" className="h-7 w-auto max-w-[140px] object-contain object-left mb-1.5" />}
            <h3 className="font-semibold text-slate-800 text-sm">{name}</h3>
            <p className="text-[10px] text-slate-500">{phone}</p>
          </div>
          {showHeadshot && <img src={headshot} alt="Agent" className="w-12 h-12 rounded-xl object-cover ring-2 ring-white" />}
        </div>
      )
  }
}

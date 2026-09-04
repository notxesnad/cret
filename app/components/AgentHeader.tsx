export function renderAgentHeader(profile: any, themeOverride: string | null = null) {
  if (!profile) return null;
  const look = themeOverride || profile.pdf_look || 'look1'
  const name = profile.full_name || 'Jane Doe'
  const brokerage = profile.brokerage || 'Luxury Real Estate'
  const phone = profile.phone || '(555) 123-4567'
  const email = profile.email || 'name@example.com'
  const showHeadshot = profile.show_headshot === true && !!profile.headshot_url
  const showLogo = profile.show_logo === true && !!profile.logo_url
  const headshot = profile.headshot_url
  const logo = showLogo ? profile.logo_url : null
  const shot = profile.headshot_shape === 'circle' ? 'rounded-full' : 'rounded-none'

  switch(look) {
    case 'look1': 
      return (
        <div className="w-full bg-white border-b border-slate-100 pb-5 mb-5 flex flex-col items-center text-center px-5 pt-4">
          {logo ? (
            <img src={logo} alt="Logo" className="h-10 md:h-12 w-auto max-w-full object-contain mb-4" />
          ) : (
            <h2 className="text-sm font-black text-slate-900 tracking-tight mb-4 uppercase">{brokerage}</h2>
          )}
          <div className="flex items-center gap-4">
            {showHeadshot && <img src={headshot} alt="Agent" className={`w-12 h-12 ${shot} object-cover shadow-sm border border-slate-200`} />}
            <div className={showHeadshot ? "text-left" : "text-center"}>
              <h3 className="font-semibold text-slate-900 text-sm tracking-wide">{name}</h3>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">{phone}</p>
              <p className="text-[10px] text-slate-500 font-medium">{email}</p>
            </div>
          </div>
        </div>
      )

    case 'look2': 
      return (
        <div className="w-full bg-slate-950 text-amber-50 px-5 py-5 flex justify-between items-center mb-5 border-b border-slate-800">
          <div className="flex-1 flex flex-col justify-center">
            {logo ? (
              <img src={logo} alt="Logo" className="h-8 md:h-10 w-auto max-w-[160px] object-contain object-left mb-2 brightness-0 invert" />
            ) : (
              <span className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-2 block">{brokerage}</span>
            )}
            <h3 className="font-serif text-lg tracking-wide text-white">{name}</h3>
            <p className="text-[10px] text-slate-400 tracking-widest">{phone}</p>
            <p className="text-[10px] text-slate-400">{email}</p>
          </div>
          {showHeadshot && (
            <div className="ml-4 flex-shrink-0">
              <img src={headshot} alt="Agent" className={`w-14 h-14 ${shot} object-cover ring-2 ring-amber-500/30`} />
            </div>
          )}
        </div>
      )

    case 'look3': 
      return (
        <div className="w-full bg-teal-50/50 border-b border-teal-100 px-5 py-5 flex justify-between items-center mb-5">
          <div className="flex items-center gap-4">
            {showHeadshot && <img src={headshot} alt="Agent" className={`w-14 h-14 ${shot} object-cover shadow-sm`} />}
            <div>
              <h3 className="font-bold text-teal-950 text-lg">{name}</h3>
              <p className="text-[11px] text-teal-700 font-medium">{phone}</p>
              <p className="text-[11px] text-teal-700 font-medium">{email}</p>
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
        <div className="w-full border-t-4 border-b border-slate-900 px-5 py-5 mb-5 flex justify-between items-start text-slate-900 bg-white">
          <div className="flex-1">
            {logo && <img src={logo} alt="Logo" className="h-7 w-auto max-w-[150px] object-contain object-left mb-3 grayscale" />}
            <h3 className="font-serif text-2xl tracking-tight leading-none mb-1">{name}</h3>
            <p className="text-[9px] font-mono tracking-widest uppercase text-slate-500 mt-1">{phone} &mdash; {brokerage}</p>
            <p className="text-[9px] font-mono text-slate-500">{email}</p>
          </div>
          {showHeadshot && <img src={headshot} alt="Agent" className={`w-16 h-16 object-cover grayscale contrast-125 ${shot}`} />}
        </div>
      )

    case 'look5': 
      return (
        <div className="w-full bg-slate-50 border-b border-slate-200 px-5 py-6 flex flex-col items-center mb-5">
          {logo ? (
            <img src={logo} alt="Logo" className="h-14 md:h-16 w-auto max-w-full object-contain mb-5" />
          ) : (
            <h2 className="text-base font-black text-slate-900 tracking-tighter mb-5">{brokerage}</h2>
          )}
          <div className="w-full border-t border-slate-200 pt-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {showHeadshot && <img src={headshot} alt="Agent" className={`w-10 h-10 ${shot} object-cover`} />}
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">{name}</h3>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium text-slate-600">{phone}</p>
              <p className="text-[11px] font-medium text-slate-600">{email}</p>
            </div>
          </div>
        </div>
      )

    case 'look6': 
      return (
        <div className="w-full bg-blue-950 p-1 mb-5">
          <div className="bg-white px-5 py-4 border-2 border-blue-900/10 flex justify-between items-center">
            <div className="flex-1">
              <h3 className="font-bold text-blue-950 text-xl tracking-tight">{name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-4 h-[1px] bg-amber-500"></span>
                <p className="text-[10px] text-blue-900 uppercase font-semibold tracking-wider">{brokerage}</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">{phone}</p>
              <p className="text-[10px] text-slate-500">{email}</p>
            </div>
            <div className="flex items-center gap-4">
              {logo && <img src={logo} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" />}
              {showHeadshot && <img src={headshot} alt="Agent" className={`w-12 h-12 ${shot} object-cover shadow-sm border border-slate-100`} />}
            </div>
          </div>
        </div>
      )

    case 'look7': 
      return (
        <div className="relative w-full px-5 py-5 mb-5 overflow-hidden bg-white border-b border-slate-100">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-fuchsia-500 to-rose-500"></div>
          <div className="flex justify-between items-center pl-2">
            <div>
              {logo && <img src={logo} alt="Logo" className="h-8 w-auto max-w-[150px] object-contain object-left mb-2" />}
              <h3 className="font-black text-slate-900 text-lg">{name}</h3>
              <p className="text-[11px] font-medium text-slate-500">{phone}</p>
              <p className="text-[11px] font-medium text-slate-500">{email}</p>
            </div>
            {showHeadshot && <img src={headshot} alt="Agent" className={`w-14 h-14 ${shot} object-cover shadow-sm`} />}
          </div>
        </div>
      )

    case 'look8': 
      return (
        <div className="w-full border-b-4 border-black px-5 py-4 mb-5 bg-white flex justify-between items-center">
          <div className="flex flex-col">
            <h3 className="font-black text-black text-xl uppercase tracking-tighter">{name}</h3>
            <p className="text-[10px] font-bold text-black uppercase tracking-widest mt-1">{brokerage}</p>
            <p className="text-[10px] font-medium text-slate-600 mt-1">{phone}</p>
            <p className="text-[10px] font-medium text-slate-600">{email}</p>
          </div>
          <div className="flex items-center gap-3">
            {logo && <img src={logo} alt="Logo" className="h-8 w-auto max-w-[100px] object-contain grayscale" />}
            {showHeadshot && <img src={headshot} alt="Agent" className={`w-12 h-12 object-cover grayscale border-2 border-black ${shot}`} />}
          </div>
        </div>
      )

    case 'look9': 
      return (
        <div className="w-full bg-gradient-to-r from-orange-50 to-rose-50 border-b border-orange-100 px-5 py-5 flex justify-between items-center mb-5">
          <div className="flex items-center gap-4">
            {showHeadshot && <img src={headshot} alt="Agent" className={`w-12 h-12 ${shot} object-cover border-2 border-white shadow-sm`} />}
            <div>
              <h3 className="font-bold text-slate-900 text-base">{name}</h3>
              <p className="text-[10px] text-orange-800 font-medium uppercase tracking-wider">{brokerage}</p>
            </div>
          </div>
          <div className="text-right">
            {logo && <img src={logo} alt="Logo" className="h-9 w-auto max-w-[120px] object-contain object-right mix-blend-multiply" />}
            <p className="text-[10px] text-slate-500 font-medium mt-1">{phone}</p>
            <p className="text-[10px] text-slate-500 font-medium">{email}</p>
          </div>
        </div>
      )

    case 'look10': 
      return (
        <div className="w-full bg-slate-100/50 backdrop-blur-md border-b border-slate-200 px-5 py-4 flex justify-between items-center mb-5">
          <div className="flex flex-col justify-center">
            {logo && <img src={logo} alt="Logo" className="h-7 w-auto max-w-[140px] object-contain object-left mb-1.5" />}
            <h3 className="font-semibold text-slate-800 text-sm">{name}</h3>
            <p className="text-[10px] text-slate-500">{phone}</p>
            <p className="text-[10px] text-slate-500">{email}</p>
          </div>
          {showHeadshot && <img src={headshot} alt="Agent" className={`w-12 h-12 ${shot} object-cover ring-2 ring-white`} />}
        </div>
      )

    case 'look11':
      return (
        <div className="w-full bg-gradient-to-br from-indigo-900 to-slate-900 text-white px-5 py-6 border-l-4 border-indigo-400 mb-5 flex justify-between items-center">
          <div className="flex-1">
            <h3 className="font-black text-2xl tracking-tighter mb-1">{name}</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-0.5 bg-indigo-400"></span>
              <p className="text-[10px] uppercase tracking-widest text-indigo-200">{brokerage}</p>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">{phone}</p>
            <p className="text-[11px] text-slate-400 font-mono">{email}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {logo && <img src={logo} alt="Logo" className="h-8 w-auto max-w-[120px] object-contain brightness-0 invert opacity-90" />}
            {showHeadshot && <img src={headshot} alt="Agent" className={`w-14 h-14 object-cover ${shot} border border-indigo-500/30 shadow-sm`} />}
          </div>
        </div>
      )

    case 'look12':
      return (
        <div className="w-full bg-white border-y-2 border-slate-200 py-6 mb-5 flex items-center justify-between px-5">
          <div className="flex items-center gap-4">
            {showHeadshot && (
              <div className="relative">
                <div className="absolute inset-0 bg-rose-500 translate-x-1 translate-y-1"></div>
                <img src={headshot} alt="Agent" className={`w-16 h-16 object-cover relative z-10 grayscale ${shot}`} />
              </div>
            )}
            <div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">{name}</h3>
              <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">{brokerage}</p>
            </div>
          </div>
          <div className="text-right">
            {logo && <img src={logo} alt="Logo" className="h-10 w-auto max-w-[140px] object-contain object-right mb-1" />}
            <p className="text-[11px] text-slate-500 font-medium">{phone}</p>
            <p className="text-[11px] text-slate-500 font-medium">{email}</p>
          </div>
        </div>
      )

    case 'look13':
      return (
        <div className="w-full bg-emerald-950 px-5 py-5 mb-5 text-emerald-50 flex items-center gap-5">
          {showHeadshot && (
            <div className={`w-20 h-20 ${shot} overflow-hidden flex-shrink-0 border-2 border-emerald-800`}>
              <img src={headshot} alt="Agent" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 flex flex-col justify-center">
            {logo && <img src={logo} alt="Logo" className="h-6 w-auto max-w-[120px] object-contain object-left mb-2 brightness-0 invert opacity-70" />}
            <h3 className="text-xl font-bold text-white leading-none mb-1.5">{name}</h3>
            <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mb-1">{brokerage}</p>
            <p className="text-[11px] text-emerald-200/70">{phone}</p>
            <p className="text-[11px] text-emerald-200/70">{email}</p>
          </div>
        </div>
      )

    case 'look14':
      return (
        <div className="w-full bg-stone-100 border-b border-stone-200 p-1 mb-5">
          <div className="border border-stone-300 px-5 py-4 flex justify-between items-center bg-white">
            <div className="flex items-center gap-4">
              {showHeadshot && <img src={headshot} alt="Agent" className={`w-14 h-14 object-cover ${shot} shadow-sm`} />}
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">{name}</h3>
                <p className="text-[10px] text-stone-500">{phone}</p>
                <p className="text-[10px] text-stone-500">{email}</p>
              </div>
            </div>
            <div className="flex flex-col items-end border-l border-stone-200 pl-4">
              {logo ? (
                <img src={logo} alt="Logo" className="h-8 w-auto max-w-[120px] object-contain object-right sepia opacity-80" />
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-700">{brokerage}</span>
              )}
            </div>
          </div>
        </div>
      )

    case 'look15':
      return (
        <div className="relative w-full mb-5 bg-slate-900 px-5 py-6 overflow-hidden flex items-center justify-between text-white">
          <div className="absolute right-0 top-0 w-32 h-32 bg-sky-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4"></div>
          <div className="relative z-10 flex-1">
            <h3 className="text-2xl font-black tracking-tight mb-0.5">{name}</h3>
            <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold mb-2">{brokerage}</p>
            <p className="text-xs text-slate-400">{phone}</p>
            <p className="text-xs text-slate-400">{email}</p>
          </div>
          <div className="relative z-10 flex gap-4 items-center">
            {logo && <img src={logo} alt="Logo" className="h-9 w-auto max-w-[100px] object-contain brightness-0 invert" />}
            {showHeadshot && (
              <img src={headshot} alt="Agent" className={`w-14 h-14 object-cover ${shot} ring-1 ring-white/20`} />
            )}
          </div>
        </div>
      )

    case 'look16':
      return (
        <div className="w-full bg-white border-b-4 border-amber-400 pb-4 mb-5 flex justify-between items-end px-5 pt-4">
          <div className="flex flex-col">
            {logo && <img src={logo} alt="Logo" className="h-8 w-auto max-w-[140px] object-contain object-left mb-3" />}
            <h3 className="font-bold text-slate-900 text-xl leading-none">{name}</h3>
            <p className="text-[11px] text-slate-500 mt-1">{phone}</p>
            <p className="text-[11px] text-slate-500">{email}</p>
          </div>
          {showHeadshot && (
            <div className={`w-16 h-16 bg-slate-100 ${shot} overflow-hidden shadow-inner border border-slate-200 flex-shrink-0`}>
              <img src={headshot} alt="Agent" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )

    case 'look17':
      return (
        <div className="flex items-stretch w-full bg-white border-b border-slate-200 overflow-hidden mb-5">
          {showHeadshot && (
            <div className="w-24 flex-shrink-0 flex items-center justify-center p-2">
              <img src={headshot} alt="Agent" className={`w-20 h-20 object-cover ${shot}`} />
            </div>
          )}
          <div className="flex-1 p-4 flex flex-col justify-center relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{name}</h3>
            <p className="text-[10px] text-slate-500 font-medium mb-2">{phone}</p>
            <p className="text-[10px] text-slate-500 font-medium mb-2">{email}</p>
            {logo ? (
              <img src={logo} alt="Logo" className="h-6 w-auto max-w-[120px] object-contain object-left mt-auto" />
            ) : (
              <span className="text-[10px] font-bold text-cyan-700 uppercase">{brokerage}</span>
            )}
          </div>
        </div>
      )

    case 'look18':
      return (
        <div className="w-full bg-slate-50 px-5 py-6 mb-5 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-4">
            {showHeadshot && (
              <div className={`w-14 h-14 ${shot} overflow-hidden p-0.5 bg-gradient-to-tr from-fuchsia-500 to-orange-400`}>
                <img src={headshot} alt="Agent" className={`w-full h-full object-cover ${shot} border-2 border-white`} />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 text-base">{name}</h3>
              <p className="text-[11px] text-slate-600">{phone}</p>
              <p className="text-[11px] text-slate-600">{email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end text-right">
            {logo ? (
              <img src={logo} alt="Logo" className="h-8 w-auto max-w-[130px] object-contain object-right mb-1" />
            ) : (
              <span className="font-bold text-slate-800 text-sm">{brokerage}</span>
            )}
          </div>
        </div>
      )

    case 'look19':
      return (
        <div className="w-full border-b-2 border-slate-900 px-5 pt-5 pb-4 mb-5 bg-white relative">
          <div className="absolute top-0 left-4 -translate-y-1/2 bg-white px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{brokerage}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div>
              <h3 className="font-serif text-2xl text-slate-900">{name}</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">{phone}</p>
              <p className="text-xs text-slate-500 font-mono">{email}</p>
            </div>
            <div className="flex items-center gap-3">
              {logo && <img src={logo} alt="Logo" className="h-8 w-auto max-w-[100px] object-contain" />}
              {showHeadshot && <img src={headshot} alt="Agent" className={`w-14 h-14 object-cover border border-slate-900 p-0.5 ${shot}`} />}
            </div>
          </div>
        </div>
      )

    case 'look20':
      return (
        <div className="w-full bg-slate-900 px-5 py-5 mb-5 flex items-center justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10">
            <h3 className="font-bold text-xl mb-1">{name}</h3>
            <div className="inline-block bg-white/10 rounded px-2 py-0.5 mb-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-white/90">{brokerage}</p>
            </div>
            <p className="text-xs text-white/60">{phone}</p>
            <p className="text-xs text-white/60">{email}</p>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            {logo && <img src={logo} alt="Logo" className="h-8 w-auto max-w-[120px] object-contain brightness-0 invert" />}
            {showHeadshot && (
              <img src={headshot} alt="Agent" className={`w-14 h-14 object-cover ${shot} shadow-md`} />
            )}
          </div>
        </div>
      )

    case 'custom':
    default:
      if (look === 'custom' && profile.custom_header_url) {
        return (
          <div className="mb-5 w-full">
            <img src={profile.custom_header_url} alt="Custom Header" className="w-full h-auto object-cover" />
          </div>
        )
      }
      if (look === 'custom') {
        return (
          <div className="w-full px-5 py-8 mb-5 bg-slate-100 text-center text-slate-500 border-b-2 border-dashed border-slate-300">
            <p className="text-sm font-bold uppercase tracking-wider mb-1">No Custom Header Uploaded</p>
            <p className="text-base">Upload a Canva image in the Upload step to use this layout.</p>
          </div>
        )
      }
      // Fallback to look10
      return (
        <div className="w-full bg-slate-100/50 backdrop-blur-md border-b border-slate-200 px-5 py-4 flex justify-between items-center mb-5">
          <div className="flex flex-col justify-center">
            {logo && <img src={logo} alt="Logo" className="h-7 w-auto max-w-[140px] object-contain object-left mb-1.5" />}
            <h3 className="font-semibold text-slate-800 text-sm">{name}</h3>
            <p className="text-[10px] text-slate-500">{phone}</p>
            <p className="text-[10px] text-slate-500">{email}</p>
          </div>
          {showHeadshot && <img src={headshot} alt="Agent" className={`w-12 h-12 ${shot} object-cover ring-2 ring-white`} />}
        </div>
      )
  }
}

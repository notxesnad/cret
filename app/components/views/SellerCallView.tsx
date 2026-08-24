export function SellerCallView({ showCustomModal, listings, signedIn }: { showCustomModal: (msg: string, requireAuth?: boolean) => void, listings: any[], signedIn?: boolean }) {
  return (
    <div id="view-sellercall" className="app-view active bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
      <div>
        <span className="text-xs font-bold tracking-widest text-orange-500 uppercase font-sellercall">Instant Prep Sheet</span>
        <h1 className="text-2xl font-black mt-1">Seller Survival Guide</h1>
        <p className="text-base text-slate-400 mt-1">Get your talking points ready before you pick up.</p>
      </div>
      
      <div className="relative">
        <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer">
          {listings.length > 0 ? (
            listings.map(listing => (
              <option key={listing.id}>{listing.address}</option>
            ))
          ) : (
            <>
              <option>124 Ocean Blvd</option>
              <option>88 Palm Lane</option>
              <option>456 Mountain View Rd</option>
            </>
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Days on Mkt</div>
          <div className="text-xl font-black text-white">42</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Showings</div>
          <div className="text-xl font-black text-white">3 <span className="text-xs text-slate-400 font-normal block -mt-1">this wk</span></div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Feedback</div>
          <div className="text-lg font-black text-rose-400">Price</div>
        </div>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 space-y-2 relative overflow-hidden">
        <div className="absolute -right-2 -top-2 opacity-10 text-6xl">💬</div>
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest relative z-10">What to say:</h3>
        <p className="text-sm text-slate-300 italic relative z-10 leading-relaxed">&quot;Hey Bob! I was just reviewing your file. We had 3 showings this week, but the feedback keeps pointing to the price. We also had a new listing hit the market nearby for $10k less. Let&apos;s discuss a strategic adjustment so we don&apos;t lose momentum.&quot;</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent Comps (Last 7 Days)</h3>
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex justify-between items-center">
          <div>
            <div className="text-[9px] font-black text-rose-400 bg-rose-400/20 px-2 py-0.5 rounded inline-block mb-1 uppercase tracking-wider">New</div>
            <div className="text-xs font-bold text-white">125 Ocean Dr</div>
          </div>
          <div className="text-sm font-black text-white">$1,150,000</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex justify-between items-center">
          <div>
            <div className="text-[9px] font-black text-emerald-400 bg-emerald-400/20 px-2 py-0.5 rounded inline-block mb-1 uppercase tracking-wider">Pending</div>
            <div className="text-xs font-bold text-white">90 Palm Lane</div>
          </div>
          <div className="text-sm font-black text-white">$1,225,000</div>
        </div>
      </div>

      <button onClick={() => signedIn ? showCustomModal('Cheat sheet texted to your phone for easy reading during the call!') : showCustomModal('', true)} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black py-4 rounded-xl transition shadow-lg mt-2 flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
        Text Me This Cheat Sheet
      </button>
    </div>
  )
}

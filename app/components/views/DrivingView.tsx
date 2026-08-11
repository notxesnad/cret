export function DrivingView() {
  return (
    <div id="view-driving" className="app-view active space-y-4">
      <div className="text-center">
        <span className="text-xs font-bold tracking-widest text-rose-400 uppercase font-driving">Tour Itinerary</span>
        <h1 className="text-xl font-black mt-1">Saturday Buyer Tour</h1>
        <p className="text-xs text-slate-400">3 Stops • Optimized Route</p>
      </div>
      <div className="space-y-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-slate-600 transition cursor-default">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">STOP #1</span>
              <h3 className="font-bold mt-1 text-sm">124 Ocean Blvd</h3>
            </div>
            <div className="text-right font-black text-emerald-400 text-sm">$1,250,000</div>
          </div>
          <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="block bg-slate-800 text-center py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition">📍 Open in Google Maps</a>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-slate-600 transition cursor-default">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">STOP #2</span>
              <h3 className="font-bold mt-1 text-sm">88 Palm Lane</h3>
            </div>
            <div className="text-right font-black text-emerald-400 text-sm">$1,150,000</div>
          </div>
          <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="block bg-slate-800 text-center py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition">📍 Open in Google Maps</a>
        </div>
      </div>
    </div>
  )
}

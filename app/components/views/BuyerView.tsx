export function BuyerView({ showCustomModal, signedIn }: { showCustomModal: (msg: string, requireAuth?: boolean) => void, signedIn?: boolean }) {
  return (
    <div id="view-buyer" className="app-view active bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
      <div>
        <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase font-buyer">Buyer Matrix</span>
        <h1 className="text-xl font-black mt-1">Compare Property #1 vs #2</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-800 p-3 rounded-2xl space-y-2 border border-cyan-500/30">
          <div className="font-bold text-cyan-400">124 Ocean Blvd</div>
          <div>Price: <span className="font-bold text-white">$1.25M</span></div>
          <div>Yard: <span className="font-bold text-white">Huge</span></div>
          <div>Kitchen: <span className="font-bold text-white">Needs reno</span></div>
        </div>
        <div className="bg-slate-800 p-3 rounded-2xl space-y-2 border border-slate-700 hover:border-slate-600 transition cursor-default">
          <div className="font-bold text-slate-300">88 Palm Lane</div>
          <div>Price: <span className="font-bold text-white">$1.15M</span></div>
          <div>Yard: <span className="font-bold text-white">Small</span></div>
          <div>Kitchen: <span className="font-bold text-white">Modern</span></div>
        </div>
      </div>
      <button onClick={() => signedIn ? showCustomModal('Comparison card texted to buyer!') : showCustomModal('', true)} className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-4 rounded-xl transition shadow-lg mt-2">
        📲 Text Side-by-Side to Buyer
      </button>
    </div>
  )
}

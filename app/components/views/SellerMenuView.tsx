import { ToolTile } from '@/app/components/ToolTile'

export function SellerMenuView({ switchView }: { switchView: (view: string) => void }) {
  return (
    <div id="view-seller" className="app-view active space-y-4">
      <div className="text-center mb-6">
        <span className="text-xs font-bold tracking-widest text-amber-500 uppercase font-seller">Seller Tools</span>
        <h1 className="text-2xl font-black mt-1">Make My Seller Happy</h1>
        <p className="text-base text-slate-400 mt-1">Net sheets, trackers, and instant reports.</p>
      </div>

      <ToolTile
        onClick={() => switchView('sellertracker')}
        className="group relative bg-amber-500 hover:bg-amber-400 text-slate-950 p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden"
      >
        <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">📋</div>
        <span className="text-xs font-bold tracking-wider uppercase opacity-70">Keep them in the loop</span>
        <h2 className="font-seller text-2xl md:text-3xl mt-1 font-black">Seller Tracking Report</h2>
      </ToolTile>

      <ToolTile
        onClick={() => switchView('netsheet')}
        className="group relative bg-amber-100 hover:bg-white text-slate-900 p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden border-2 border-transparent hover:border-amber-300"
      >
        <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:-rotate-6">💰</div>
        <span className="text-xs font-bold tracking-wider uppercase opacity-70">Step-by-step seller estimate</span>
        <h2 className="font-seller text-2xl md:text-3xl mt-1 font-black">Seller Net Sheet</h2>
      </ToolTile>
      
    </div>
  )
}

'use client'

import { ToolTile } from '@/app/components/ToolTile'

export function HomesHubView({ switchView }: { switchView: (view: string) => void }) {
  return (
    <div id="view-myhomes" className="app-view active space-y-4">
      <div className="text-center mb-6">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Your inventory</span>
        <h1 className="text-2xl font-black mt-1">My Homes</h1>
        <p className="text-base text-slate-400 mt-1">Seller listings in one list. Homes you’re showing buyers in the other.</p>
      </div>

      <ToolTile
        onClick={() => switchView('mylistings')}
        className="group relative bg-amber-500 hover:bg-amber-400 text-slate-950 p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden"
      >
        <span className="text-xs font-bold tracking-wider uppercase opacity-70">Seller inventory</span>
        <h2 className="text-2xl md:text-3xl mt-1 font-black">My Listings</h2>
      </ToolTile>

      <ToolTile
        onClick={() => switchView('myshowing')}
        className="group relative bg-rose-600 hover:bg-rose-500 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden"
      >
        <span className="text-xs font-bold tracking-wider uppercase opacity-70">Tours and buyer tools</span>
        <h2 className="text-2xl md:text-3xl mt-1 font-black">Homes I’m Showing</h2>
      </ToolTile>
    </div>
  )
}

interface MoneyStuffViewProps {
  netData: any;
  handleNetInputChange: (field: string, val: string) => void;
  calculatedNetProceeds: number;
  switchView: (view: string) => void;
  showCustomModal: (msg: string, requireAuth?: boolean) => void;
  signedIn?: boolean;
}

export function MoneyStuffView({
  netData,
  handleNetInputChange,
  calculatedNetProceeds,
  switchView,
  showCustomModal,
  signedIn
}: MoneyStuffViewProps) {
  return (
    <div id="view-money" className="app-view active bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
      <div>
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase font-money text-lg">Money Stuff</span>
        <h1 className="text-2xl font-black mt-1">60-Second Net Sheet</h1>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Sale Price ($)</label>
          <input type="number" value={netData.salePrice} onChange={(e) => handleNetInputChange('salePrice', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Mortgage Payoff ($)</label>
          <input type="number" value={netData.mortgagePayoff} onChange={(e) => handleNetInputChange('mortgagePayoff', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Commission (%)</label>
            <input type="number" step="0.5" value={netData.agentCommissionPct} onChange={(e) => handleNetInputChange('agentCommissionPct', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Transfer Tax (%)</label>
            <input type="number" step="0.25" value={netData.transferTaxPct} onChange={(e) => handleNetInputChange('transferTaxPct', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Title &amp; Escrow Fees ($)</label>
          <input type="number" value={netData.titleEscrowFee} onChange={(e) => handleNetInputChange('titleEscrowFee', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors" />
        </div>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Estimated Net Proceeds</span>
        <div className="text-4xl font-black text-emerald-400">${calculatedNetProceeds > 0 ? calculatedNetProceeds.toLocaleString('en-US', {maximumFractionDigits: 0}) : 0}</div>
      </div>

      <button onClick={() => switchView('seller')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition text-xs border border-slate-700">
        ➕ Add More Detailed Fields
      </button>

      <button onClick={() => signedIn ? showCustomModal('Pro Feature Unlocked: Branded PDF and SMS link sent!') : showCustomModal('', true)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition shadow-lg text-xs">
        📱 Generate Branded PDF / SMS
      </button>
    </div>
  )
}

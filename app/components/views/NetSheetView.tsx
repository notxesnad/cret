import { useState } from 'react'

interface NetSheetViewProps {
  netData: any;
  handleNetInputChange: (field: string, val: string) => void;
  calculatedNetProceeds: number;
  activeFields: any;
  toggleFieldCheckbox: (fieldKey: string) => void;
  showCustomModal: (msg: string) => void;
  renderAgentHeader: () => React.ReactNode;
  switchView: (viewId: string) => void;
}

export function NetSheetView({
  netData,
  handleNetInputChange,
  calculatedNetProceeds,
  activeFields,
  toggleFieldCheckbox,
  showCustomModal,
  renderAgentHeader,
  switchView
}: NetSheetViewProps) {
  const [netSheetView, setNetSheetView] = useState<string>('calc')

  return (
    <div id="view-netsheet" className="app-view active bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-5">
      {/* Back Button */}
      <button 
        onClick={() => switchView('seller')}
        className="flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
        Back to Seller Tools
      </button>

      {netSheetView === 'calc' ? (
        <>
          <div className="-mx-6 -mt-6 [&>*]:mb-0">
            {renderAgentHeader()}
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">Customizable Seller Net Sheet</h2>
              <p className="text-[11px] text-slate-500">Core figures plus any active detailed line items.</p>
            </div>
            <button 
              onClick={() => setNetSheetView('checkboxes')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow"
            >
              ➕ Add / Edit Fields
            </button>
          </div>

          {/* Core Basic Fields Inputs */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Sale Price ($)</label>
                <input type="number" value={netData.salePrice} onChange={(e) => handleNetInputChange('salePrice', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-900" />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Mortgage Payoff ($)</label>
                <input type="number" value={netData.mortgagePayoff} onChange={(e) => handleNetInputChange('mortgagePayoff', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-900" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Commission %</label>
                <input type="number" step="0.5" value={netData.agentCommissionPct} onChange={(e) => handleNetInputChange('agentCommissionPct', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 font-bold text-slate-900" />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Transfer Tax %</label>
                <input type="number" step="0.25" value={netData.transferTaxPct} onChange={(e) => handleNetInputChange('transferTaxPct', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 font-bold text-slate-900" />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Title &amp; Escrow ($)</label>
                <input type="number" value={netData.titleEscrowFee} onChange={(e) => handleNetInputChange('titleEscrowFee', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 font-bold text-slate-900" />
              </div>
            </div>

            {/* Render any actively checked additional inputs */}
            {(Object.values(activeFields).some(v => v === true)) && (
              <div className="pt-3 mt-3 border-t border-slate-200">
                <p className="text-[9px] uppercase font-bold text-slate-400 mb-2">Additional Line Items</p>
                <div className="grid grid-cols-2 gap-3">
                  {activeFields.sellerConcessions && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Seller Concessions ($)</label><input type="number" value={netData.sellerConcessions} onChange={(e) => handleNetInputChange('sellerConcessions', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.personalProperty && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Personal Property Value ($)</label><input type="number" value={netData.personalProperty} onChange={(e) => handleNetInputChange('personalProperty', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.secondMortgage && <div><label className="text-[10px] font-bold text-slate-500 uppercase">2nd Mortgage / HELOC ($)</label><input type="number" value={netData.secondMortgage} onChange={(e) => handleNetInputChange('secondMortgage', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.prepaymentPenalties && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Prepayment Penalties ($)</label><input type="number" value={netData.prepaymentPenalties} onChange={(e) => handleNetInputChange('prepaymentPenalties', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.propertyLiens && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Outstanding Property Liens ($)</label><input type="number" value={netData.propertyLiens} onChange={(e) => handleNetInputChange('propertyLiens', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.transactionCoordFees && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Transaction Coordination / Admin Fee ($)</label><input type="number" value={netData.transactionCoordFees} onChange={(e) => handleNetInputChange('transactionCoordFees', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.attorneyFees && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Attorney Fees ($)</label><input type="number" value={netData.attorneyFees} onChange={(e) => handleNetInputChange('attorneyFees', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.recordingFees && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Recording Fees ($)</label><input type="number" value={netData.recordingFees} onChange={(e) => handleNetInputChange('recordingFees', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.ownersTitleInsurance && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Owner&apos;s Title Insurance Policy ($)</label><input type="number" value={netData.ownersTitleInsurance} onChange={(e) => handleNetInputChange('ownersTitleInsurance', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.courierWireFees && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Courier / Wire Fees ($)</label><input type="number" value={netData.courierWireFees} onChange={(e) => handleNetInputChange('courierWireFees', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.propertyTaxesPrarated && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Prorated Property Taxes ($)</label><input type="number" value={netData.propertyTaxesPrarated} onChange={(e) => handleNetInputChange('propertyTaxesPrarated', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.hoaDues && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Prorated HOA Dues ($)</label><input type="number" value={netData.hoaDues} onChange={(e) => handleNetInputChange('hoaDues', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.hoaEstoppel && <div><label className="text-[10px] font-bold text-slate-500 uppercase">HOA Estoppel / Transfer Fee ($)</label><input type="number" value={netData.hoaEstoppel} onChange={(e) => handleNetInputChange('hoaEstoppel', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.specialAssessments && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Special Assessments ($)</label><input type="number" value={netData.specialAssessments} onChange={(e) => handleNetInputChange('specialAssessments', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.utilitiesProration && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Utilities Proration ($)</label><input type="number" value={netData.utilitiesProration} onChange={(e) => handleNetInputChange('utilitiesProration', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.homeWarranty && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Home Warranty ($)</label><input type="number" value={netData.homeWarranty} onChange={(e) => handleNetInputChange('homeWarranty', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.stagingPhotography && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Staging &amp; Photography ($)</label><input type="number" value={netData.stagingPhotography} onChange={(e) => handleNetInputChange('stagingPhotography', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  {activeFields.repairCredits && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Repair Credits ($)</label><input type="number" value={netData.repairCredits} onChange={(e) => handleNetInputChange('repairCredits', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                </div>
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-2xl p-5 text-sm font-bold bg-white">
            <div className="flex justify-between py-1 text-slate-900">
              <span>Sale Price</span>
              <span>${Number(netData.salePrice).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 text-rose-600">
              <span>Mortgage Payoff</span>
              <span>-${Number(netData.mortgagePayoff).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 text-rose-600">
              <span>Agent Commission</span>
              <span>-${(netData.salePrice * (netData.agentCommissionPct/100)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 text-rose-600">
              <span>Transfer Tax</span>
              <span>-${(netData.salePrice * (netData.transferTaxPct/100)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 text-rose-600">
              <span>Title &amp; Escrow Fees</span>
              <span>-${Number(netData.titleEscrowFee).toLocaleString()}</span>
            </div>
            
            {/* Dynamic Deductions List rendered here */}
            {Object.keys(activeFields).map(key => {
              if (!activeFields[key]) return null
              if (key === 'sellerConcessions') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Seller Concessions</span><span>-${Number(netData.sellerConcessions).toLocaleString()}</span></div>
              if (key === 'personalProperty') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Personal Property</span><span>-${Number(netData.personalProperty).toLocaleString()}</span></div>
              if (key === 'secondMortgage') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>2nd Mortgage Payoff</span><span>-${Number(netData.secondMortgage).toLocaleString()}</span></div>
              if (key === 'prepaymentPenalties') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Prepayment Penalties</span><span>-${Number(netData.prepaymentPenalties).toLocaleString()}</span></div>
              if (key === 'propertyLiens') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Outstanding Liens</span><span>-${Number(netData.propertyLiens).toLocaleString()}</span></div>
              if (key === 'transactionCoordFees') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Admin / TC Fees</span><span>-${Number(netData.transactionCoordFees).toLocaleString()}</span></div>
              if (key === 'attorneyFees') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Attorney Fees</span><span>-${Number(netData.attorneyFees).toLocaleString()}</span></div>
              if (key === 'recordingFees') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Recording Fees</span><span>-${Number(netData.recordingFees).toLocaleString()}</span></div>
              if (key === 'ownersTitleInsurance') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Owner&apos;s Title Policy</span><span>-${Number(netData.ownersTitleInsurance).toLocaleString()}</span></div>
              if (key === 'courierWireFees') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Courier & Wire Fees</span><span>-${Number(netData.courierWireFees).toLocaleString()}</span></div>
              if (key === 'propertyTaxesPrarated') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Prorated Taxes</span><span>-${Number(netData.propertyTaxesPrarated).toLocaleString()}</span></div>
              if (key === 'hoaDues') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>HOA Dues</span><span>-${Number(netData.hoaDues).toLocaleString()}</span></div>
              if (key === 'hoaEstoppel') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>HOA Estoppel Fee</span><span>-${Number(netData.hoaEstoppel).toLocaleString()}</span></div>
              if (key === 'specialAssessments') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Special Assessments</span><span>-${Number(netData.specialAssessments).toLocaleString()}</span></div>
              if (key === 'utilitiesProration') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Utilities Proration</span><span>-${Number(netData.utilitiesProration).toLocaleString()}</span></div>
              if (key === 'homeWarranty') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Home Warranty</span><span>-${Number(netData.homeWarranty).toLocaleString()}</span></div>
              if (key === 'stagingPhotography') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Staging & Photo</span><span>-${Number(netData.stagingPhotography).toLocaleString()}</span></div>
              if (key === 'repairCredits') return <div key={key} className="flex justify-between py-1 text-rose-600"><span>Repair Credits</span><span>-${Number(netData.repairCredits).toLocaleString()}</span></div>
              return null
            })}
            
            <div className="border-t-2 border-slate-900 mt-3 pt-3 flex justify-between text-xl font-black text-emerald-600">
              <span>Estimated Net</span>
              <span>${calculatedNetProceeds.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
            </div>
          </div>
          <button onClick={() => showCustomModal('Pro Feature Unlocked: Branded PDF and SMS link sent!')} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl transition shadow-lg mt-2 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            Generate Seller PDF 
          </button>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-slate-900">Configure Fields</h2>
            <button onClick={() => setNetSheetView('calc')} className="text-sm font-bold text-indigo-600 hover:text-indigo-500">Done</button>
          </div>
          <p className="text-base text-slate-500 mb-6">Select which line items should appear in your Net Sheet layout.</p>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            
            {/* Hardcoded field checkboxes based on existing state */}
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Property & Loan</h3>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Seller Concessions</span>
                <input type="checkbox" checked={activeFields.sellerConcessions} onChange={() => toggleFieldCheckbox('sellerConcessions')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Personal Property</span>
                <input type="checkbox" checked={activeFields.personalProperty} onChange={() => toggleFieldCheckbox('personalProperty')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">2nd Mortgage / HELOC</span>
                <input type="checkbox" checked={activeFields.secondMortgage} onChange={() => toggleFieldCheckbox('secondMortgage')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Prepayment Penalties</span>
                <input type="checkbox" checked={activeFields.prepaymentPenalties} onChange={() => toggleFieldCheckbox('prepaymentPenalties')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Outstanding Liens</span>
                <input type="checkbox" checked={activeFields.propertyLiens} onChange={() => toggleFieldCheckbox('propertyLiens')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
            </div>

            <div className="space-y-2 border-b border-slate-100 pb-4">
              <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fees & Taxes</h3>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Admin / TC Fees</span>
                <input type="checkbox" checked={activeFields.transactionCoordFees} onChange={() => toggleFieldCheckbox('transactionCoordFees')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Attorney Fees</span>
                <input type="checkbox" checked={activeFields.attorneyFees} onChange={() => toggleFieldCheckbox('attorneyFees')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Recording Fees</span>
                <input type="checkbox" checked={activeFields.recordingFees} onChange={() => toggleFieldCheckbox('recordingFees')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Owner&apos;s Title Policy</span>
                <input type="checkbox" checked={activeFields.ownersTitleInsurance} onChange={() => toggleFieldCheckbox('ownersTitleInsurance')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Courier / Wire Fees</span>
                <input type="checkbox" checked={activeFields.courierWireFees} onChange={() => toggleFieldCheckbox('courierWireFees')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Prorated Taxes</span>
                <input type="checkbox" checked={activeFields.propertyTaxesPrarated} onChange={() => toggleFieldCheckbox('propertyTaxesPrarated')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
            </div>

            <div className="space-y-2 pb-4">
              <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">HOA & Miscellaneous</h3>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">HOA Dues</span>
                <input type="checkbox" checked={activeFields.hoaDues} onChange={() => toggleFieldCheckbox('hoaDues')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">HOA Estoppel Fee</span>
                <input type="checkbox" checked={activeFields.hoaEstoppel} onChange={() => toggleFieldCheckbox('hoaEstoppel')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Special Assessments</span>
                <input type="checkbox" checked={activeFields.specialAssessments} onChange={() => toggleFieldCheckbox('specialAssessments')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Utilities Proration</span>
                <input type="checkbox" checked={activeFields.utilitiesProration} onChange={() => toggleFieldCheckbox('utilitiesProration')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Home Warranty</span>
                <input type="checkbox" checked={activeFields.homeWarranty} onChange={() => toggleFieldCheckbox('homeWarranty')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Staging & Photo</span>
                <input type="checkbox" checked={activeFields.stagingPhotography} onChange={() => toggleFieldCheckbox('stagingPhotography')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
              <label className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300">
                <span className="text-sm font-bold text-slate-700">Repair Credits</span>
                <input type="checkbox" checked={activeFields.repairCredits} onChange={() => toggleFieldCheckbox('repairCredits')} className="w-4 h-4 rounded text-emerald-600" />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

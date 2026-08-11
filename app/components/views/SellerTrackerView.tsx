import { useState } from 'react'

interface Activity {
  id: string;
  label: string;
  date: string;
}

interface SellerTrackerViewProps {
  trackerAddress: string;
  setTrackerAddress: (addr: string) => void;
  trackerActivities: Activity[];
  setTrackerActivities: (updater: (prev: Activity[]) => Activity[]) => void;
  showCustomModal: (msg: string) => void;
  switchView: (view: string) => void;
}

const PRESET_ACTIVITIES = [
  "📸 Professional Photography Completed",
  "🌐 Listed in the MLS",
  "🚀 Syndicated to Zillow, Trulia, Realtor.com",
  "📮 Just Listed Postcards Mailed",
  "📱 Social Media Blast (FB/IG)",
  "🥂 Hosted Broker's Open",
  "🏡 Hosted Public Open House",
  "🛑 Yard Sign & Lockbox Installed",
  "💻 Property Website Launched",
  "📧 Sent Email Blast to Agent Network",
  "📞 Followed up with Showing Agents",
  "🤝 Received & Negotiated Offer"
];

export function SellerTrackerView({
  trackerAddress,
  setTrackerAddress,
  trackerActivities,
  setTrackerActivities,
  showCustomModal,
  switchView
}: SellerTrackerViewProps) {
  const [customActivity, setCustomActivity] = useState('')

  const handleAddActivity = (label: string) => {
    if (!label.trim()) return;
    
    // Add to the top of the list
    setTrackerActivities(prev => [
      {
        id: Math.random().toString(36).substr(2, 9),
        label,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      },
      ...prev
    ])
    setCustomActivity('')
  }

  const handleRemoveActivity = (id: string) => {
    setTrackerActivities(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div id="view-sellertracker" className="app-view active bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      
      {/* Header & Back Button */}
      <div className="space-y-4">
        <button 
          onClick={() => switchView('seller')}
          className="flex items-center text-xs font-bold text-slate-500 hover:text-slate-300 transition"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          Back to Seller Tools
        </button>
        <div>
          <span className="text-xs font-bold tracking-widest text-amber-500 uppercase font-seller">Seller Tracking Report</span>
          <h1 className="text-2xl font-black mt-1">Log &amp; Share Updates</h1>
        </div>
      </div>

      {/* Property Address */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Property Address</label>
        <input 
          type="text" 
          placeholder="e.g. 124 Ocean Blvd"
          value={trackerAddress}
          onChange={(e) => setTrackerAddress(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-amber-500 transition-colors" 
        />
      </div>

      {/* Add Activity Section */}
      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
        <h3 className="text-sm font-bold text-white mb-3">Add a New Activity</h3>
        
        {/* Custom Input */}
        <div className="flex gap-2 mb-4">
          <input 
            type="text"
            placeholder="Custom activity... (e.g. Sent Email to [ ])"
            value={customActivity}
            onChange={(e) => setCustomActivity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddActivity(customActivity)}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
          />
          <button 
            onClick={() => handleAddActivity(customActivity)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition"
          >
            Add
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESET_ACTIVITIES.map(preset => (
            <button 
              key={preset}
              onClick={() => handleAddActivity(preset)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition"
            >
              + {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Logged Activities */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white">Activity Log</h3>
        {trackerActivities.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-4">No activities logged yet. Tap an activity above to add one!</p>
        ) : (
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
            {trackerActivities.map((act) => (
              <div key={act.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex justify-between items-start group">
                <div>
                  <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded inline-block mb-1">{act.date}</span>
                  <p className="text-sm font-bold text-white leading-tight">{act.label}</p>
                </div>
                <button 
                  onClick={() => handleRemoveActivity(act.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 opacity-50 group-hover:opacity-100 transition"
                  title="Remove activity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-3 border-t border-slate-800">
        <button 
          onClick={() => showCustomModal('Tracker PDF generated & branded successfully!')} 
          className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          Create Branded PDF
        </button>
        <button 
          onClick={() => showCustomModal('Link generated! Text this directly to your seller.')} 
          className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
          Create Link to Send
        </button>
      </div>

    </div>
  )
}

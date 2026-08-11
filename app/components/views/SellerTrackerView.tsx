import { useState } from 'react'

export interface Activity {
  id: string;
  label: string;
  date: string;
}

export interface Listing {
  id: string;
  address: string;
  activities: Activity[];
}

interface SellerTrackerViewProps {
  listings: Listing[];
  updateListings: (updater: (prev: Listing[]) => Listing[]) => void;
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
  listings,
  updateListings,
  showCustomModal,
  switchView
}: SellerTrackerViewProps) {
  const [step, setStep] = useState(1) // 1: Listings, 2: Activities
  const [activeListingId, setActiveListingId] = useState<string | null>(null)
  const [customActivity, setCustomActivity] = useState('')

  const activeListing = listings.find(l => l.id === activeListingId)

  const handleAddListing = () => {
    const address = prompt("Enter the new listing address:")
    if (address && address.trim()) {
      const newListing: Listing = {
        id: Math.random().toString(36).substr(2, 9),
        address: address.trim(),
        activities: []
      }
      updateListings(prev => [newListing, ...prev])
      setActiveListingId(newListing.id)
      setStep(2)
    }
  }

  const handleOpenListing = (id: string) => {
    setActiveListingId(id)
    setStep(2)
  }

  const handleAddActivity = (label: string) => {
    if (!label.trim() || !activeListingId) return;
    
    updateListings(prev => prev.map(listing => {
      if (listing.id === activeListingId) {
        return {
          ...listing,
          activities: [
            {
              id: Math.random().toString(36).substr(2, 9),
              label,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            },
            ...listing.activities
          ]
        }
      }
      return listing
    }))
    setCustomActivity('')
  }

  const handleRemoveActivity = (activityId: string) => {
    if (!activeListingId) return;
    updateListings(prev => prev.map(listing => {
      if (listing.id === activeListingId) {
        return {
          ...listing,
          activities: listing.activities.filter(a => a.id !== activityId)
        }
      }
      return listing
    }))
  }

  return (
    <div id="view-sellertracker" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50">
      
      {/* Header */}
      <div className="flex-none h-[72px] flex items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
        {step === 2 ? (
          <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">Back</span>
          </button>
        ) : (
          <button onClick={() => switchView('seller')} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">Close</span>
          </button>
        )}
        
        <div className="flex-1 mx-4 bg-slate-800 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-amber-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / 2) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 relative h-[calc(100vh-72px)]">
        <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out h-full" style={{ width: '200%', transform: step === 1 ? 'translateX(0%)' : 'translateX(-50%)' }}>
            
          {/* --- STEP 1: Listings --- */}
          <div className="w-[50%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar pb-32">
            <div className="text-center mb-8">
              <span className="text-xs font-bold tracking-widest text-amber-500 uppercase font-seller">Tracker Report</span>
              <h3 className="text-2xl font-black text-white mt-1">My Active Listings</h3>
            </div>

            <button 
              onClick={handleAddListing}
              className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Add My Listing
            </button>

            <div className="space-y-3">
              {listings.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <div className="text-4xl mb-3 opacity-50">🏡</div>
                  <p className="text-sm text-slate-400 font-medium">You don&apos;t have any listings yet.<br/>Click above to add your first one!</p>
                </div>
              ) : (
                listings.map(listing => (
                  <div 
                    key={listing.id}
                    onClick={() => handleOpenListing(listing.id)}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center group cursor-pointer hover:border-amber-500/50 transition"
                  >
                    <div>
                      <h4 className="font-bold text-white text-lg">{listing.address}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{listing.activities.length} activities logged</p>
                    </div>
                    <div className="text-slate-500 group-hover:text-amber-500 transition">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* --- STEP 2: Activities --- */}
          <div className="w-[50%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar pb-40">
            {activeListing && (
              <>
                <div className="mb-6">
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Updating Report for:</span>
                  <h3 className="text-2xl font-black text-white mt-1">{activeListing.address}</h3>
                </div>

                {/* Add Activity Section */}
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 mb-6">
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
            className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold px-4 py-2 rounded-xl transition-all duration-150"
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
                        className="bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-amber-950 active:scale-95 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all duration-150"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logged Activities */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between">
                    Activity Log
                    <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{activeListing.activities.length} total</span>
                  </h3>
                  
                  {activeListing.activities.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4 bg-slate-900 rounded-xl border border-slate-800">No activities logged yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeListing.activities.map((act) => (
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
              </>
            )}
          </div>

        </div>
      </div>

      {/* Static Action Footer for Step 2 */}
      {step === 2 && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900 border-t border-slate-800 z-10 pb-safe">
          <div className="flex gap-3">
            <button 
              onClick={() => showCustomModal('Tracker PDF generated & branded successfully!')} 
              className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 text-sm"
            >
              PDF
            </button>
            <button 
              onClick={() => showCustomModal('Link generated! Text this directly to your seller.')} 
              className="flex-[2] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 text-sm"
            >
              Share Live Link
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

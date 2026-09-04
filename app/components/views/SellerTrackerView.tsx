'use client'

import { useState, useRef } from 'react'
import { useInnerSwipeBack } from '@/app/lib/useInnerSwipeBack'
import { ConfirmDeleteDialog } from '@/app/components/ConfirmDeleteDialog'
import { DateField } from '@/app/components/DateField'
import { SharePreviewButtons } from '@/app/components/SharePreviewButtons'
import { toDateInput, formatDateDisplay } from '@/app/lib/tourFormat'
import { isSellerDemoListing, SELLER_DEMO_PREVIEW_KEY, SELLER_DEMO_PUBLIC_PATH } from '@/app/lib/sellerDemo'

export interface Activity {
  id: string;
  label: string;
  date: string;
  notes?: string;
  status?: 'completed' | 'pending' | 'upcoming';
}

export interface Listing {
  id: string;
  address: string;
  city?: string;
  state?: string;
  county?: string;
  activities: Activity[];
}

interface SellerTrackerViewProps {
  listings: Listing[];
  updateListings: (updater: (prev: Listing[]) => Listing[]) => void;
  showCustomModal: (msg: string, requireAuth?: boolean) => void;
  switchView: (view: string) => void;
  userId?: string;
  persistWorkspace?: () => Promise<boolean>;
  persistDemoShare?: () => Promise<boolean>;
}

const PRESET_ACTIVITIES = [
  "📋 Pre-Listing Inspection",
  "🧹 Professional Deep Clean",
  "🛋️ Professional Staging",
  "📸 Professional Photography",
  "🚁 Drone/Aerial Photography",
  "🎥 Video tour",
  "📏 Floorplan & 3D Tour Created",
  "📄 Property Brochures & Flyers Printed",
  "💻 Property Website Launched",
  "🪧 Yard Sign & Lockbox Installed",
  "🌐 Listed In the MLS",
  "🚀 Syndicated to Zillow, Trulia, Realtor.com",
  "🏢 Internal Email to My Associates",
  "📧 Sent Email Blast to Agent Network",
  "💌 Sent Email to My Database",
  "📱 Social Media Blast",
  "📮 Just Listed Postcards Mailed",
  "🚪 Door Knocking Campaign in Neighborhood",
  "🥂 Hosted Broker's Open",
  "🏡 Hosted Public Open House",
  "🔑 Showing",
  "🔑 Second Showing",
  "📞 Followed Up With Showing Agents",
  "💬 Weekly Showing Feedback Shared",
  "🤝 Received an Offer",
  "📝 Under Contract / Escrow Opened",
  "🔍 Buyer's Appraisal",
  "✅ Clear to Close Received"
];

export function SellerTrackerView({
  listings,
  updateListings,
  showCustomModal,
  switchView,
  userId,
  persistWorkspace,
  persistDemoShare
}: SellerTrackerViewProps) {
  const [step, setStep] = useState(1) // 1: Listings, 2: Activities, 3: Edit Activity
  const [activeListingId, setActiveListingId] = useState<string | null>(null)
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null)
  const [customActivity, setCustomActivity] = useState('')
  const [isAddingListing, setIsAddingListing] = useState(false)
  const [newListingAddress, setNewListingAddress] = useState('')
  const [editActivityForm, setEditActivityForm] = useState<Partial<Activity>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  const activityLogRef = useRef<HTMLDivElement>(null)
  const activityLogHeaderRef = useRef<HTMLHeadingElement>(null)
  useInnerSwipeBack(step, 1, () => setStep(s => Math.max(1, s - 1)))

  const activeListing = listings.find(l => l.id === activeListingId)
  const activeActivity = activeListing?.activities.find(a => a.id === activeActivityId)

  const confirmAddListing = () => {
    if (newListingAddress && newListingAddress.trim()) {
      const newListing: Listing = {
        id: Math.random().toString(36).substr(2, 9),
        address: newListingAddress.trim(),
        activities: []
      }
      updateListings(prev => [newListing, ...prev])
      setActiveListingId(newListing.id)
      setNewListingAddress('')
      setIsAddingListing(false)
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
        const updatedActivities = [
          {
            id: Math.random().toString(36).substr(2, 9),
            label,
            date: toDateInput(new Date().toDateString()),
            status: 'completed' as const
          },
          ...listing.activities
        ];
        // Sort by date (newest first)
        updatedActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
          ...listing,
          activities: updatedActivities
        }
      }
      return listing
    }))
    setCustomActivity('')

    // Scroll to activity log smoothly
    setTimeout(() => {
      activityLogHeaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleOpenActivity = (act: Activity) => {
    setActiveActivityId(act.id)
    setEditActivityForm({ ...act, status: act.status || 'completed' })
    setStep(3)
  }

  const handleUpdateActivity = () => {
    if (!activeListingId || !activeActivityId) return;

    updateListings(prev => prev.map(listing => {
      if (listing.id === activeListingId) {
        const updatedActivities = listing.activities.map(a => 
          a.id === activeActivityId ? { ...a, status: 'completed', ...editActivityForm } as Activity : a
        );
        // Sort by date (newest first)
        updatedActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
          ...listing,
          activities: updatedActivities
        }
      }
      return listing
    }))
    setStep(2)
  }

  const handleRemoveActivity = () => {
    if (!activeListingId || !activeActivityId) return
    updateListings(prev => prev.map(listing => {
      if (listing.id === activeListingId) {
        return {
          ...listing,
          activities: listing.activities.filter(a => a.id !== activeActivityId)
        }
      }
      return listing
    }))
    setConfirmDelete(false)
    setActiveActivityId(null)
    setStep(2)
  }

  const sharingDemo = isSellerDemoListing(activeListing)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = !activeListingId
    ? ''
    : userId
      ? `${origin}/report/${userId}/${activeListingId}`
      : sharingDemo
        ? `${origin}${SELLER_DEMO_PUBLIC_PATH}`
        : ''

  const stashDemoPreview = () => {
    if (!sharingDemo || !activeListing) return
    try {
      sessionStorage.setItem(SELLER_DEMO_PREVIEW_KEY, JSON.stringify({ listing: activeListing }))
    } catch {
      // Preview still works with the canned public demo.
    }
  }

  const handleShareLink = () => {
    if (!sharingDemo && !userId) {
      showCustomModal('', true)
      return
    }
    if (!shareUrl) {
      showCustomModal("You must select an active listing to share.")
      return
    }
    stashDemoPreview()
    navigator.clipboard.writeText(shareUrl).then(() => {
      showCustomModal(`Link copied! Text this directly to your seller:\n\n${shareUrl}`)
    }).catch(() => {
      showCustomModal(`Here is your link (copy it manually):\n\n${shareUrl}`)
    })
  }

  return (
    <div id="view-sellertracker" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50 flex flex-col">
      
      {/* Header */}
      <div className="flex-none h-[72px] flex items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            <span className="text-xs font-bold uppercase tracking-wider">Back</span>
          </button>
        ) : (
          <button onClick={() => switchView('seller')} className="text-slate-400 hover:text-white transition flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            <span className="text-xs font-bold uppercase tracking-wider">Close</span>
          </button>
        )}
        
        <div className="flex-1 mx-4 bg-slate-800 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-amber-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out h-full" style={{ width: '300%', transform: step === 1 ? 'translateX(0%)' : step === 2 ? 'translateX(-33.333333%)' : 'translateX(-66.666667%)' }}>
            
          {/* --- STEP 1: Listings --- */}
          <div className="w-[33.333333%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar">
            <div className="text-center mb-8">
              <span className="text-xs font-bold tracking-widest text-amber-500 uppercase font-seller">Tracker Report</span>
              <h3 className="text-2xl font-black text-white mt-1">My Active Listings</h3>
            </div>

            {isAddingListing ? (
              <div className="bg-slate-800 p-4 rounded-xl border border-amber-500/50 mb-6">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Enter property address..." 
                  value={newListingAddress}
                  onChange={e => setNewListingAddress(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmAddListing()}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={confirmAddListing} className="flex-1 bg-amber-500 text-slate-950 font-bold py-2 rounded-lg">Save</button>
                  <button onClick={() => {setIsAddingListing(false); setNewListingAddress('');}} className="flex-1 bg-slate-700 text-white font-bold py-2 rounded-lg">Cancel</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingListing(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-black py-4 rounded-xl transition shadow flex items-center justify-center gap-2 mb-6"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Add My Listing
              </button>
            )}

            <div className="space-y-3">
              {listings.filter(listing => !isSellerDemoListing(listing)).length === 0 && (
                <div className="text-center py-10 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <div className="text-4xl mb-3 opacity-50">🏡</div>
                  <p className="text-base text-slate-400 font-medium">You don&apos;t have any listings yet.<br/>Click above to add your first one!</p>
                </div>
              )}
              {listings.filter(listing => !isSellerDemoListing(listing)).map(listing => (
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
              ))}
              {listings.filter(isSellerDemoListing).map(listing => (
                <div 
                  key={listing.id}
                  onClick={() => handleOpenListing(listing.id)}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center group cursor-pointer hover:border-amber-500/50 transition"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Demo</span>
                    <h4 className="font-bold text-white text-lg mt-1">{listing.address}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{listing.activities.length} activities logged</p>
                  </div>
                  <div className="text-slate-500 group-hover:text-amber-500 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- STEP 2: Activities --- */}
          <div className="w-[33.333333%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar pb-40">
            {activeListing && (
              <>
                <div className="mb-6">
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Updating Report for:</span>
                  <h3 className="text-2xl font-black text-white mt-1">{activeListing.address}</h3>
                </div>

                {/* Add Activity Section */}
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 mb-6">
                  <h3 className="text-sm font-bold text-white mb-3">Activity Bank</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 mb-4">
                    {PRESET_ACTIVITIES.map(preset => (
                      <button
                        key={preset}
                        onClick={() => handleAddActivity(preset)}
                        className="w-full text-left bg-slate-900 hover:bg-slate-700 active:bg-amber-500 active:text-amber-950 border border-slate-700 p-3 rounded-lg transition"
                      >
                        <p className="text-sm font-bold text-slate-200">{preset}</p>
                      </button>
                    ))}
                  </div>

                  <p className="text-sm font-bold text-slate-400 text-center mb-3">Or add your own</p>
                  <div className="flex gap-2">
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
                </div>

                {/* Logged Activities */}
                <div className="space-y-3 scroll-mt-6" ref={activityLogRef}>
                  <h3 className="text-sm font-bold text-white flex items-center justify-between" ref={activityLogHeaderRef}>
                    Activity Log
                    <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{activeListing.activities.length} total</span>
                  </h3>
                  
                  {activeListing.activities.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4 bg-slate-900 rounded-xl border border-slate-800">No activities logged yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeListing.activities.map((act) => (
                        <div 
                          key={act.id} 
                          onClick={() => handleOpenActivity(act)}
                          className={`bg-slate-800 border ${act.status === 'pending' ? 'border-amber-500/50 border-dashed' : act.status === 'upcoming' ? 'border-cyan-500/50' : 'border-slate-700'} rounded-xl p-3 flex justify-between items-start group cursor-pointer hover:border-amber-400 transition-colors`}
                        >
                          <div>
                            <div className="flex gap-2 mb-1">
                              <span className="text-xs font-black text-slate-400 bg-slate-900 px-2 py-0.5 rounded inline-block">{formatDateDisplay(act.date)}</span>
                              {(!act.status || act.status === 'completed') && <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded inline-block uppercase">Completed</span>}
                              {act.status === 'upcoming' && <span className="text-xs font-black text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded inline-block uppercase">Upcoming</span>}
                              {act.status === 'pending' && <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded inline-block uppercase">Pending</span>}
                            </div>
                            <p className="text-base font-bold text-white leading-tight mt-1">{act.label}</p>
                            {act.notes && <p className="text-sm text-slate-400 mt-1 line-clamp-1">{act.notes}</p>}
                          </div>
                          <span
                            className="text-slate-400 group-hover:text-amber-400 p-1 ml-3 transition"
                            title="Edit activity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l9.414-9.414a2 2 0 000-2.828l-2.172-2.172a2 2 0 00-2.828 0L4.586 14.707A1 1 0 004 15.414V20z"></path></svg>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* --- STEP 3: Edit Activity --- */}
          <div className="w-[33.333333%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar">
            {activeActivity && (
              <>
                <div className="mb-6">
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Edit Activity</span>
                  <h3 className="text-xl font-black text-white mt-1">Update Details</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Activity Title</label>
                    <input 
                      type="text" 
                      value={editActivityForm.label || ''}
                      onChange={(e) => setEditActivityForm({...editActivityForm, label: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-colors" 
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Date</label>
                    <DateField
                      value={toDateInput(editActivityForm.date || '')}
                      onChange={date => setEditActivityForm({ ...editActivityForm, date })}
                      placeholder="Select a date"
                      className="bg-slate-800 border-slate-700"
                      accent="amber"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['completed', 'pending', 'upcoming'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => setEditActivityForm({...editActivityForm, status})}
                          className={`py-2 px-1 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-colors ${(editActivityForm.status || 'completed') === status ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Notes (Optional)</label>
                    <textarea 
                      placeholder="Add any internal notes..."
                      value={editActivityForm.notes || ''}
                      onChange={(e) => setEditActivityForm({...editActivityForm, notes: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors min-h-[100px]" 
                    />
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Static Action Footer for Step 2 */}
      {step === 2 && (
        <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 z-10 pb-safe">
          <SharePreviewButtons
            url={shareUrl}
            copyLabel="Copy Link"
            accentClass="bg-amber-500 hover:bg-amber-400 text-slate-950"
            onCopy={handleShareLink}
            onNeedAuth={!userId && !sharingDemo ? () => showCustomModal('', true) : undefined}
            beforeShare={async () => {
              stashDemoPreview()
              if (sharingDemo) {
                if (persistDemoShare) return persistDemoShare()
                return true
              }
              if (persistWorkspace) return persistWorkspace()
              return true
            }}
          />
        </div>
      )}

      {/* Static Action Footer for Step 3 */}
      {step === 3 && (
        <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 z-10 pb-safe">
          <div className="flex gap-3">
            <button 
              onClick={() => setConfirmDelete(true)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl transition border border-slate-700"
            >
              Delete
            </button>
            <button 
              onClick={handleUpdateActivity}
              className="flex-[2] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-xl transition shadow"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDeleteDialog
          message="Delete this activity? This can't be undone."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleRemoveActivity}
        />
      )}

    </div>
  )
}

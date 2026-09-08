'use client'

import { useEffect, useState } from 'react'
import { saveProspect } from '@/app/actions/prospects'
import { HowToTour } from '@/app/components/HowToTour'
import { OverlayNavButton } from '@/app/components/OverlayNavButton'
import { ToolLanding } from '@/app/components/ToolLanding'
import { SIGNIN_TOUR } from '@/app/lib/toolTours'
import type { Listing } from '@/app/components/views/SellerTrackerView'

export function OpenHouseSignInView({
  listings,
  updateListings,
  switchView,
  showCustomModal,
  userId,
}: {
  listings: Listing[]
  updateListings: (updater: (prev: Listing[]) => Listing[]) => void
  switchView: (view: string) => void
  showCustomModal: (msg: string, requireAuth?: boolean) => void
  userId?: string
}) {
  const [hub, setHub] = useState<'menu' | 'how' | 'work'>('menu')
  const [howPage, setHowPage] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedListingId, setSelectedListingId] = useState(listings[0]?.id || '')
  const [isAddingListing, setIsAddingListing] = useState(false)
  const [newListingAddress, setNewListingAddress] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const selectedListing = listings.find(l => l.id === selectedListingId)

  useEffect(() => {
    if (!selectedListingId && listings[0]) setSelectedListingId(listings[0].id)
  }, [listings, selectedListingId])

  const confirmAddListing = () => {
    const address = newListingAddress.trim()
    if (!address) return
    const listing: Listing = {
      id: crypto.randomUUID().replace(/-/g, '').slice(0, 10),
      address,
      activities: []
    }
    updateListings(prev => [listing, ...prev])
    setSelectedListingId(listing.id)
    setNewListingAddress('')
    setIsAddingListing(false)
  }

  const submitOpenHouse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedListing) {
      showCustomModal('Pick or add a listing before collecting guest info.')
      return
    }
    if (!userId) {
      showCustomModal('', true)
      return
    }

    setIsSaving(true)
    const result = await saveProspect({
      profileId: userId,
      name,
      phone,
      sourceTool: 'openhouse_signin',
      listingId: selectedListing.id,
      listingAddress: selectedListing.address,
    })
    setIsSaving(false)

    if (result.error) {
      showCustomModal(result.error)
      return
    }
    setIsSubmitted(true)
  }

  const resetOpenHouse = () => {
    setName('')
    setPhone('')
    setIsSubmitted(false)
  }

  const howLast = howPage >= SIGNIN_TOUR.length - 1
  const goBack = () => {
    if (hub === 'how') {
      if (howLast || howPage === 0) {
        setHowPage(0)
        setHub('menu')
        return
      }
      setHowPage(page => page - 1)
      return
    }
    if (hub === 'work') {
      setHub('menu')
      return
    }
    switchView('openhouse')
  }

  return (
    <div id="view-ohsignin" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50 flex flex-col">
      <div className="flex-none h-[72px] flex items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
        <OverlayNavButton
          kind={hub === 'menu' || (hub === 'how' && howLast) ? 'close' : 'back'}
          label={hub === 'menu' || (hub === 'how' && howLast) ? 'Close' : 'Back'}
          onClick={goBack}
        />
      </div>

      {hub === 'menu' ? (
        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar bg-slate-900">
          <ToolLanding
            kicker="Open House Tools"
            kickerClass="text-indigo-400"
            title="Guest Sign-In"
            titleClass="font-openhouse"
            blurb="iPad at the door. Name, cell, and the brochure goes to their phone."
            primaryLabel="Start Guest Sign-In"
            primaryEmoji="🏡"
            primaryClass="group relative bg-indigo-600 hover:bg-indigo-500 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden"
            onPrimary={() => setHub('work')}
            onHow={() => {
              setHowPage(0)
              setHub('how')
            }}
            howClass="group relative bg-indigo-100 hover:bg-white text-slate-900 p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden border-2 border-transparent hover:border-indigo-300"
          />
        </div>
      ) : hub === 'how' ? (
        <div className="flex-1 min-h-0 p-6 pb-safe bg-slate-900">
          <HowToTour
            pages={SIGNIN_TOUR}
            page={howPage}
            onPageChange={setHowPage}
            onDone={() => {
              setHowPage(0)
              setHub('menu')
            }}
            doneLabel="Got it"
            titleClass="font-openhouse"
          />
        </div>
      ) : (
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-6">
      <div className="bg-indigo-900/60 border border-indigo-800/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl text-center space-y-5">
        {!isSubmitted ? (
          <div>
            <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase font-openhouse">Open House Tools</span>

            {isAddingListing ? (
              <div className="mt-3 mb-4 text-left bg-indigo-950/80 border border-indigo-700/50 rounded-xl p-4">
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter property address..."
                  value={newListingAddress}
                  onChange={e => setNewListingAddress(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmAddListing()}
                  className="w-full bg-indigo-950 border border-indigo-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-400 mb-3"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={confirmAddListing} className="flex-1 bg-white text-indigo-900 font-bold py-2 rounded-lg">Save</button>
                  <button type="button" onClick={() => { setIsAddingListing(false); setNewListingAddress('') }} className="flex-1 bg-indigo-800 text-white font-bold py-2 rounded-lg">Cancel</button>
                </div>
              </div>
            ) : listings.length > 0 ? (
              <div className="relative mt-2 mb-4 text-left">
                <select
                  value={selectedListingId}
                  onChange={e => {
                    if (e.target.value === '__add__') {
                      setIsAddingListing(true)
                      return
                    }
                    setSelectedListingId(e.target.value)
                  }}
                  className="w-full bg-indigo-950/80 border border-indigo-700/50 rounded-xl px-4 py-3 text-lg font-black text-white focus:outline-none focus:border-indigo-400 transition-colors appearance-none cursor-pointer"
                >
                  {listings.map(listing => (
                    <option key={listing.id} value={listing.id}>{listing.address}</option>
                  ))}
                  <option value="__add__">+ Add a listing</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            ) : (
              <div className="mt-3 mb-4">
                <p className="text-base text-indigo-200 mb-3">Add the listing this open house is for.</p>
                <button
                  type="button"
                  onClick={() => setIsAddingListing(true)}
                  className="w-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-200 font-black py-3 rounded-xl"
                >
                  + Add a listing
                </button>
              </div>
            )}

            <p className="text-base text-indigo-200 mt-1 mb-4">Sign in to instantly receive the brochure &amp; floor plan.</p>
            <form onSubmit={submitOpenHouse} className="space-y-4 text-left">
              <input
                type="text"
                placeholder="Your Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-indigo-950/80 border border-indigo-700/50 rounded-xl px-4 py-3 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <input
                type="tel"
                placeholder="Cell Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-indigo-950/80 border border-indigo-700/50 rounded-xl px-4 py-3 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <button type="submit" disabled={isSaving} className="w-full bg-white hover:bg-indigo-50 text-indigo-900 font-black py-4 rounded-xl transition shadow-lg mt-2 disabled:opacity-60">
                {isSaving ? 'Saving...' : 'Sign In & Get Info'}
              </button>
            </form>
          </div>
        ) : (
          <div className="py-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-black text-white mb-2">You&apos;re on the list!</h2>
            <p className="text-sm text-indigo-200">The property details have been texted to you.</p>
            <button onClick={resetOpenHouse} className="mt-8 text-xs font-bold text-indigo-300 hover:text-white underline">
              Next Guest
            </button>
          </div>
        )}
      </div>
      </div>
      )}
    </div>
  )
}

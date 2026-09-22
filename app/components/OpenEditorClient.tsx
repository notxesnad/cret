'use client'

import { useEffect, useRef, useState } from 'react'
import { markImportedOpened, startEditorLogin } from '@/app/actions/openEditor'
import { OpeningEditorSplash } from '@/app/components/OpeningEditorSplash'
import { SellerTrackerView, type Listing } from '@/app/components/views/SellerTrackerView'
import { asEditorListing, type EditorListing } from '@/app/lib/openListingCache'
import { markAuthPersistPending, markAuthPersisted, supabase } from '@/utils/supabase'

async function verifyEditorToken(tokenHash: string) {
  let result = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  })
  if (result.error) {
    result = await supabase.auth.verifyOtp({
      type: 'email',
      token_hash: tokenHash,
    })
  }
  return result
}

export function OpenEditorClient({
  profileId,
  listingId,
  sig,
  listing,
}: {
  profileId: string
  listingId: string
  sig: string
  listing?: EditorListing
  next?: string
  via?: string
}) {
  const [listings, setListings] = useState<Listing[]>(listing ? [listing as Listing] : [])
  const listingsRef = useRef(listings)
  listingsRef.current = listings
  const [modal, setModal] = useState('')
  const [message, setMessage] = useState('Opening your report editor…')
  const [sessionOk, setSessionOk] = useState(false)
  const sessionReady = useRef(Promise.resolve(false))

  useEffect(() => {
    let cancelled = false
    let resolveSession = (_ok: boolean) => {}
    sessionReady.current = new Promise((resolve) => {
      resolveSession = resolve
    })

    void (async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      if (data.session?.user?.id === profileId) {
        markAuthPersisted()
        void markImportedOpened({ profileId, listingId, sig })
        if (!listingsRef.current.length) {
          const { data: row } = await supabase.from('listings').select('*').eq('id', listingId).maybeSingle()
          if (!cancelled && row) setListings([asEditorListing(row) as Listing])
        }
        setSessionOk(true)
        resolveSession(true)
        return
      }

      const started = await startEditorLogin({ profileId, listingId, sig })
      if (cancelled) return
      if ('error' in started) {
        setMessage(started.error)
        resolveSession(false)
        return
      }
      if (started.listing && !listingsRef.current.length) {
        setListings([started.listing as Listing])
      }
      markAuthPersistPending()
      const result = await verifyEditorToken(started.tokenHash)
      if (cancelled) return
      if (result.error || !result.data.session) {
        setMessage(result.error?.message || 'Couldn’t open the editor. Try the link once more.')
        resolveSession(false)
        return
      }
      markAuthPersisted()
      void markImportedOpened({ profileId, listingId, sig })
      setSessionOk(true)
      resolveSession(true)
    })()

    return () => {
      cancelled = true
      resolveSession(false)
    }
  }, [profileId, listingId, sig])

  const persistWorkspace = async () => {
    const ok = await sessionReady.current
    if (!ok) return false
    const current = listingsRef.current.find((item) => item.id === listingId) || listingsRef.current[0]
    if (!current) return false
    const { error } = await supabase
      .from('listings')
      .update({
        address: current.address,
        city: current.city || null,
        state: current.state || null,
        county: current.county || null,
        activities: current.activities,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id)
    return !error
  }

  useEffect(() => {
    if (!sessionOk) return
    void persistWorkspace()
  }, [listings, sessionOk])

  if (!listings.length) return <OpeningEditorSplash message={message} />

  return (
    <>
      <SellerTrackerView
        listings={listings}
        updateListings={(updater) => {
          setListings((prev) => {
            const next = updater(prev)
            listingsRef.current = next
            return next
          })
        }}
        showCustomModal={(msg) => {
          if (msg) setModal(msg)
        }}
        switchView={() => {
          window.location.assign('/')
        }}
        userId={profileId}
        persistWorkspace={persistWorkspace}
        persistDemoShare={persistWorkspace}
        openListingId={listingId}
      />
      {modal ? (
        <div className="fixed inset-0 z-[90] bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center">
            <p className="text-white font-bold whitespace-pre-wrap">{modal}</p>
            <button
              type="button"
              onClick={() => setModal('')}
              className="mt-4 w-full bg-seller hover:bg-seller-hover text-slate-950 font-black py-3 rounded-xl"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

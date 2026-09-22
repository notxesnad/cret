'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { markImportedOpened, startEditorLogin } from '@/app/actions/openEditor'
import { OpeningEditorSplash } from '@/app/components/OpeningEditorSplash'
import { asEditorListing, editorLandingHref, stashOpenListing } from '@/app/lib/openListingCache'
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
  next,
  via,
}: {
  profileId: string
  listingId: string
  sig: string
  next?: string
  via?: string
}) {
  const router = useRouter()
  const [message, setMessage] = useState('Opening your report editor…')

  useEffect(() => {
    let cancelled = false
    const href = editorLandingHref(listingId, next, via)
    router.prefetch(href)

    const finish = (listing?: ReturnType<typeof asEditorListing> | null) => {
      if (listing) stashOpenListing(listing)
      markAuthPersisted()
      window.location.replace(href)
    }

    void (async () => {
      const loginP = startEditorLogin({ profileId, listingId, sig, next, via })
      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      if (data.session?.user?.id === profileId) {
        markAuthPersistPending()
        void markImportedOpened({ profileId, listingId, sig })
        const { data: row } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .maybeSingle()
        if (cancelled) return
        finish(row ? asEditorListing(row) : null)
        return
      }

      const started = await loginP
      if (cancelled) return
      if ('error' in started) {
        setMessage(started.error)
        return
      }
      markAuthPersistPending()
      const result = await verifyEditorToken(started.tokenHash)
      if (cancelled) return
      if (result.error || !result.data.session) {
        setMessage(result.error?.message || 'Couldn’t open the editor. Try the link once more.')
        return
      }
      void markImportedOpened({ profileId, listingId, sig })
      finish(started.listing)
    })()

    return () => {
      cancelled = true
    }
  }, [profileId, listingId, sig, next, via, router])

  return <OpeningEditorSplash message={message} />
}

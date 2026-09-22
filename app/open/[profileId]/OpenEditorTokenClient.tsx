'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { startEditorLoginByToken } from '@/app/actions/openEditor'
import { OpeningEditorSplash } from '@/app/components/OpeningEditorSplash'
import { editorLandingHref, stashOpenListing } from '@/app/lib/openListingCache'
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

export function OpenEditorTokenClient({
  token,
  listingId,
  next,
  via,
}: {
  token: string
  listingId: string
  next?: string
  via?: string
}) {
  const router = useRouter()
  const [message, setMessage] = useState('Opening your report editor…')

  useEffect(() => {
    let cancelled = false
    const href = editorLandingHref(listingId, next, via)
    router.prefetch(href)

    void (async () => {
      const started = await startEditorLoginByToken({ token, listingId, next, via })
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
      stashOpenListing(started.listing)
      markAuthPersisted()
      window.location.replace(href)
    })()
    return () => {
      cancelled = true
    }
  }, [token, listingId, next, via, router])

  return <OpeningEditorSplash message={message} />
}

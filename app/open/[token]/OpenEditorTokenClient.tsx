'use client'

import { useEffect, useState } from 'react'
import { startEditorLoginByToken } from '@/app/actions/openEditor'
import { markAuthPersistPending, markAuthPersisted, supabase } from '@/utils/supabase'

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
  const [message, setMessage] = useState('Opening your report editor…')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const started = await startEditorLoginByToken({ token, listingId, next, via })
      if (cancelled) return
      if ('error' in started) {
        setMessage(started.error)
        return
      }
      markAuthPersistPending()
      let result = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: started.tokenHash,
      })
      if (result.error) {
        result = await supabase.auth.verifyOtp({
          type: 'email',
          token_hash: started.tokenHash,
        })
      }
      if (cancelled) return
      if (result.error || !result.data.session) {
        setMessage(result.error?.message || 'Couldn’t open the editor. Try the link once more.')
        return
      }
      markAuthPersisted()
      window.location.replace(started.nextUrl)
    })()
    return () => {
      cancelled = true
    }
  }, [token, listingId, next, via])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-black mb-2">Cool Real Estate Tools</h1>
        <p className="text-slate-400">{message}</p>
      </div>
    </div>
  )
}

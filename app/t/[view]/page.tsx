'use client'

import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

export default function LegacyToolRedirect() {
  const { view } = useParams<{ view: string }>()
  const router = useRouter()
  const search = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams(search.toString())
    if (view && view !== 'home') params.set('view', view)
    const qs = params.toString()
    router.replace(qs ? `/?${qs}` : '/')
  }, [view, router, search])

  return <div className="min-h-screen bg-[#0f172a]" />
}

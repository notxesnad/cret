'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/utils/supabase'

const HEADER_STEP_KEY = 'crt_header_step'
export const HEADER_BUILDER_HREF = '/?view=profile'

export type AgentHeaderCtaProps = {
  mode?: 'always' | 'preview'
  signedIn?: boolean
  complete?: boolean
  onCustomize?: () => void
}

export const PREVIEW_LINK_HEADER_CTA: AgentHeaderCtaProps = { mode: 'preview' }

export function headerContactComplete(profile?: {
  full_name?: string | null
  email?: string | null
  phone?: string | null
} | null) {
  return Boolean(profile?.full_name?.trim() && profile?.email?.trim() && profile?.phone?.trim())
}

export function markHeaderBuilderStart() {
  try {
    sessionStorage.setItem(HEADER_STEP_KEY, '1')
  } catch {}
}

export function takeHeaderBuilderStart() {
  try {
    if (sessionStorage.getItem(HEADER_STEP_KEY) !== '1') return false
    sessionStorage.removeItem(HEADER_STEP_KEY)
    return true
  } catch {
    return false
  }
}

function previewFlagFromLocation() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  const flag = (params.get('preview') || '').toLowerCase()
  return flag === '1' || flag === 'true'
}

export function AgentHeaderCta({
  mode = 'always',
  signedIn,
  complete,
  onCustomize,
}: AgentHeaderCtaProps) {
  const [viewer, setViewer] = useState<{ signedIn: boolean; complete: boolean } | null>(
    signedIn === undefined ? null : { signedIn, complete: Boolean(complete) }
  )
  const [allowPreview, setAllowPreview] = useState(mode !== 'preview')

  useEffect(() => {
    if (mode === 'preview') setAllowPreview(previewFlagFromLocation())
  }, [mode])

  useEffect(() => {
    if (signedIn !== undefined) {
      setViewer({ signedIn, complete: Boolean(complete) })
      return
    }
    let cancelled = false
    void supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user
      if (!user) {
        if (!cancelled) setViewer({ signedIn: false, complete: false })
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .maybeSingle()
      if (!cancelled) {
        setViewer({ signedIn: true, complete: headerContactComplete(profile) })
      }
    })
    return () => {
      cancelled = true
    }
  }, [signedIn, complete])

  if (mode === 'preview' && !allowPreview) return null
  if (!viewer || (viewer.signedIn && viewer.complete)) return null

  const label = viewer.signedIn ? 'Finish your header' : 'Customize your header'

  const go = () => {
    markHeaderBuilderStart()
    if (onCustomize) {
      onCustomize()
      return
    }
    window.location.href = HEADER_BUILDER_HREF
  }

  return (
    <button
      type="button"
      onClick={go}
      className="max-w-[11.5rem] rounded-lg bg-fuchsia-500 px-2.5 py-1.5 text-left text-[11px] font-black leading-tight text-white shadow-lg shadow-fuchsia-900/30 hover:bg-fuchsia-400"
    >
      {label}
    </button>
  )
}

export function AgentHeaderFrame({
  children,
  cta,
}: {
  children: ReactNode
  cta?: AgentHeaderCtaProps | false
}) {
  if (!children) return null
  if (!cta) return children
  return (
    <div className="relative">
      {children}
      <div className="absolute right-2 bottom-2 z-20 no-print">
        <AgentHeaderCta {...cta} />
      </div>
    </div>
  )
}



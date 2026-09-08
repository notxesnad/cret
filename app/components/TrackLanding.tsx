'use client'

import { useEffect } from 'react'
import { supabase } from '@/utils/supabase'

const APP_VISIT_KEY = 'crt-app-visit'

function send(payload: Record<string, unknown>) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}

function currentPath() {
  return `${window.location.pathname}${window.location.search}`
}

export function TrackLanding() {
  useEffect(() => {
    let sentApp = false
    let sentSite = false

    const trackApp = (accessToken: string) => {
      if (sentApp) return
      if (sessionStorage.getItem(APP_VISIT_KEY) === '1') {
        sentApp = true
        return
      }
      sentApp = true
      sessionStorage.setItem(APP_VISIT_KEY, '1')
      send({
        tool: 'app',
        accessToken,
        path: currentPath(),
        referrer: document.referrer || '',
      })
    }

    const trackSite = () => {
      if (sentSite || sentApp) return
      const params = new URLSearchParams(window.location.search)
      if (params.has('code') || params.get('billing') || window.location.hash.includes('access_token')) {
        return
      }
      sentSite = true
      send({
        tool: 'site',
        path: currentPath(),
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        referrer: document.referrer || '',
      })
    }

    let cancelled = false
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session?.access_token) {
        trackApp(data.session.access_token)
        return
      }
      trackSite()
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) trackApp(session.access_token)
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [])

  return null
}

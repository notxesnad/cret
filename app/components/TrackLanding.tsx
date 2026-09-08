'use client'

import { useEffect } from 'react'

export function TrackLanding() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('code') || params.get('billing') || window.location.hash.includes('access_token')) {
      return
    }

    const payload = JSON.stringify({
      tool: 'site',
      path: `${window.location.pathname}${window.location.search}`,
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      referrer: document.referrer || '',
    })

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {})
  }, [])

  return null
}

'use client'

import { useEffect, useState } from 'react'
import { SellerReportView, SELLER_DEMO_PUBLIC_PROFILE } from '@/app/components/SellerReportView'
import { createSellerDemoListing, SELLER_DEMO_PREVIEW_KEY } from '@/app/lib/sellerDemo'

export default function DemoSellerReportPage() {
  const [listing, setListing] = useState(() => createSellerDemoListing('seller-demo-public'))
  const [profile, setProfile] = useState<any>(SELLER_DEMO_PUBLIC_PROFILE)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SELLER_DEMO_PREVIEW_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.listing) setListing(parsed.listing)
      if (parsed?.profile) setProfile({ ...SELLER_DEMO_PUBLIC_PROFILE, ...parsed.profile })
    } catch {
      // Fall back to the canned demo report.
    }
  }, [])

  return <SellerReportView profile={profile} listing={listing} />
}

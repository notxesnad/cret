export const SELLER_DEMO_ID_PREFIX = 'seller-demo-'

export function isSellerDemoListing(listing: { id?: string } | null | undefined) {
  return Boolean(listing?.id && String(listing.id).startsWith(SELLER_DEMO_ID_PREFIX))
}

export function createSellerDemoListing(id: string) {
  return {
    id,
    address: '555 Demo Report',
    activities: [
      {
        id: `${id}-act-1`,
        label: '📋 Pre-Listing Inspection',
        date: '2025-04-06',
        status: 'completed' as const,
      },
      {
        id: `${id}-act-2`,
        label: '📸 Professional Photography',
        date: '2025-04-08',
        status: 'pending' as const,
        notes: 'The photographer is coming back for the night shots due to rain.',
      },
      {
        id: `${id}-act-3`,
        label: '🚁 Drone/Aerial Photography',
        date: '2025-04-26',
        status: 'upcoming' as const,
      },
      {
        id: `${id}-act-4`,
        label: '🌐 Listed In the MLS',
        date: '2025-04-12',
        status: 'completed' as const,
      },
      {
        id: `${id}-act-5`,
        label: '🚀 Syndicated to Zillow, Trulia, Realtor.com',
        date: '2025-04-12',
        status: 'completed' as const,
      },
      {
        id: `${id}-act-6`,
        label: '📮 Just Listed Postcards Mailed',
        date: '2025-04-14',
        status: 'completed' as const,
        notes: 'We mailed 1,200 postcards to the neighborhood as well as 500 to the community across the street.',
      },
      {
        id: `${id}-act-7`,
        label: '🏡 Hosted Public Open House',
        date: '2025-04-20',
        status: 'completed' as const,
        notes: 'We had 8 groups through. 2 came with realtors. 1 was a neighbor who was looking for a friend.',
      },
    ],
  }
}

export function withSellerDemoListing(listings: any[] | null | undefined, demoId: string) {
  const list = Array.isArray(listings) ? [...listings] : []
  if (list.some(isSellerDemoListing)) return list
  return [...list, createSellerDemoListing(demoId)]
}

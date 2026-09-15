export const SELLER_DEMO_ID_PREFIX = 'seller-demo-'
export const SELLER_DEMO_PUBLIC_PATH = '/report/demo'
export const SELLER_DEMO_PREVIEW_KEY = 'crt_seller_demo_preview'

export function isSellerDemoListing(listing: { id?: string } | null | undefined) {
  return Boolean(listing?.id && String(listing.id).startsWith(SELLER_DEMO_ID_PREFIX))
}

export function createSellerDemoListing(id: string) {
  return {
    id,
    address: '555 Demo Report Ave.',
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
        date: '2025-04-10',
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
        id: `${id}-act-8`,
        label: '🥂 Hosted Broker Open',
        date: '2025-04-18',
        status: 'completed' as const,
        notes: 'It was a very successful broker open with 22 agents viewing the home. Many had wonderful things to say about the home and at least 3 are bringing their clients in this week.',
      },
      {
        id: `${id}-act-7`,
        label: '🏡 Hosted Public Open House',
        date: '2025-04-20',
        status: 'completed' as const,
        notes: 'We had 8 groups through. 2 came with realtors. 1 was a neighbor who was looking for a friend.',
      },
      {
        id: `${id}-act-9`,
        label: '🔑 Showing',
        date: '2025-04-22',
        status: 'completed' as const,
        notes: 'One of the agents from the broker open brought in a family with 2 children. The kitchen blew them away and the kids loved the game room. I would expect to see an offer come in from them.',
      },
      {
        id: `${id}-act-10`,
        label: '🤝 Received an Offer',
        date: '2025-04-24',
        status: 'completed' as const,
        notes: 'Received an offer from the Michigan couple that came to the Open House.',
      },
    ],
  }
}

export function withSellerDemoListing(listings: any[] | null | undefined, demoId: string) {
  const list = Array.isArray(listings) ? [...listings] : []
  if (list.some(isSellerDemoListing)) return list
  return [...list, createSellerDemoListing(demoId)]
}

import { redirectWithEmailUtm } from '@/app/lib/emailRedirect'

const DEFAULTS = {
  utm_source: 'email',
  utm_medium: 'plain',
  utm_campaign: 'realtors-st-plain',
  utm_content: 'create',
}

export default async function SellerTrackerEmailLink({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  redirectWithEmailUtm('/', { view: 'sellertracker' }, await searchParams, DEFAULTS)
}

import { redirectWithEmailUtm } from '@/app/lib/emailRedirect'

const DEFAULTS = {
  utm_source: 'email',
  utm_medium: 'html',
  utm_campaign: 'realtors-st-html',
  utm_content: 'create',
}

export default async function StartTrackerEmailLink({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  redirectWithEmailUtm('/', { view: 'sellertracker' }, await searchParams, DEFAULTS)
}

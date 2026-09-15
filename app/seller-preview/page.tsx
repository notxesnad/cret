import { redirectWithEmailUtm } from '@/app/lib/emailRedirect'

const DEFAULTS = {
  utm_source: 'email',
  utm_medium: 'plain',
  utm_campaign: 'realtors-st-plain',
  utm_content: 'preview',
}

export default async function SellerPreviewEmailLink({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  redirectWithEmailUtm('/report/demo', {}, await searchParams, DEFAULTS)
}

import { redirectWithEmailUtm } from '@/app/lib/emailRedirect'

const DEFAULTS = {
  utm_source: 'email',
  utm_medium: 'html',
  utm_campaign: 'realtors-st-html',
  utm_content: 'preview',
}

export default async function PreviewReportEmailLink({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  redirectWithEmailUtm('/report/demo', {}, await searchParams, DEFAULTS)
}

import { redirectWithEmailUtm } from '@/app/lib/emailRedirect'

const DEFAULTS = {
  utm_source: 'showing',
  utm_medium: 'loop',
  utm_campaign: 'showing-agent',
  utm_content: 'quiz',
}

export default async function StartShowingLink({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  redirectWithEmailUtm('/', { view: 'showingfeedback' }, await searchParams, DEFAULTS)
}

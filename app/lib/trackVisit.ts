import { headers } from 'next/headers'
import { isMissingRelation } from '@/app/lib/workspace'
import { adminClient } from '@/app/lib/workspacePublic'

export const VISIT_TOOLS = [
  'site',
  'app',
  'register',
  'feedback',
  'feedback_report',
  'advice',
  'tour',
  'netsheet',
  'report',
] as const

export type VisitTool = (typeof VISIT_TOOLS)[number]

export function isVisitBot(userAgent: string | null | undefined) {
  if (!userAgent) return false
  return /bot|crawl|spider|preview|facebookexternalhit|slackbot|twitterbot|whatsapp|linkedinbot|embedly|discordbot|telegrambot|applebot|bingpreview|yandex|duckduckbot/i.test(userAgent)
}

function firstParam(value: string | string[] | undefined | null) {
  if (value == null) return null
  const raw = Array.isArray(value) ? value[0] : value
  const trimmed = (raw || '').trim()
  return trimmed ? trimmed.slice(0, 200) : null
}

export async function recordVisit(input: {
  tool: VisitTool
  profileId?: string | null
  sourceId?: string | null
  path: string
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  referrer?: string | null
  userAgent?: string | null
}) {
  try {
    if (isVisitBot(input.userAgent)) return
    const { error } = await adminClient().from('link_visits').insert({
      profile_id: input.profileId || null,
      tool: input.tool,
      path: (input.path || '').slice(0, 500),
      source_id: input.sourceId || null,
      utm_source: firstParam(input.utmSource),
      utm_medium: firstParam(input.utmMedium),
      utm_campaign: firstParam(input.utmCampaign),
      referrer: firstParam(input.referrer)?.slice(0, 500) || null,
    })
    if (error && !isMissingRelation(error)) {
      console.error('recordVisit failed', error.message)
    }
  } catch (err) {
    console.error('recordVisit failed', err)
  }
}

export async function trackShareVisit(opts: {
  tool: Exclude<VisitTool, 'site' | 'app'>
  profileId: string
  sourceId?: string
  path: string
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}) {
  let utmSource: string | null = null
  let utmMedium: string | null = null
  let utmCampaign: string | null = null
  if (opts.searchParams) {
    const sp = await opts.searchParams
    utmSource = firstParam(sp.utm_source)
    utmMedium = firstParam(sp.utm_medium)
    utmCampaign = firstParam(sp.utm_campaign)
  }

  let referrer: string | null = null
  let userAgent: string | null = null
  try {
    const headerList = await headers()
    referrer = headerList.get('referer')
    userAgent = headerList.get('user-agent')
  } catch {
    // ignore
  }

  await recordVisit({
    tool: opts.tool,
    profileId: opts.profileId,
    sourceId: opts.sourceId,
    path: opts.path,
    utmSource,
    utmMedium,
    utmCampaign,
    referrer,
    userAgent,
  })
}

const APP_VISIT_GAP_MS = 30 * 60 * 1000

export async function recordAppVisit(input: {
  profileId: string
  path: string
  referrer?: string | null
  userAgent?: string | null
}) {
  try {
    if (isVisitBot(input.userAgent)) return
    const since = new Date(Date.now() - APP_VISIT_GAP_MS).toISOString()
    const recent = await adminClient()
      .from('link_visits')
      .select('id')
      .eq('profile_id', input.profileId)
      .eq('tool', 'app')
      .gte('created_at', since)
      .limit(1)
    if (recent.error && isMissingRelation(recent.error)) return
    if (recent.data?.length) return
    await recordVisit({
      tool: 'app',
      profileId: input.profileId,
      path: input.path,
      referrer: input.referrer,
      userAgent: input.userAgent,
    })
  } catch (err) {
    console.error('recordAppVisit failed', err)
  }
}

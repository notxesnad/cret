'use server'

import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/app/lib/adminAccess'
import type { AdminAgentRow, AdminDashboard, AdminRecentVisit } from '@/app/lib/adminTypes'
import { TOOL_LABELS } from '@/app/lib/adminTypes'
import { billingFromProfile, billingLabel, hasShareAccess, isPaid } from '@/app/lib/billing'
import { OPENHOUSE_FEEDBACK_KIND } from '@/app/lib/openhouseFeedback'
import { OPENHOUSE_REGISTRATION_KIND } from '@/app/lib/openhouseRegistration'
import { PROSPECT_STORE_KIND } from '@/app/lib/prospects'
import { isMissingRelation } from '@/app/lib/workspace'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

async function userFromToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(url, anon)
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) return null
  return data.user
}

function countBy(rows: { profile_id?: string | null }[] | null | undefined) {
  const map = new Map<string, number>()
  for (const row of rows || []) {
    const id = row.profile_id
    if (!id) continue
    map.set(id, (map.get(id) || 0) + 1)
  }
  return map
}

function campaignBucket(kind?: string | null) {
  if (kind === OPENHOUSE_REGISTRATION_KIND) return 'registration' as const
  if (kind === OPENHOUSE_FEEDBACK_KIND) return 'feedback' as const
  if (kind === PROSPECT_STORE_KIND) return 'skip' as const
  return 'advice' as const
}

export async function loadAdminDashboard(input: { accessToken: string }): Promise<
  { data: AdminDashboard } | { error: string }
> {
  try {
    const user = await userFromToken(input.accessToken)
    if (!user) return { error: 'Sign in first.' }
    if (!isAdminEmail(user.email)) return { error: 'Not authorized.' }

    const db = admin()
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      profilesRes,
      listingsRes,
      netSheetsRes,
      toursRes,
      clientsRes,
      campaignsRes,
      responsesRes,
      prospectsRes,
      visitsRes,
    ] = await Promise.all([
      db.from('profiles').select('id, email, full_name, updated_at, subscription_status, trial_ends_at, promo_code, show_custom_header'),
      db.from('listings').select('profile_id'),
      db.from('net_sheets').select('profile_id'),
      db.from('tours').select('profile_id'),
      db.from('clients').select('profile_id'),
      db.from('campaigns').select('profile_id, kind'),
      db.from('campaign_responses').select('profile_id, created_at'),
      db.from('prospects').select('profile_id'),
      db.from('link_visits').select('profile_id, tool, path, utm_source, utm_medium, utm_campaign, created_at').order('created_at', { ascending: false }).limit(8000),
    ])

    if (profilesRes.error) {
      console.error('admin profiles', profilesRes.error.message)
      return { error: 'Could not load accounts.' }
    }

    const createdById = new Map<string, string>()
    try {
      const { data: authUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
      for (const authUser of authUsers?.users || []) {
        if (authUser.created_at) createdById.set(authUser.id, authUser.created_at)
      }
    } catch (err) {
      console.error('admin auth users', err)
    }

    const tableReady = !(visitsRes.error && isMissingRelation(visitsRes.error))
    if (visitsRes.error && !isMissingRelation(visitsRes.error)) {
      console.error('admin visits', visitsRes.error.message)
    }

    const listingsBy = countBy(listingsRes.data)
    const netSheetsBy = countBy(netSheetsRes.data)
    const toursBy = countBy(toursRes.data)
    const clientsBy = countBy(clientsRes.data)
    const responsesBy = countBy(responsesRes.data)
    const prospectsBy = countBy(prospectsRes.data)

    const registrationBy = new Map<string, number>()
    const feedbackBy = new Map<string, number>()
    const quizzesBy = new Map<string, number>()
    for (const row of campaignsRes.data || []) {
      const bucket = campaignBucket(row.kind)
      if (bucket === 'skip' || !row.profile_id) continue
      const target = bucket === 'registration' ? registrationBy : bucket === 'feedback' ? feedbackBy : quizzesBy
      target.set(row.profile_id, (target.get(row.profile_id) || 0) + 1)
    }

    const visits = tableReady ? (visitsRes.data || []) : []
    const siteVisits = visits.filter((row) => row.tool === 'site')
    const clientVisits = visits.filter((row) => row.tool !== 'site')

    const siteByCampaignMap = new Map<string, { campaign: string; source: string; clicks: number }>()
    for (const row of siteVisits) {
      const campaign = row.utm_campaign || '(none)'
      const source = row.utm_source || '(none)'
      const key = `${campaign}||${source}`
      const current = siteByCampaignMap.get(key)
      if (current) current.clicks += 1
      else siteByCampaignMap.set(key, { campaign, source, clicks: 1 })
    }

    const clientByToolMap = new Map<string, number>()
    const clicksByAgentTool = new Map<string, Record<string, number>>()
    const clientClicksByAgent = new Map<string, number>()
    for (const row of clientVisits) {
      clientByToolMap.set(row.tool, (clientByToolMap.get(row.tool) || 0) + 1)
      if (!row.profile_id) continue
      clientClicksByAgent.set(row.profile_id, (clientClicksByAgent.get(row.profile_id) || 0) + 1)
      const tools = clicksByAgentTool.get(row.profile_id) || {}
      tools[row.tool] = (tools[row.tool] || 0) + 1
      clicksByAgentTool.set(row.profile_id, tools)
    }

    const profiles = profilesRes.data || []
    const profileName = new Map(profiles.map((row) => [row.id, row.full_name || row.email || 'Unknown']))

    const agents: AdminAgentRow[] = profiles.map((row) => {
      const billing = billingFromProfile(row)
      return {
        id: row.id,
        email: row.email || '',
        name: row.full_name || '',
        createdAt: createdById.get(row.id) || row.updated_at || null,
        billing: billingLabel(billing) || 'None',
        header: Boolean(row.show_custom_header),
        listings: listingsBy.get(row.id) || 0,
        netSheets: netSheetsBy.get(row.id) || 0,
        tours: toursBy.get(row.id) || 0,
        clients: clientsBy.get(row.id) || 0,
        registration: registrationBy.get(row.id) || 0,
        feedback: feedbackBy.get(row.id) || 0,
        quizzes: quizzesBy.get(row.id) || 0,
        responses: responsesBy.get(row.id) || 0,
        prospects: prospectsBy.get(row.id) || 0,
        clientClicks: clientClicksByAgent.get(row.id) || 0,
        clicksByTool: clicksByAgentTool.get(row.id) || {},
      }
    }).sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0
      return bTime - aTime
    })

    const recent: AdminRecentVisit[] = visits.slice(0, 80).map((row) => ({
      createdAt: row.created_at,
      tool: row.tool,
      path: row.path || '',
      agent: row.profile_id ? (profileName.get(row.profile_id) || 'Unknown') : 'Homepage',
      utmSource: row.utm_source || null,
      utmCampaign: row.utm_campaign || null,
    }))

    return {
      data: {
        you: user.email || '',
        tableReady,
        totals: {
          agents: agents.length,
          agentsThisWeek: agents.filter((row) => row.createdAt && row.createdAt >= weekAgo).length,
          trialing: agents.filter((row) => {
            const match = profiles.find((profile) => profile.id === row.id)
            const billing = billingFromProfile(match)
            return hasShareAccess(billing) && !isPaid(billing.status)
          }).length,
          paid: agents.filter((row) => {
            const match = profiles.find((profile) => profile.id === row.id)
            return isPaid(billingFromProfile(match).status)
          }).length,
          siteClicks: siteVisits.length,
          siteClicksThisWeek: siteVisits.filter((row) => row.created_at >= weekAgo).length,
          siteClicksWithUtm: siteVisits.filter((row) => row.utm_source || row.utm_campaign).length,
          clientClicks: clientVisits.length,
          clientClicksThisWeek: clientVisits.filter((row) => row.created_at >= weekAgo).length,
          responses: (responsesRes.data || []).length,
        },
        siteByCampaign: [...siteByCampaignMap.values()].sort((a, b) => b.clicks - a.clicks),
        clientByTool: [...clientByToolMap.entries()]
          .map(([tool, clicks]) => ({ tool, label: TOOL_LABELS[tool] || tool, clicks }))
          .sort((a, b) => b.clicks - a.clicks),
        recent,
        agents,
      },
    }
  } catch (err) {
    console.error('loadAdminDashboard', err)
    return { error: 'Could not load the dashboard.' }
  }
}

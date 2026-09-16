'use server'

import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/app/lib/adminAccess'
import { normalizeAddress, parseImportCsv, starterActivities } from '@/app/lib/adminCsv'
import type { AdminAgentRow, AdminDashboard, AdminImportResultRow, AdminRecentVisit } from '@/app/lib/adminTypes'
import { TOOL_LABELS } from '@/app/lib/adminTypes'
import { appTrialFields, billingFromProfile, billingLabel, hasShareAccess, isPaid } from '@/app/lib/billing'
import { OPENHOUSE_FEEDBACK_KIND } from '@/app/lib/openhouseFeedback'
import { OPENHOUSE_REGISTRATION_KIND } from '@/app/lib/openhouseRegistration'
import { PROSPECT_STORE_KIND } from '@/app/lib/prospects'
import { getStripe } from '@/app/lib/stripe'
import { isMissingRelation } from '@/app/lib/workspace'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

async function findAuthUserIdByEmail(db: ReturnType<typeof admin>, email: string) {
  const needle = email.trim().toLowerCase()
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return null
    const users = data?.users || []
    const match = users.find((user) => (user.email || '').toLowerCase() === needle)
    if (match?.id) return match.id
    if (users.length < 1000) return null
  }
  return null
}

async function userFromToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(url, anon)
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) return null
  return data.user
}

async function requireAdmin(accessToken: string): Promise<{ user: { id: string; email?: string } } | { error: string }> {
  const user = await userFromToken(accessToken)
  if (!user) return { error: 'Sign in first.' }
  if (!isAdminEmail(user.email)) return { error: 'Not authorized.' }
  return { user }
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
    const authed = await requireAdmin(input.accessToken)
    if (!('user' in authed)) return { error: authed.error }
    const user = authed.user

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
    const verifiedById = new Map<string, boolean>()
    try {
      const { data: authUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
      for (const authUser of authUsers?.users || []) {
        if (authUser.created_at) createdById.set(authUser.id, authUser.created_at)
        const created = Date.parse(authUser.created_at || '')
        const lastSign = Date.parse(authUser.last_sign_in_at || '')
        verifiedById.set(
          authUser.id,
          Number.isFinite(created) && Number.isFinite(lastSign) && lastSign - created > 60_000
        )
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
    const appVisits = visits.filter((row) => row.tool === 'app')
    const clientVisits = visits.filter((row) => row.tool !== 'site' && row.tool !== 'app')

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

    const appVisitsByAgent = new Map<string, number>()
    const appVisitsThisWeekByAgent = new Map<string, number>()
    const lastVisitByAgent = new Map<string, string>()
    for (const row of appVisits) {
      if (!row.profile_id) continue
      appVisitsByAgent.set(row.profile_id, (appVisitsByAgent.get(row.profile_id) || 0) + 1)
      if (row.created_at >= weekAgo) {
        appVisitsThisWeekByAgent.set(row.profile_id, (appVisitsThisWeekByAgent.get(row.profile_id) || 0) + 1)
      }
      const previous = lastVisitByAgent.get(row.profile_id)
      if (!previous || row.created_at > previous) lastVisitByAgent.set(row.profile_id, row.created_at)
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
        emailVerified: verifiedById.get(row.id) === true,
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
        appVisits: appVisitsByAgent.get(row.id) || 0,
        appVisitsThisWeek: appVisitsThisWeekByAgent.get(row.id) || 0,
        lastVisit: lastVisitByAgent.get(row.id) || null,
      }
    }).sort((a, b) => {
      const aVisit = a.lastVisit ? Date.parse(a.lastVisit) : 0
      const bVisit = b.lastVisit ? Date.parse(b.lastVisit) : 0
      if (aVisit !== bVisit) return bVisit - aVisit
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
          verified: agents.filter((row) => row.emailVerified).length,
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
          appVisits: appVisits.length,
          appVisitsThisWeek: appVisits.filter((row) => row.created_at >= weekAgo).length,
          agentsActiveThisWeek: appVisitsThisWeekByAgent.size,
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

async function listStoragePaths(db: ReturnType<typeof admin>, prefix: string) {
  const paths: string[] = []
  const { data, error } = await db.storage.from('profiles').list(prefix, { limit: 1000 })
  if (error || !data) return paths
  for (const item of data) {
    const path = prefix ? `${prefix}/${item.name}` : item.name
    const isFolder = !item.id
    if (isFolder) paths.push(...await listStoragePaths(db, path))
    else paths.push(path)
  }
  return paths
}

async function removeUserImages(db: ReturnType<typeof admin>, userId: string) {
  const paths = await listStoragePaths(db, userId)
  if (!paths.length) return
  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100)
    const { error } = await db.storage.from('profiles').remove(chunk)
    if (error) console.error('admin storage remove', error.message)
  }
}

async function removeStripeCustomer(customerId?: string | null, subscriptionId?: string | null) {
  if (!customerId) return
  try {
    const stripe = getStripe()
    if (subscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscriptionId)
      } catch (err) {
        console.error('admin stripe cancel', err)
      }
    }
    await stripe.customers.del(customerId)
  } catch (err) {
    console.error('admin stripe delete customer', err)
  }
}

export async function deleteAdminUser(input: { accessToken: string; profileId: string }): Promise<
  { ok: true } | { error: string }
> {
  try {
    const authed = await requireAdmin(input.accessToken)
    if (!('user' in authed)) return { error: authed.error }

    const profileId = input.profileId?.trim()
    if (!profileId) return { error: 'Missing account.' }
    if (profileId === authed.user.id) return { error: 'You cannot delete your own account from here.' }

    const db = admin()
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('id, email, stripe_customer_id, stripe_subscription_id')
      .eq('id', profileId)
      .maybeSingle()

    if (profileError) {
      console.error('admin delete profile lookup', profileError.message)
      return { error: 'Could not find that account.' }
    }
    if (!profile) return { error: 'That account is already gone.' }
    if (isAdminEmail(profile.email)) return { error: 'Admin accounts cannot be deleted from here.' }

    await removeUserImages(db, profileId)
    await removeStripeCustomer(profile.stripe_customer_id, profile.stripe_subscription_id)

    const visitDelete = await db.from('link_visits').delete().eq('profile_id', profileId)
    if (visitDelete.error && !isMissingRelation(visitDelete.error)) {
      console.error('admin delete visits', visitDelete.error.message)
    }

    const { error: rowError } = await db.from('profiles').delete().eq('id', profileId)
    if (rowError) {
      console.error('admin delete profile', rowError.message)
      return { error: 'Could not delete their saved work.' }
    }

    const { error: authError } = await db.auth.admin.deleteUser(profileId)
    if (authError) {
      console.error('admin delete auth user', authError.message)
      return { error: 'Deleted their data, but the login account is still there. Try again.' }
    }

    return { ok: true }
  } catch (err) {
    console.error('deleteAdminUser', err)
    return { error: 'Could not delete that account.' }
  }
}

function publicOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://coolrealestatetools.com').replace(/\/$/, '')
}

function reportUrl(profileId: string, listingId: string) {
  return `${publicOrigin()}/report/${profileId}/${listingId}`
}

function editorUrl(token: string | null | undefined, listingId: string) {
  if (!token) return undefined
  return `${publicOrigin()}/open/${token}?listing=${encodeURIComponent(listingId)}`
}

function newEditorToken() {
  return crypto.randomUUID().replace(/-/g, '')
}

async function ensureEditorToken(
  db: ReturnType<typeof admin>,
  profileId: string,
  current?: string | null
) {
  if (current) return current
  const token = newEditorToken()
  const { error } = await db.from('profiles').update({ editor_token: token }).eq('id', profileId)
  if (error) return null
  return token
}

function emailMatch(email: string) {
  return email.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&')
}

function newId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10)
}

export async function importSellerReportsFromCsv(input: {
  accessToken: string
  csvText: string
}): Promise<{ error: string } | { created: number; added: number; exists: number; failed: number; rows: AdminImportResultRow[] }> {
  try {
    const authed = await requireAdmin(input.accessToken)
    if (!('user' in authed)) return { error: authed.error }

    const parsed = parseImportCsv(input.csvText || '')
    if (!parsed.rows.length) {
      return { error: parsed.errors[0]?.message || 'No data rows in that file.' }
    }
    if (parsed.rows.length > 400) {
      return { error: 'Cap is 400 rows. Split the file and import again.' }
    }

    const db = admin()
    const results: AdminImportResultRow[] = parsed.errors.map((item) => ({
      line: item.line,
      name: '',
      email: '',
      address: '',
      status: 'error',
      message: item.message,
    }))

    for (const row of parsed.rows) {
      try {
        let profileId = ''
        let createdAccount = false
        let editorToken: string | null = null

        let existingProfile = await db
          .from('profiles')
          .select('id, full_name, phone, brokerage, editor_token, imported')
          .ilike('email', emailMatch(row.email))
          .maybeSingle()
        if (existingProfile.error) {
          existingProfile = await db
            .from('profiles')
            .select('id, full_name, phone, brokerage')
            .ilike('email', emailMatch(row.email))
            .maybeSingle()
        }
        if (existingProfile.error) {
          results.push({
            line: row.line,
            name: row.name,
            email: row.email,
            address: row.address,
            status: 'error',
            message: existingProfile.error.message,
          })
          continue
        }

        if (existingProfile.data?.id) {
          profileId = existingProfile.data.id
          editorToken = (existingProfile.data as { editor_token?: string | null }).editor_token || null
          const patch: Record<string, unknown> = {
            email: row.email,
            updated_at: new Date().toISOString(),
          }
          if (row.name) patch.full_name = row.name
          if (row.phone) patch.phone = row.phone
          if (row.brokerage) patch.brokerage = row.brokerage
          await db.from('profiles').update(patch).eq('id', profileId)
        } else {
          const password = `${crypto.randomUUID()}${crypto.randomUUID()}`
          const created = await db.auth.admin.createUser({
            email: row.email,
            password,
            email_confirm: true,
            user_metadata: { full_name: row.name },
          })
          if (created.error || !created.data.user?.id) {
            const already = (created.error?.message || '').toLowerCase()
            const status = Number((created.error as { status?: number } | null)?.status || 0)
            if (created.error && (status === 422 || already.includes('already') || already.includes('registered') || already.includes('exists'))) {
              const existingId = await findAuthUserIdByEmail(db, row.email)
              if (!existingId) {
                results.push({
                  line: row.line,
                  name: row.name,
                  email: row.email,
                  address: row.address,
                  status: 'error',
                  message: created.error.message,
                })
                continue
              }
              profileId = existingId
            } else {
              results.push({
                line: row.line,
                name: row.name,
                email: row.email,
                address: row.address,
                status: 'error',
                message: created.error?.message || 'Could not create the account.',
              })
              continue
            }
          } else {
            profileId = created.data.user.id
            createdAccount = true
          }

          editorToken = newEditorToken()
          const trial = appTrialFields()
          const profileRow = {
            id: profileId,
            email: row.email,
            full_name: row.name,
            phone: row.phone || null,
            brokerage: row.brokerage || null,
            pdf_look: 'look8',
            show_custom_header: false,
            imported: true,
            editor_token: editorToken,
            workspace_version: 2,
            updated_at: new Date().toISOString(),
            ...trial,
          }
          const saved = await db.from('profiles').upsert(profileRow)
          if (saved.error) {
            const retry = await db.from('profiles').upsert({
              id: profileId,
              email: row.email,
              full_name: row.name,
              phone: row.phone || null,
              brokerage: row.brokerage || null,
              pdf_look: 'look8',
              show_custom_header: false,
              workspace_version: 2,
              updated_at: new Date().toISOString(),
              ...trial,
            })
            if (retry.error) {
              results.push({
                line: row.line,
                name: row.name,
                email: row.email,
                address: row.address,
                status: 'error',
                message: retry.error.message,
              })
              continue
            }
          }
        }

        const listings = await db
          .from('listings')
          .select('id, address')
          .eq('profile_id', profileId)
        if (listings.error && !isMissingRelation(listings.error)) {
          results.push({
            line: row.line,
            name: row.name,
            email: row.email,
            address: row.address,
            status: 'error',
            message: listings.error.message,
          })
          continue
        }

        const match = (listings.data || []).find(
          (listing) => normalizeAddress(listing.address || '') === normalizeAddress(row.address)
        )
        const listingId = match?.id || newId()
        if (!match) {
          const inserted = await db.from('listings').insert({
            id: listingId,
            profile_id: profileId,
            address: row.address,
            activities: starterActivities(row.listedOn),
            updated_at: new Date().toISOString(),
          })
          if (inserted.error) {
            results.push({
              line: row.line,
              name: row.name,
              email: row.email,
              address: row.address,
              status: 'error',
              message: inserted.error.message,
            })
            continue
          }
        }

        editorToken = await ensureEditorToken(db, profileId, editorToken)
        results.push({
          line: row.line,
          name: row.name,
          email: row.email,
          address: row.address,
          status: match ? 'exists' : createdAccount ? 'created' : 'added',
          reportUrl: reportUrl(profileId, listingId),
          editorUrl: editorUrl(editorToken, listingId),
          message: match ? 'Already had this listing.' : undefined,
        })
      } catch (err) {
        results.push({
          line: row.line,
          name: row.name,
          email: row.email,
          address: row.address,
          status: 'error',
          message: err instanceof Error ? err.message : 'Could not import this row.',
        })
      }
    }

    results.sort((a, b) => a.line - b.line)
    return {
      created: results.filter((row) => row.status === 'created').length,
      added: results.filter((row) => row.status === 'added').length,
      exists: results.filter((row) => row.status === 'exists').length,
      failed: results.filter((row) => row.status === 'error').length,
      rows: results,
    }
  } catch (err) {
    console.error('importSellerReportsFromCsv', err)
    return { error: 'Could not import that file.' }
  }
}

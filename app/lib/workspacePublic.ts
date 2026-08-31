import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { OPENHOUSE_FEEDBACK_KIND } from '@/app/lib/openhouseFeedback'
import { PROSPECT_STORE_KIND } from '@/app/lib/prospects'
import { isNetSheet } from '@/app/lib/netSheet'
import { unpackTourData } from '@/app/lib/tourHomes'
import { isMissingRelation, workspaceFromProfileJson } from '@/app/lib/workspace'
import { loadWorkspaceTables } from '@/app/lib/workspaceDb'

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function loadPublicProfile(supabase: SupabaseClient, profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()
  return { profile: data, error }
}

export async function loadPublicWorkspace(supabase: SupabaseClient, profileId: string, profile: any) {
  const loaded = await loadWorkspaceTables(supabase, profileId)
  if (!loaded.error && loaded.workspace) {
    const hasRows = Boolean(
      loaded.workspace.listings.length ||
      loaded.workspace.homes.length ||
      loaded.workspace.clients.length ||
      loaded.workspace.neighborhoods.length ||
      loaded.workspace.outreachCampaigns.length
    )
    if (hasRows || (profile?.workspace_version || 1) >= 2) return loaded.workspace
  }
  if (loaded.error && !isMissingRelation(loaded.error)) {
    console.error('Error loading public workspace tables:', loaded.error)
  }
  return workspaceFromProfileJson(profile)
}

export async function findPublicCampaign(
  supabase: SupabaseClient,
  profileId: string,
  campaignId: string,
  kind: 'feedback' | 'advice'
) {
  const { profile } = await loadPublicProfile(supabase, profileId)
  if (!profile) return { profile: null, campaign: null }

  const workspace = await loadPublicWorkspace(supabase, profileId, profile)
  const campaign = workspace.outreachCampaigns.find((item: any) => {
    if (item.id !== campaignId) return false
    if (kind === 'feedback') return item.kind === OPENHOUSE_FEEDBACK_KIND
    return item.kind !== OPENHOUSE_FEEDBACK_KIND && item.kind !== PROSPECT_STORE_KIND
  })
  return { profile, campaign: campaign || null }
}

export async function findPublicTour(
  supabase: SupabaseClient,
  profileId: string,
  clientId: string,
  tourId: string
) {
  const { profile } = await loadPublicProfile(supabase, profileId)
  if (!profile) return { profile: null, client: null, tour: null, homes: [] }

  const workspace = await loadPublicWorkspace(supabase, profileId, profile)
  const { people } = unpackTourData(workspace.clients)
  const client = people.find((person) => person.id === clientId) || null
  const tour = client?.tours?.find((item) => item.id === tourId) || null
  return { profile, client, tour, homes: workspace.homes }
}

export async function findPublicListing(
  supabase: SupabaseClient,
  profileId: string,
  listingId: string
) {
  const { profile } = await loadPublicProfile(supabase, profileId)
  if (!profile) return { profile: null, listing: null }

  const workspace = await loadPublicWorkspace(supabase, profileId, profile)
  const listing = workspace.listings.find((item: any) => item.id === listingId && !isNetSheet(item)) || null
  return { profile, listing }
}

export async function findPublicNetSheet(
  supabase: SupabaseClient,
  profileId: string,
  sheetId: string
) {
  const { profile } = await loadPublicProfile(supabase, profileId)
  if (!profile) return { profile: null, sheet: null }

  const workspace = await loadPublicWorkspace(supabase, profileId, profile)
  const sheet = workspace.listings.find((item: any) => item.id === sheetId && isNetSheet(item)) || null
  return { profile, sheet }
}

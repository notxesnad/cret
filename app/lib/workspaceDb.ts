import {
  assembleWorkspace,
  decomposeWorkspace,
  emptyWorkspace,
  isMissingRelation,
  WORKSPACE_VERSION,
  type WorkspaceData,
} from '@/app/lib/workspace'

type SupabaseLike = {
  from: (table: string) => any
}

async function syncRows(
  supabase: SupabaseLike,
  table: string,
  profileId: string,
  rows: { id: string }[]
) {
  const { data: existing, error: readError } = await supabase
    .from(table)
    .select('id')
    .eq('profile_id', profileId)

  if (readError) return readError

  const nextIds = new Set(rows.map((row) => row.id).filter(Boolean))
  const toDelete = (existing || []).map((row: { id: string }) => row.id).filter((id: string) => !nextIds.has(id))
  if (toDelete.length) {
    const { error } = await supabase.from(table).delete().in('id', toDelete)
    if (error) return error
  }
  if (rows.length) {
    const { error } = await supabase.from(table).upsert(rows)
    if (error) return error
  }
  return null
}

export async function probeWorkspaceTables(supabase: SupabaseLike) {
  const { error } = await supabase.from('listings').select('id').limit(1)
  if (!error) return true
  return !isMissingRelation(error)
}

export async function loadWorkspaceTables(supabase: SupabaseLike, profileId: string) {
  const listings = await supabase.from('listings').select('*').eq('profile_id', profileId)
  if (listings.error) return { error: listings.error, workspace: null as WorkspaceData | null }

  const [netSheets, homes, clients, tours, neighborhoods, campaigns, responses, prospects] = await Promise.all([
    supabase.from('net_sheets').select('*').eq('profile_id', profileId),
    supabase.from('tour_homes').select('*').eq('profile_id', profileId),
    supabase.from('clients').select('*').eq('profile_id', profileId),
    supabase.from('tours').select('*').eq('profile_id', profileId),
    supabase.from('neighborhoods').select('*').eq('profile_id', profileId),
    supabase.from('campaigns').select('*').eq('profile_id', profileId),
    supabase.from('campaign_responses').select('*').eq('profile_id', profileId),
    supabase.from('prospects').select('*').eq('profile_id', profileId),
  ])

  const firstError = [netSheets, homes, clients, tours, neighborhoods, campaigns, responses, prospects]
    .map((result) => result.error)
    .find(Boolean)
  if (firstError) return { error: firstError, workspace: null as WorkspaceData | null }

  return {
    error: null,
    workspace: assembleWorkspace({
      listings: listings.data,
      netSheets: netSheets.data,
      homes: homes.data,
      clients: clients.data,
      tours: tours.data,
      neighborhoods: neighborhoods.data,
      campaigns: campaigns.data,
      responses: responses.data,
      prospects: prospects.data,
    }),
  }
}

export async function saveWorkspaceTables(
  supabase: SupabaseLike,
  profileId: string,
  workspace: WorkspaceData,
  options?: { migrateResponses?: boolean }
) {
  const parts = decomposeWorkspace(profileId, workspace)

  const campaignError = await syncRows(supabase, 'campaigns', profileId, parts.campaignRows)
  if (campaignError) return campaignError

  const errors = await Promise.all([
    syncRows(supabase, 'listings', profileId, parts.listingRows),
    syncRows(supabase, 'net_sheets', profileId, parts.netSheetRows),
    syncRows(supabase, 'tour_homes', profileId, parts.homeRows),
    syncRows(supabase, 'clients', profileId, parts.clientRows),
    syncRows(supabase, 'neighborhoods', profileId, parts.neighborhoodRows),
    syncRows(supabase, 'prospects', profileId, parts.prospectRows),
  ])
  const first = errors.find(Boolean)
  if (first) return first

  const tourError = await syncRows(supabase, 'tours', profileId, parts.tourRows)
  if (tourError) return tourError

  if (options?.migrateResponses && parts.responseRows.length) {
    const { error } = await supabase.from('campaign_responses').upsert(parts.responseRows)
    if (error) return error
  }

  const { error: versionError } = await supabase
    .from('profiles')
    .update({ workspace_version: WORKSPACE_VERSION, updated_at: new Date().toISOString() })
    .eq('id', profileId)
  if (versionError && !isMissingRelation(versionError)) return versionError

  return null
}

export async function loadOrMigrateWorkspace(
  supabase: SupabaseLike,
  profileId: string,
  jsonWorkspace: WorkspaceData,
  workspaceVersion?: number | null
) {
  const tablesReady = await probeWorkspaceTables(supabase)
  if (!tablesReady) {
    return { tablesReady: false, workspace: jsonWorkspace, migrated: false }
  }

  const loaded = await loadWorkspaceTables(supabase, profileId)
  if (loaded.error || !loaded.workspace) {
    if (loaded.error && isMissingRelation(loaded.error)) {
      return { tablesReady: false, workspace: jsonWorkspace, migrated: false }
    }
    if (loaded.error) console.error('Error loading workspace tables:', loaded.error)
    return { tablesReady: true, workspace: jsonWorkspace, migrated: false }
  }

  const tableWorkspace = loaded.workspace
  const hasTableRows = Boolean(
    tableWorkspace.listings.length ||
    tableWorkspace.homes.length ||
    tableWorkspace.clients.length ||
    tableWorkspace.neighborhoods.length ||
    tableWorkspace.outreachCampaigns.length
  )
  const hasJsonRows = Boolean(
    jsonWorkspace.listings.length ||
    jsonWorkspace.homes.length ||
    jsonWorkspace.clients.length ||
    jsonWorkspace.neighborhoods.length ||
    jsonWorkspace.outreachCampaigns.length
  )

  if ((workspaceVersion || 1) >= WORKSPACE_VERSION || hasTableRows) {
    return { tablesReady: true, workspace: tableWorkspace, migrated: false }
  }

  if (hasJsonRows) {
    const migrateError = await saveWorkspaceTables(supabase, profileId, jsonWorkspace, { migrateResponses: true })
    if (migrateError) {
      console.error('Error migrating workspace JSON to tables:', migrateError)
      return { tablesReady: true, workspace: jsonWorkspace, migrated: false }
    }
    return { tablesReady: true, workspace: jsonWorkspace, migrated: true }
  }

  return { tablesReady: true, workspace: emptyWorkspace(), migrated: false }
}

import { isNetSheet, NET_SHEET_KIND, type NetSheet } from '@/app/lib/netSheet'
import { OPENHOUSE_FEEDBACK_KIND } from '@/app/lib/openhouseFeedback'
import {
  PROSPECT_KIND,
  PROSPECT_STORE_ID,
  PROSPECT_STORE_KIND,
  type Prospect,
} from '@/app/lib/prospects'
import {
  hydrateTourWorkspace,
  packPeopleAndProspects,
  unpackTourData,
  type TourHome,
} from '@/app/lib/tourHomes'

export const WORKSPACE_VERSION = 2

export type WorkspaceData = {
  listings: any[]
  neighborhoods: any[]
  outreachCampaigns: any[]
  clients: any[]
  homes: TourHome[]
}

export function emptyWorkspace(): WorkspaceData {
  return {
    listings: [],
    neighborhoods: [],
    outreachCampaigns: [],
    clients: [],
    homes: [],
  }
}

export function workspaceFromProfileJson(profile: {
  listings?: any[]
  neighborhoods?: any[]
  outreach_campaigns?: any[]
  clients?: any[]
  homes?: TourHome[]
} | null | undefined): WorkspaceData {
  const hydrated = hydrateTourWorkspace(profile?.clients, profile?.homes)
  return {
    listings: Array.isArray(profile?.listings) ? profile.listings : [],
    neighborhoods: Array.isArray(profile?.neighborhoods) ? profile.neighborhoods : [],
    outreachCampaigns: Array.isArray(profile?.outreach_campaigns) ? profile.outreach_campaigns : [],
    clients: hydrated.clients,
    homes: hydrated.homes,
  }
}

export function isMissingRelation(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false
  const message = error.message || ''
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /does not exist/i.test(message) ||
    /schema cache/i.test(message) ||
    /could not find the table/i.test(message)
  )
}

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

export function assembleWorkspace(rows: {
  listings?: any[]
  netSheets?: any[]
  homes?: any[]
  clients?: any[]
  tours?: any[]
  neighborhoods?: any[]
  campaigns?: any[]
  responses?: any[]
  prospects?: any[]
}): WorkspaceData {
  const listings = asArray(rows.listings).map((row) => ({
    id: row.id,
    address: row.address || '',
    city: row.city || undefined,
    state: row.state || undefined,
    county: row.county || undefined,
    activities: Array.isArray(row.activities) ? row.activities : [],
  }))

  const netSheets = asArray(rows.netSheets).map((row) => {
    const data = row.data && typeof row.data === 'object' ? row.data : {}
    return {
      ...data,
      id: row.id,
      kind: NET_SHEET_KIND,
      listingId: row.listing_id || data.listingId,
    } as NetSheet
  })

  const homes: TourHome[] = asArray(rows.homes).map((row) => ({
    id: row.id,
    address: row.address || '',
    city: row.city || undefined,
    state: row.state || undefined,
    price: row.price || undefined,
    notes: row.notes || undefined,
    photo_url: row.photo_url || undefined,
    mls_pdf_url: row.mls_pdf_url || undefined,
  }))

  const toursByClient = new Map<string, any[]>()
  for (const tour of asArray(rows.tours)) {
    const list = toursByClient.get(tour.client_id) || []
    list.push({
      id: tour.id,
      title: tour.title || '',
      date: tour.date || undefined,
      stops: Array.isArray(tour.stops) ? tour.stops : [],
    })
    toursByClient.set(tour.client_id, list)
  }

  const people = asArray(rows.clients).map((row) => ({
    id: row.id,
    name: row.name || '',
    email: row.email || undefined,
    phone: row.phone || undefined,
    homeNotes: row.home_notes && typeof row.home_notes === 'object' ? row.home_notes : {},
    tours: toursByClient.get(row.id) || [],
  }))

  const prospects = asArray(rows.prospects).map((row) => ({
    id: row.id,
    kind: PROSPECT_KIND,
    profileId: row.profile_id,
    name: row.name || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    sourceTool: row.source_tool,
    sourceId: row.source_id || undefined,
    listingId: row.listing_id || undefined,
    listingAddress: row.listing_address || undefined,
    createdAt: row.created_at,
  }))

  const responsesByCampaign = new Map<string, any[]>()
  for (const response of asArray(rows.responses)) {
    const list = responsesByCampaign.get(response.campaign_id) || []
    list.push({
      id: response.id,
      date: response.created_at,
      answers: response.answers,
    })
    responsesByCampaign.set(response.campaign_id, list)
  }

  const outreachCampaigns = asArray(rows.campaigns)
    .filter((row) => row.kind !== PROSPECT_STORE_KIND)
    .map((row) => ({
      id: row.id,
      kind: row.kind || undefined,
      title: row.title || '',
      description: row.description || '',
      questions: Array.isArray(row.questions) ? row.questions : [],
      theme: row.theme || undefined,
      listingId: row.listing_id || undefined,
      listingAddress: row.listing_address || undefined,
      createdAt: row.created_at,
      responses: responsesByCampaign.get(row.id) || [],
    }))

  const neighborhoods = asArray(rows.neighborhoods).map((row) => ({
    id: row.id,
    name: row.name || '',
    cityState: row.city_state || '',
    prompt: row.prompt || '',
    csvData: row.csv_data || '',
    questions: Array.isArray(row.questions) ? row.questions : [],
  }))

  return {
    listings: [...listings, ...netSheets],
    neighborhoods,
    outreachCampaigns,
    clients: packPeopleAndProspects(people, prospects),
    homes,
  }
}

function campaignKind(campaign: { kind?: string }) {
  return campaign.kind || null
}

export function decomposeWorkspace(profileId: string, workspace: WorkspaceData) {
  const propertyListings = (workspace.listings || []).filter((item: { kind?: string }) => !isNetSheet(item))
  const netSheets = (workspace.listings || []).filter(isNetSheet)
  const { people, prospects } = unpackTourData(workspace.clients)

  const listingRows = propertyListings.map((listing: any) => ({
    id: listing.id,
    profile_id: profileId,
    address: listing.address || '',
    city: listing.city || null,
    state: listing.state || null,
    county: listing.county || null,
    activities: Array.isArray(listing.activities) ? listing.activities : [],
    updated_at: new Date().toISOString(),
  }))

  const netSheetRows = netSheets.map((sheet) => ({
    id: sheet.id,
    profile_id: profileId,
    listing_id: sheet.listingId || null,
    data: sheet,
    updated_at: sheet.updatedAt || new Date().toISOString(),
  }))

  const homeRows = (workspace.homes || []).map((home) => ({
    id: home.id,
    profile_id: profileId,
    address: home.address || '',
    city: home.city || null,
    state: home.state || null,
    price: home.price || null,
    notes: home.notes || null,
    photo_url: home.photo_url || null,
    mls_pdf_url: home.mls_pdf_url || null,
  }))

  const clientRows = people.map((person) => ({
    id: person.id,
    profile_id: profileId,
    name: person.name || '',
    email: person.email || null,
    phone: person.phone || null,
    home_notes: person.homeNotes || {},
  }))

  const tourRows = people.flatMap((person) =>
    (person.tours || []).map((tour) => ({
      id: tour.id,
      profile_id: profileId,
      client_id: person.id,
      title: tour.title || '',
      date: tour.date || null,
      stops: Array.isArray(tour.stops) ? tour.stops : [],
    }))
  )

  const neighborhoodRows = (workspace.neighborhoods || []).map((item: any) => ({
    id: item.id,
    profile_id: profileId,
    name: item.name || '',
    city_state: item.cityState || null,
    prompt: item.prompt || null,
    csv_data: item.csvData || null,
    questions: Array.isArray(item.questions) ? item.questions : [],
  }))

  const campaignRows = (workspace.outreachCampaigns || [])
    .filter((campaign: { id?: string; kind?: string }) =>
      campaign.id && campaign.id !== PROSPECT_STORE_ID && campaign.kind !== PROSPECT_STORE_KIND
    )
    .map((campaign: any) => ({
      id: campaign.id,
      profile_id: profileId,
      kind: campaignKind(campaign),
      title: campaign.title || '',
      description: campaign.description || null,
      questions: Array.isArray(campaign.questions) ? campaign.questions : [],
      theme: campaign.theme || null,
      listing_id: campaign.listingId || null,
      listing_address: campaign.listingAddress || null,
      created_at: campaign.createdAt || new Date().toISOString(),
    }))

  const responseRows = (workspace.outreachCampaigns || []).flatMap((campaign: any) =>
    asArray(campaign.responses).map((response: any, index: number) => ({
      id: response.id || `${campaign.id}-${index}`,
      campaign_id: campaign.id,
      profile_id: profileId,
      answers: response.answers ?? response,
      created_at: response.date || response.createdAt || new Date().toISOString(),
    }))
  )

  const prospectRows = prospects
    .filter((item: Prospect | any) => item?.kind === PROSPECT_KIND || item?.sourceTool)
    .map((item: any) => ({
      id: item.id,
      profile_id: profileId,
      name: item.name || null,
      email: item.email || null,
      phone: item.phone || null,
      source_tool: item.sourceTool || 'advice',
      source_id: item.sourceId || null,
      listing_id: item.listingId || null,
      listing_address: item.listingAddress || null,
      created_at: item.createdAt || new Date().toISOString(),
    }))

  const storeProspects = (workspace.outreachCampaigns || [])
    .filter((campaign: any) => campaign.id === PROSPECT_STORE_ID || campaign.kind === PROSPECT_STORE_KIND)
    .flatMap((campaign: any) => asArray(campaign.items))
    .map((item: any) => ({
      id: item.id,
      profile_id: profileId,
      name: item.name || null,
      email: item.email || null,
      phone: item.phone || null,
      source_tool: item.sourceTool || 'advice',
      source_id: item.sourceId || null,
      listing_id: item.listingId || null,
      listing_address: item.listingAddress || null,
      created_at: item.createdAt || new Date().toISOString(),
    }))

  return {
    listingRows,
    netSheetRows,
    homeRows,
    clientRows,
    tourRows,
    neighborhoodRows,
    campaignRows,
    responseRows,
    prospectRows: [...prospectRows, ...storeProspects],
  }
}

export function findCampaignInWorkspace(
  workspace: WorkspaceData,
  campaignId: string,
  kind?: string | null
) {
  return workspace.outreachCampaigns.find((campaign: any) => {
    if (campaign.id !== campaignId) return false
    if (kind === OPENHOUSE_FEEDBACK_KIND) return campaign.kind === OPENHOUSE_FEEDBACK_KIND
    if (kind === 'advice') return campaign.kind !== OPENHOUSE_FEEDBACK_KIND && campaign.kind !== PROSPECT_STORE_KIND
    return true
  })
}

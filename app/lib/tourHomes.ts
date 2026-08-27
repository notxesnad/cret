export const TOUR_HOME_STORE_KIND = 'home_store'
export const TOUR_HOME_STORE_ID = '__homes__'

export interface TourHome {
  id: string
  address: string
  city?: string
  state?: string
  price?: string
  notes?: string
  photo_url?: string
  mls_pdf_url?: string
}

export interface TourStop {
  homeId: string
  time?: string
}

export interface ClientTour {
  id: string
  title: string
  date?: string
  stops: TourStop[]
}

export interface TourClient {
  id: string
  name: string
  email?: string
  phone?: string
  tours: ClientTour[]
  homeNotes?: Record<string, string>
  homes?: TourHome[]
  kind?: string
}

export function isTourHomeStore(record: { kind?: string; id?: string } | null | undefined) {
  return record?.kind === TOUR_HOME_STORE_KIND || record?.id === TOUR_HOME_STORE_ID
}

export function mergeTourHomes(...lists: Array<TourHome[] | undefined | null>): TourHome[] {
  const byId = new Map<string, TourHome>()
  for (const list of lists) {
    for (const home of list || []) {
      if (!home?.id) continue
      const existing = byId.get(home.id)
      byId.set(home.id, existing ? { ...home, ...existing } : home)
    }
  }
  return [...byId.values()]
}

export function unpackTourData(records: any[] | null | undefined) {
  const list = Array.isArray(records) ? records : []
  const prospects: any[] = []
  const people: TourClient[] = []
  const nested: TourHome[] = []
  let stored: TourHome[] = []

  for (const record of list) {
    if (!record || typeof record !== 'object') continue
    if (isTourHomeStore(record)) {
      stored = Array.isArray(record.homes) ? record.homes : []
      continue
    }
    if (record.kind === 'prospect' || record.kind === 'prospect_store' || record.id === '__prospects__') {
      prospects.push(record)
      continue
    }
    const homes = Array.isArray(record.homes) ? record.homes : []
    nested.push(...homes)
    const { homes: _ignored, ...rest } = record
    people.push({
      ...rest,
      tours: Array.isArray(record.tours) ? record.tours : [],
      homeNotes: record.homeNotes && typeof record.homeNotes === 'object' ? record.homeNotes : {},
    })
  }

  return {
    people,
    homes: mergeTourHomes(stored, nested),
    prospects,
  }
}

export function hydrateTourClients(records: any[] | null | undefined, extraHomes?: TourHome[] | null) {
  const { people, homes, prospects } = unpackTourData(records)
  return packTourData(people, mergeTourHomes(extraHomes, homes), prospects)
}

export function resolveTourHomes(profile: { clients?: any[]; homes?: TourHome[] | null } | null | undefined) {
  if (!profile) return []
  return mergeTourHomes(profile.homes, unpackTourData(profile.clients).homes)
}

export function packTourData(people: TourClient[], homes: TourHome[], prospects: any[] = []) {
  const store = {
    id: TOUR_HOME_STORE_ID,
    kind: TOUR_HOME_STORE_KIND,
    homes,
  }
  const clients = people.map(({ homes: _ignored, ...rest }) => ({
    ...rest,
    tours: rest.tours || [],
    homeNotes: rest.homeNotes || {},
  }))
  return [store, ...clients, ...prospects]
}

export function homesOnClientTours(client: Pick<TourClient, 'tours'>) {
  return new Set((client.tours || []).flatMap(tour => (tour.stops || []).map(stop => stop.homeId))).size
}

export const TOUR_HOMES_COLUMN_SQL = `
alter table public.profiles add column if not exists homes jsonb default '[]'::jsonb;
`

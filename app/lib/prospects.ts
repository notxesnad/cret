export const PROSPECT_KIND = 'prospect'
export const PROSPECT_STORE_KIND = 'prospect_store'
export const PROSPECT_STORE_ID = '__prospects__'

export type ProspectSourceTool =
  | 'openhouse_feedback'
  | 'openhouse_signin'
  | 'advice'
  | 'seller_report'
  | 'tour'

export interface Prospect {
  id: string
  kind: typeof PROSPECT_KIND
  profileId: string
  name?: string
  email?: string
  phone?: string
  sourceTool: ProspectSourceTool
  sourceId?: string
  listingId?: string
  listingAddress?: string
  createdAt: string
}

export function isProspect(record: { kind?: string } | null | undefined) {
  return record?.kind === PROSPECT_KIND
}

export const PROSPECTS_TABLE_SQL = `
create table if not exists public.prospects (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  email text,
  phone text,
  source_tool text not null,
  source_id text,
  listing_id text,
  listing_address text,
  created_at timestamptz not null default now()
);
alter table public.prospects enable row level security;
`

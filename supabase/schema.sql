-- Production workspace schema.
-- Run this in the Supabase SQL editor. Safe to re-run.
-- After this is live, drop leftover JSON blobs with cleanup-profile-json.sql.

alter table public.profiles
  add column if not exists workspace_version integer default 1;

create table if not exists public.listings (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  address text not null default '',
  city text,
  state text,
  county text,
  activities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists listings_profile_id_idx on public.listings (profile_id);

create table if not exists public.net_sheets (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  listing_id text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists net_sheets_profile_id_idx on public.net_sheets (profile_id);

create table if not exists public.tour_homes (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  address text not null default '',
  city text,
  state text,
  price text,
  notes text,
  photo_url text,
  mls_pdf_url text,
  created_at timestamptz not null default now()
);
create index if not exists tour_homes_profile_id_idx on public.tour_homes (profile_id);

create table if not exists public.clients (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default '',
  email text,
  phone text,
  home_notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists clients_profile_id_idx on public.clients (profile_id);

create table if not exists public.tours (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  client_id text not null references public.clients(id) on delete cascade,
  title text not null default '',
  date text,
  stops jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists tours_profile_id_idx on public.tours (profile_id);
create index if not exists tours_client_id_idx on public.tours (client_id);

create table if not exists public.neighborhoods (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default '',
  city_state text,
  prompt text,
  csv_data text,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists neighborhoods_profile_id_idx on public.neighborhoods (profile_id);

create table if not exists public.campaigns (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text,
  title text not null default '',
  description text,
  questions jsonb not null default '[]'::jsonb,
  theme text,
  listing_id text,
  listing_address text,
  created_at timestamptz not null default now()
);
create index if not exists campaigns_profile_id_idx on public.campaigns (profile_id);

create table if not exists public.campaign_responses (
  id text primary key,
  campaign_id text not null references public.campaigns(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists campaign_responses_campaign_id_idx on public.campaign_responses (campaign_id);
create index if not exists campaign_responses_profile_id_idx on public.campaign_responses (profile_id);

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
create index if not exists prospects_profile_id_idx on public.prospects (profile_id);

alter table public.listings enable row level security;
alter table public.net_sheets enable row level security;
alter table public.tour_homes enable row level security;
alter table public.clients enable row level security;
alter table public.tours enable row level security;
alter table public.neighborhoods enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_responses enable row level security;
alter table public.prospects enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'listings', 'net_sheets', 'tour_homes', 'clients', 'tours',
    'neighborhoods', 'campaigns', 'campaign_responses', 'prospects'
  ]
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      t || '_owner_all',
      t
    );
    execute format(
      'create policy %I on public.%I for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id)',
      t || '_owner_all',
      t
    );
  end loop;
end $$;

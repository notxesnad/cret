-- Click tracking for homepage landings and shared client links.
-- Run this in the Supabase SQL editor. Safe to re-run.
-- Dashboard: /admin  (sign in first; set ADMIN_EMAILS in Vercel to your login email)

create table if not exists public.link_visits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  tool text not null,
  path text not null default '',
  source_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists link_visits_created_at_idx on public.link_visits (created_at desc);
create index if not exists link_visits_profile_id_idx on public.link_visits (profile_id);
create index if not exists link_visits_tool_idx on public.link_visits (tool);
create index if not exists link_visits_utm_campaign_idx on public.link_visits (utm_campaign);

alter table public.link_visits enable row level security;
-- No policies: only the service role (server) can read or write.

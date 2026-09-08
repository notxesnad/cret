-- Client / home CRM fields. Run in the Supabase SQL editor. Safe to re-run.

alter table public.clients
  add column if not exists archived boolean not null default false;

alter table public.listings
  add column if not exists archived boolean not null default false,
  add column if not exists client_id text;

alter table public.tour_homes
  add column if not exists archived boolean not null default false;

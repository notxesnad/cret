-- Run AFTER deploying the app that no longer writes workspace JSON on profiles.
-- Profiles then only store identity and branding. Listings, tours, campaigns,
-- and the rest live in their own tables.

update public.profiles set
  listings = '[]'::jsonb,
  neighborhoods = '[]'::jsonb,
  outreach_campaigns = '[]'::jsonb,
  clients = '[]'::jsonb,
  homes = '[]'::jsonb;

alter table public.profiles
  drop column if exists listings,
  drop column if exists neighborhoods,
  drop column if exists outreach_campaigns,
  drop column if exists clients,
  drop column if exists homes;

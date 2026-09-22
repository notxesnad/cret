-- Short address links for seller-report texts, e.g. /123-oak-k7m2
-- Safe to re-run.

alter table public.listings
  add column if not exists editor_slug text;

create unique index if not exists listings_editor_slug_idx
  on public.listings (editor_slug)
  where editor_slug is not null;

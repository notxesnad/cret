-- Subscription columns on profiles. Safe to re-run.
-- Stripe is the source of truth; these fields are updated by the webhook.

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists subscription_price_id text,
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists promo_code text;

create unique index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

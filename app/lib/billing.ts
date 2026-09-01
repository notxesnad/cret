export const DEFAULT_TRIAL_PERIOD_DAYS = 14

export type BillingState = {
  status: string | null
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  promoCode: string | null
}

export function trialPeriodDays() {
  const raw = Number(
    process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS
    || process.env.TRIAL_PERIOD_DAYS
    || DEFAULT_TRIAL_PERIOD_DAYS
  )
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TRIAL_PERIOD_DAYS
}

export function appTrialFields() {
  return {
    subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() + trialPeriodDays() * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export function emptyBilling(): BillingState {
  return {
    status: null,
    trialEndsAt: null,
    currentPeriodEnd: null,
    promoCode: null,
  }
}

export function billingFromProfile(profile: {
  subscription_status?: string | null
  trial_ends_at?: string | null
  subscription_current_period_end?: string | null
  promo_code?: string | null
} | null | undefined): BillingState {
  return {
    status: profile?.subscription_status || null,
    trialEndsAt: profile?.trial_ends_at || null,
    currentPeriodEnd: profile?.subscription_current_period_end || null,
    promoCode: profile?.promo_code || null,
  }
}

export function isPaid(status?: string | null) {
  return status === 'active' || status === 'past_due'
}

export function isSubscribed(status?: string | null) {
  return isPaid(status)
}

export function hasShareAccess(billing: BillingState) {
  if (isPaid(billing.status)) return true
  if (billing.trialEndsAt && Date.parse(billing.trialEndsAt) > Date.now()) return true
  return false
}

export function billingLabel(billing: BillingState) {
  if (billing.status === 'past_due') return 'Payment issue'
  if (billing.status === 'active') return 'Subscribed'
  if (hasShareAccess(billing)) return 'Trial'
  if (billing.status === 'canceled') return 'Canceled'
  return null
}

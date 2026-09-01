export type BillingState = {
  status: string | null
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  promoCode: string | null
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

export function isSubscribed(status?: string | null) {
  return status === 'active' || status === 'trialing'
}

export function billingLabel(status?: string | null) {
  if (status === 'trialing') return 'Trial'
  if (status === 'active') return 'Subscribed'
  if (status === 'past_due') return 'Payment issue'
  if (status === 'canceled') return 'Canceled'
  return null
}

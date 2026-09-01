'use server'

import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import {
  appUrl,
  findPromotionCode,
  getStripe,
  missingStripeConfig,
  stripePriceId,
  stripeSecretKey,
  TRIAL_DAYS,
} from '@/app/lib/stripe'
import { isSubscribed } from '@/app/lib/billing'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

async function userFromToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(url, anon)
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) return null
  return data.user
}

export async function startCheckout(input: { accessToken: string; promoCode?: string }) {
  const missing = missingStripeConfig()
  if (missing) {
    console.error('Stripe checkout missing env:', missing)
    return { error: 'Billing is not configured yet.' }
  }

  const user = await userFromToken(input.accessToken)
  if (!user) return { error: 'Sign in first.' }

  const { data: profile } = await admin()
    .from('profiles')
    .select('stripe_customer_id, subscription_status, email')
    .eq('id', user.id)
    .maybeSingle()

  if (isSubscribed(profile?.subscription_status)) {
    return startPortal({ accessToken: input.accessToken })
  }

  const stripe = getStripe()
  const promoCode = input.promoCode?.trim().toUpperCase()
  let promotionCodeId: string | undefined
  if (promoCode) {
    const found = await findPromotionCode(stripe, promoCode)
    if (!found) return { error: `That code (${promoCode}) is not valid.` }
    promotionCodeId = found.id
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: stripePriceId(), quantity: 1 }],
    success_url: `${appUrl()}/?billing=success`,
    cancel_url: `${appUrl()}/?billing=checkout_canceled`,
    client_reference_id: user.id,
    customer: profile?.stripe_customer_id || undefined,
    customer_email: profile?.stripe_customer_id ? undefined : (user.email || profile?.email || undefined),
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { profile_id: user.id, promo_code: promoCode || '' },
    },
    metadata: { profile_id: user.id, promo_code: promoCode || '' },
  }
  if (promotionCodeId) {
    sessionParams.discounts = [{ promotion_code: promotionCodeId }]
  } else {
    sessionParams.allow_promotion_codes = true
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  if (!session.url) return { error: 'Could not start checkout.' }
  return { url: session.url }
}

export async function startPortal(input: { accessToken: string }) {
  if (!stripeSecretKey()) {
    console.error('Stripe portal missing env: STRIPE_SECRET_KEY')
    return { error: 'Billing is not configured yet.' }
  }

  const user = await userFromToken(input.accessToken)
  if (!user) return { error: 'Sign in first.' }

  const { data: profile } = await admin()
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.stripe_customer_id) {
    return { error: 'No billing account yet. Start a trial first.' }
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl()}/`,
  })

  if (!session.url) return { error: 'Could not open billing.' }
  return { url: session.url }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import {
  getStripe,
  promoCodeFrom,
  subscriptionPeriodEnd,
  subscriptionPriceId,
  unixToIso,
} from '@/app/lib/stripe'

export const runtime = 'nodejs'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

async function profileIdFor(customerId: string, fallback?: string | null) {
  if (fallback) return fallback
  const { data } = await admin()
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.id as string | undefined
}

async function syncSubscription(
  sub: Stripe.Subscription,
  extras?: { profileId?: string | null; promoCode?: string | null }
) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const profileId = await profileIdFor(
    customerId,
    extras?.profileId || (sub.metadata?.profile_id as string | undefined) || null
  )
  if (!profileId) {
    console.error('Stripe webhook: no profile for customer', customerId)
    return
  }

  const promoCode = extras?.promoCode || promoCodeFrom(sub)
  const { error } = await admin()
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
      subscription_price_id: subscriptionPriceId(sub),
      subscription_current_period_end: subscriptionPeriodEnd(sub),
      trial_ends_at: unixToIso(sub.trial_end),
      ...(promoCode ? { promo_code: promoCode } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)

  if (error) console.error('Stripe webhook: profile update failed', error)
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    console.error('Stripe webhook signature failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription' || !session.subscription) {
        return NextResponse.json({ received: true })
      }
      const stripe = getStripe()
      const sub = await stripe.subscriptions.retrieve(
        typeof session.subscription === 'string' ? session.subscription : session.subscription.id
      )
      await syncSubscription(sub, {
        profileId: session.client_reference_id || session.metadata?.profile_id || null,
        promoCode: session.metadata?.promo_code || promoCodeFrom(sub, session),
      })
    } else if (
      event.type === 'customer.subscription.created'
      || event.type === 'customer.subscription.updated'
      || event.type === 'customer.subscription.deleted'
    ) {
      await syncSubscription(event.data.object as Stripe.Subscription)
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null
        parent?: { subscription_details?: { subscription?: string } }
      }
      const subRef = invoice.subscription
        || invoice.parent?.subscription_details?.subscription
      if (subRef) {
        const sub = await getStripe().subscriptions.retrieve(
          typeof subRef === 'string' ? subRef : subRef.id
        )
        await syncSubscription(sub)
      }
    }
  } catch (err) {
    console.error('Stripe webhook handler failed', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

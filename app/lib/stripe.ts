import Stripe from 'stripe'

export const TRIAL_DAYS = 14
export const MONTHLY_PRICE_CENTS = 2900

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(key)
}

export function appUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (explicit) return explicit
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export function unixToIso(unix?: number | null) {
  if (!unix) return null
  return new Date(unix * 1000).toISOString()
}

export function subscriptionPeriodEnd(sub: Stripe.Subscription) {
  const item = sub.items?.data?.[0] as { current_period_end?: number } | undefined
  const legacy = sub as Stripe.Subscription & { current_period_end?: number }
  return unixToIso(item?.current_period_end ?? legacy.current_period_end)
}

export function subscriptionPriceId(sub: Stripe.Subscription) {
  const price = sub.items?.data?.[0]?.price
  return typeof price === 'string' ? price : price?.id || null
}

export function promoCodeFrom(
  sub: Stripe.Subscription,
  session?: Stripe.Checkout.Session | null
) {
  const fromSession = (session as { discounts?: Array<{ promotion_code?: { code?: string } | string }> } | null)
    ?.discounts?.[0]?.promotion_code
  if (fromSession && typeof fromSession === 'object' && fromSession.code) return fromSession.code
  const discount = (sub as Stripe.Subscription & {
    discount?: { promotion_code?: { code?: string } | string }
    discounts?: Array<{ promotion_code?: { code?: string } | string }>
  }).discount || (sub as { discounts?: Array<{ promotion_code?: { code?: string } | string }> }).discounts?.[0]
  const promo = discount && typeof discount === 'object' ? discount.promotion_code : null
  if (promo && typeof promo === 'object' && promo.code) return promo.code
  return null
}

export async function findPromotionCode(stripe: Stripe, raw: string) {
  const code = raw.trim()
  if (!code) return null
  const listed = await stripe.promotionCodes.list({ code, active: true, limit: 1 })
  return listed.data[0] || null
}

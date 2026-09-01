import Stripe from 'stripe'

export const TRIAL_DAYS = 14
export const MONTHLY_PRICE_CENTS = 2900

function readEnv(name: string) {
  const raw = String((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name] ?? '').trim()
  if (!raw) return ''
  const unquoted = raw.replace(/^['"]|['"]$/g, '')
  if (unquoted.startsWith(`${name}=`)) return unquoted.slice(name.length + 1).trim()
  return unquoted
}

export function stripeSecretKey() {
  return readEnv('STRIPE_SECRET_KEY')
}

export function stripePriceId() {
  return readEnv('STRIPE_PRICE_ID')
}

export function stripeWebhookSecret() {
  return readEnv('STRIPE_WEBHOOK_SECRET')
}

export function missingStripeConfig() {
  const key = stripeSecretKey()
  const price = stripePriceId()
  if (!key || key === 'STRIPE_SECRET_KEY' || !key.startsWith('sk_')) {
    return 'STRIPE_SECRET_KEY must be the sk_test_ or sk_live_ key, not the name of the variable'
  }
  if (!price || price === 'STRIPE_PRICE_ID' || !price.startsWith('price_')) {
    return 'STRIPE_PRICE_ID must be the price_... id, not the name of the variable'
  }
  return null
}

export function getStripe() {
  const key = stripeSecretKey()
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

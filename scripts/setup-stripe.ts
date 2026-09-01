import { readFileSync } from 'fs'
import { resolve } from 'path'
import Stripe from 'stripe'

function loadLocalEnv() {
  if (process.env.STRIPE_SECRET_KEY) return
  try {
    const text = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // .env.local is optional when the key is already in the environment.
  }
}

loadLocalEnv()

const PRICE_CENTS = 2900

const CODES = [
  { code: 'CRE24', amountOff: 500, name: 'Pay $24' },
  { code: 'CRE19', amountOff: 1000, name: 'Pay $19' },
  { code: 'CRE15', amountOff: 1400, name: 'Pay $15' },
]

async function findProduct(stripe: Stripe) {
  const listed = await stripe.products.list({ limit: 100, active: true })
  return listed.data.find((product) => product.metadata.app === 'cret') || null
}

async function findPrice(stripe: Stripe, productId: string) {
  const listed = await stripe.prices.list({ product: productId, active: true, limit: 20 })
  return listed.data.find((price) => (
    price.unit_amount === PRICE_CENTS
    && price.recurring?.interval === 'month'
    && price.currency === 'usd'
  )) || null
}

async function ensureCoupon(stripe: Stripe, id: string, params: Stripe.CouponCreateParams) {
  try {
    return await stripe.coupons.retrieve(id)
  } catch {
    return stripe.coupons.create({ id, ...params })
  }
}

async function ensurePromotionCode(stripe: Stripe, code: string, couponId: string) {
  const existing = await stripe.promotionCodes.list({ code, limit: 1 })
  if (existing.data[0]) return existing.data[0]
  return stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: couponId },
    code,
    metadata: { app: 'cret' },
  })
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    console.error('Set STRIPE_SECRET_KEY first (test mode is fine).')
    process.exit(1)
  }

  const stripe = new Stripe(key)
  let product = await findProduct(stripe)
  if (!product) {
    product = await stripe.products.create({
      name: 'Cool Real Estate Tools',
      description: 'All tools. One monthly subscription.',
      metadata: { app: 'cret' },
    })
    console.log('Created product', product.id)
  } else {
    console.log('Using product', product.id)
  }

  let price = await findPrice(stripe, product.id)
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: PRICE_CENTS,
      recurring: { interval: 'month' },
      metadata: { app: 'cret' },
    })
    console.log('Created price', price.id)
  } else {
    console.log('Using price', price.id)
  }

  for (const item of CODES) {
    const coupon = await ensureCoupon(stripe, `cret_${item.code.toLowerCase()}`, {
      amount_off: item.amountOff,
      currency: 'usd',
      duration: 'forever',
      name: item.name,
    })
    const promo = await ensurePromotionCode(stripe, item.code, coupon.id)
    console.log(`${item.code} → $${((PRICE_CENTS - item.amountOff) / 100).toFixed(0)}/mo forever (${promo.id})`)
  }

  const firstMonth = await ensureCoupon(stripe, 'cret_first_month', {
    percent_off: 100,
    duration: 'once',
    name: 'First month free',
  })
  const firstPromo = await ensurePromotionCode(stripe, 'FIRSTMONTH', firstMonth.id)
  console.log(`FIRSTMONTH → first paid month free (${firstPromo.id})`)

  console.log('\nAdd these to .env.local and Vercel:')
  console.log(`STRIPE_SECRET_KEY=${key.startsWith('sk_test') ? 'sk_test_...' : 'sk_live_...'}`)
  console.log(`STRIPE_PRICE_ID=${price.id}`)
  console.log('STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook or stripe listen)')
  console.log('NEXT_PUBLIC_APP_URL=https://coolrealestatetools.com')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

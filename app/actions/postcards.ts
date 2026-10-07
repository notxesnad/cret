'use server'

import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { addressError, normalizeAddress, type MailAddress } from '@/app/lib/lobMail'
import {
  POSTCARD_MAX,
  POSTCARD_PRICE_CENTS,
  listingBackHtml,
  listingFrontHtml,
  listingPostcardReady,
  postcardBackHtml,
  postcardColor,
  postcardFrontHtml,
  type ListingPostcard,
  type PostcardOrder,
  type PostcardProof,
} from '@/app/lib/postcardDesigns'
import { appUrl, getStripe, stripeSecretKey } from '@/app/lib/stripe'

function lobKey() {
  const name = ['LOB', 'API', 'KEY'].join('_')
  return String(process.env[name] || '').trim().replace(/^['"]|['"]$/g, '')
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

async function userFromToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon || !accessToken) return null
  const supabase = createClient(url, anon)
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) return null
  return data.user
}

function orderPath(orderId: string) {
  return `mail-orders/${orderId}.json`
}

async function saveOrder(order: PostcardOrder) {
  const client = admin()
  const bytes = Buffer.from(JSON.stringify(order))
  const path = orderPath(order.id)
  const { data: bucket } = await client.storage.getBucket('profiles')
  const allowed = bucket?.allowed_mime_types
  if (bucket && allowed?.length && !allowed.includes('application/json')) {
    await client.storage.updateBucket('profiles', {
      public: bucket.public,
      allowedMimeTypes: [...allowed, 'application/json'],
    })
  }
  let { error } = await client.storage.from('profiles').upload(path, bytes, {
    contentType: 'application/json',
    upsert: true,
  })
  if (error && /mime/i.test(error.message)) {
    const retry = await client.storage.from('profiles').upload(path, bytes, {
      contentType: 'image/png',
      upsert: true,
    })
    error = retry.error
  }
  if (error) return error.message
  return null
}

async function readOrder(orderId: string) {
  const { data, error } = await admin().storage.from('profiles').download(orderPath(orderId))
  if (error || !data) return null
  try {
    return JSON.parse(await data.text()) as PostcardOrder
  } catch {
    return null
  }
}

function lobAddress(address: MailAddress) {
  const next = normalizeAddress(address)
  return {
    name: next.name,
    address_line1: next.line1,
    address_line2: next.line2 || undefined,
    address_city: next.city,
    address_state: next.state,
    address_zip: next.zip,
    address_country: 'US',
  }
}

async function lobSend(path: string, init?: { method?: string; body?: unknown; idempotencyKey?: string }) {
  const key = lobKey()
  const headers: Record<string, string> = { Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}` }
  if (init?.body) headers['Content-Type'] = 'application/json'
  if (init?.idempotencyKey) headers['Idempotency-Key'] = init.idempotencyKey
  const res = await fetch(`https://api.lob.com/v1${path}`, {
    method: init?.method || 'POST',
    headers,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  })
  const payload = await res.json().catch(() => null) as Record<string, unknown> | null
  return { ok: res.ok, payload }
}

function thumbFrom(payload: Record<string, unknown> | null) {
  const thumbs = payload?.thumbnails as
    | { large?: string; medium?: string; small?: string; front?: { large?: string; medium?: string } }
    | Array<{ large?: string; medium?: string; small?: string }>
    | undefined
  if (!thumbs) return ''
  if (Array.isArray(thumbs)) return thumbs[0]?.large || thumbs[0]?.medium || thumbs[0]?.small || ''
  return thumbs.large || thumbs.medium || thumbs.small || thumbs.front?.large || thumbs.front?.medium || ''
}

function allowedPicture(url: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
  return Boolean(base) && url.startsWith(base) && url.includes('/storage/')
}

function cleanListing(input: ListingPostcard): ListingPostcard {
  const photoUrl = allowedPicture(input.photoUrl) ? input.photoUrl : ''
  const headshotUrl = allowedPicture(input.headshotUrl) ? input.headshotUrl : ''
  const logoUrl = allowedPicture(input.logoUrl) ? input.logoUrl : ''
  return {
    photoUrl,
    headline: input.headline.trim().slice(0, 28),
    propertyAddress: input.propertyAddress.trim().slice(0, 42),
    detail: input.detail.trim().slice(0, 36),
    agentName: input.agentName.trim().slice(0, 36),
    brokerage: input.brokerage.trim().slice(0, 36),
    barColor: postcardColor(input.barColor, '#111111'),
    backColor: postcardColor(input.backColor, '#1b2a4a'),
    message: input.message.trim().slice(0, 320),
    phone: input.phone.trim().slice(0, 24),
    website: input.website.trim().slice(0, 48),
    title: input.title.trim().slice(0, 32),
    license: input.license.trim().slice(0, 24),
    headshotUrl,
    logoUrl,
    useHeadshot: Boolean(input.useHeadshot && headshotUrl),
    useLogo: Boolean(input.useLogo && logoUrl),
  }
}

function plainLobError(message: string | undefined, fallback: string) {
  if (!message) return fallback
  if (/scheduled mailings/i.test(message)) return 'The proof could not be made. Try again.'
  return message
}

function postcardBody(input: {
  from: MailAddress
  to: MailAddress
  templateId: string | null
  frontUrl: string | null
  backUrl: string | null
  headshotUrl: string | null
  line: string
  design?: ListingPostcard | null
}) {
  if (input.design?.photoUrl) {
    return {
      description: '6x9 postcard',
      to: lobAddress(input.to),
      from: lobAddress(input.from),
      size: '6x9',
      mail_type: 'usps_first_class',
      use_type: 'marketing',
      front: listingFrontHtml(input.design),
      back: listingBackHtml(input.design),
    }
  }
  const front = postcardFrontHtml({
    templateId: input.templateId || 'just-listed',
    line: input.line,
    frontUrl: input.frontUrl || undefined,
  })
  return {
    description: '6x9 postcard',
    to: lobAddress(input.to),
    from: lobAddress(input.from),
    size: '6x9',
    mail_type: 'usps_first_class',
    use_type: 'marketing',
    front,
    back: postcardBackHtml({
      line: input.line,
      fromName: input.from.name,
      backUrl: input.backUrl || undefined,
      headshotUrl: input.headshotUrl || undefined,
    }),
  }
}

async function cancelPostcard(id: string) {
  const first = await lobSend(`/postcards/${id}`, { method: 'DELETE' })
  if (first.ok) return true
  const second = await lobSend(`/postcards/${id}`, { method: 'DELETE' })
  return second.ok
}

export async function createPostcardProofs(input: {
  accessToken: string
  from: MailAddress
  recipients: MailAddress[]
  templateId: string | null
  frontUrl: string | null
  backUrl: string | null
  headshotUrl: string | null
  line: string
  design?: ListingPostcard | null
}) {
  if (!lobKey()) return { error: 'Mail is not connected yet.' }
  const user = await userFromToken(input.accessToken)
  if (!user) return { error: 'Sign in first.' }
  if (addressError(input.from)) return { error: `Your return address: ${addressError(input.from)}` }
  const recipients = input.recipients.filter((item) => !addressError(item)).map(normalizeAddress)
  if (!recipients.length) return { error: 'Add at least one address.' }
  if (recipients.length > POSTCARD_MAX) return { error: `Send up to ${POSTCARD_MAX} at a time.` }
  const design = input.design?.photoUrl ? cleanListing(input.design) : null
  if (design) {
    const problem = listingPostcardReady(design)
    if (problem) return { error: problem }
  } else {
    if (input.line.trim().length > 80) return { error: 'Keep that line under 80 characters.' }
    if (input.frontUrl && !input.backUrl) return { error: 'Add the back picture too.' }
    if (input.frontUrl && !allowedPicture(input.frontUrl)) return { error: 'Upload the front picture again.' }
    if (input.backUrl && !allowedPicture(input.backUrl)) return { error: 'Upload the back picture again.' }
    if (input.headshotUrl && !allowedPicture(input.headshotUrl)) return { error: 'Add your picture from your profile again.' }
    if (!input.frontUrl && !input.templateId) return { error: 'Pick a postcard first.' }
  }

  const from = normalizeAddress(input.from)
  const created: { id: string; name: string; url: string; thumb: string }[] = []
  for (const to of recipients) {
    const result = await lobSend('/postcards', {
      body: postcardBody({
        from,
        to,
        templateId: input.templateId,
        frontUrl: input.frontUrl,
        backUrl: input.backUrl,
        headshotUrl: input.headshotUrl,
        line: input.line,
        design,
      }),
    })
    const id = String(result.payload?.id || '')
    if (!result.ok || !id) {
      await Promise.all(created.map((item) => cancelPostcard(item.id)))
      const message = (result.payload?.error as { message?: string } | undefined)?.message
      return { error: plainLobError(message, 'Could not make the proof.') }
    }
    created.push({
      id,
      name: to.name,
      url: String(result.payload?.url || ''),
      thumb: thumbFrom(result.payload),
    })
  }

  const stuck = []
  for (const item of created) {
    const canceled = await cancelPostcard(item.id)
    if (!canceled) stuck.push(item.id)
  }
  if (stuck.length) {
    return { error: 'A sample postcard could not be stopped. Check Lob before you try again. Nothing was paid for.' }
  }

  const order: PostcardOrder = {
    id: crypto.randomUUID(),
    profileId: user.id,
    from,
    recipients,
    templateId: input.templateId,
    frontUrl: input.frontUrl,
    backUrl: input.backUrl,
    headshotUrl: input.headshotUrl,
    line: input.line.trim(),
    design,
    status: 'unpaid',
    proofs: created.map(({ name, url, thumb }) => ({ name, url, thumb })),
    lobIds: [],
  }
  const saved = await saveOrder(order)
  if (saved) return { error: `Could not save the proof. ${saved}` }
  return { orderId: order.id, proofs: order.proofs, test: lobKey().startsWith('test_') }
}

export async function loadPostcardOrder(input: { accessToken: string; orderId: string }) {
  const user = await userFromToken(input.accessToken)
  if (!user) return { error: 'Sign in first.' }
  const order = await readOrder(input.orderId)
  if (!order || order.profileId !== user.id) return { error: 'That postcard order was not found.' }
  return {
    orderId: order.id,
    status: order.status,
    proofs: order.proofs,
    count: order.recipients.length,
    cents: order.recipients.length * POSTCARD_PRICE_CENTS,
    test: lobKey().startsWith('test_'),
  }
}

export async function startPostcardCheckout(input: { accessToken: string; orderId: string }) {
  if (!stripeSecretKey()) return { error: 'Card payments are not set up yet.' }
  const user = await userFromToken(input.accessToken)
  if (!user) return { error: 'Sign in first.' }
  const order = await readOrder(input.orderId)
  if (!order || order.profileId !== user.id) return { error: 'That postcard order was not found.' }
  if (order.status === 'sent') return { error: 'Those postcards were already mailed.' }
  const count = order.recipients.length
  const origin = appUrl()
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      line_items: [{
        quantity: count,
        price_data: {
          currency: 'usd',
          unit_amount: POSTCARD_PRICE_CENTS,
          product_data: { name: '6×9 postcard, first class' },
        },
      }],
      success_url: `${origin}/?view=mail&postcard_order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?view=mail&postcard_order=${order.id}`,
      metadata: {
        kind: 'postcard',
        order_id: order.id,
        profile_id: user.id,
        pieces: String(count),
      },
    })
    if (!session.url) return { error: 'Could not open the payment page.' }
    return { url: session.url }
  } catch (err) {
    const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : ''
    return { error: message || 'Could not open the payment page.' }
  }
}

export async function sendPaidPostcardOrder(session: Stripe.Checkout.Session) {
  if (session.metadata?.kind !== 'postcard') return { error: 'Not a postcard payment.' }
  if (session.payment_status !== 'paid') return { error: 'Payment is not finished.' }
  const orderId = session.metadata.order_id || ''
  const order = await readOrder(orderId)
  if (!order) return { error: 'That postcard order was not found.' }
  const expected = order.recipients.length * POSTCARD_PRICE_CENTS
  if (session.amount_total !== expected) return { error: 'The payment amount did not match.' }
  if (session.metadata.profile_id && session.metadata.profile_id !== order.profileId) {
    return { error: 'That payment does not match this order.' }
  }
  if (order.status === 'sent' && order.lobIds.length >= order.recipients.length) {
    return { proofs: mailedProofs(order), test: lobKey().startsWith('test_') }
  }

  const design = order.design?.photoUrl ? cleanListing(order.design) : null
  const lobIds = [...order.lobIds]
  for (let i = lobIds.length; i < order.recipients.length; i++) {
    const result = await lobSend('/postcards', {
      idempotencyKey: `postcard-${order.id}-${i}`,
      body: postcardBody({
        from: order.from,
        to: order.recipients[i],
        templateId: order.templateId,
        frontUrl: order.frontUrl,
        backUrl: order.backUrl || null,
        headshotUrl: order.headshotUrl || null,
        line: order.line,
        design,
      }),
    })
    const id = String(result.payload?.id || '')
    if (!result.ok || !id) {
      await rememberIds(order.id, lobIds, false)
      const message = (result.payload?.error as { message?: string } | undefined)?.message
      return { error: plainLobError(message, 'Payment went through, but the postcard did not mail. Do not pay again.') }
    }
    lobIds[i] = id
    await rememberIds(order.id, lobIds, false)
  }
  const saved = await rememberIds(order.id, lobIds, true)
  if (!saved) return { error: 'The postcards were mailed, but we could not save the receipt.' }
  return { proofs: mailedProofs({ ...order, lobIds, status: 'sent' }), test: lobKey().startsWith('test_') }
}

async function rememberIds(orderId: string, lobIds: string[], done: boolean) {
  const latest = await readOrder(orderId)
  if (!latest) return null
  lobIds.forEach((id, index) => {
    if (id) latest.lobIds[index] = id
  })
  if (done) latest.status = 'sent'
  const error = await saveOrder(latest)
  return error ? null : latest
}

function mailedProofs(order: PostcardOrder): PostcardProof[] {
  return order.recipients.map((item, index) => ({
    name: item.name,
    url: order.proofs[index]?.url || '',
    thumb: order.proofs[index]?.thumb || '',
  }))
}

export async function finishPostcardCheckout(input: { accessToken: string; orderId: string; sessionId: string }) {
  const user = await userFromToken(input.accessToken)
  if (!user) return { error: 'Sign in first.' }
  if (!stripeSecretKey()) return { error: 'Card payments are not set up yet.' }
  const session = await getStripe().checkout.sessions.retrieve(input.sessionId)
  if (session.metadata?.order_id !== input.orderId) return { error: 'That payment does not match this order.' }
  if (session.metadata?.profile_id !== user.id) return { error: 'Sign in with the account that paid.' }
  return sendPaidPostcardOrder(session)
}

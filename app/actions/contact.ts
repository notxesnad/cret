'use server'

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const SUBJECTS = {
  help: 'Help me',
  'idea-better': 'I want to make a current tool better',
  'idea-new': 'I would like a new tool',
  other: 'My request is different',
} as const

export type ContactCategory = keyof typeof SUBJECTS

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

function firstNameFrom(fullName?: string | null) {
  return (fullName || '').trim().split(/\s+/)[0] || ''
}

function env(name: string) {
  return String(process.env[name] || '').trim().replace(/\/+$/, '')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function createFreeScoutTicket(input: {
  email: string
  firstName: string
  subject: string
  body: string
}) {
  const url = env('FREESCOUT_URL')
  const apiKey = env('FREESCOUT_API_KEY')
  const mailboxId = Number(env('FREESCOUT_MAILBOX_ID') || '1')
  if (!url || !apiKey) return false

  const customer = {
    email: input.email,
    ...(input.firstName ? { firstName: input.firstName } : {}),
  }

  const res = await fetch(`${url}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-FreeScout-API-Key': apiKey,
    },
    body: JSON.stringify({
      type: 'email',
      mailboxId: Number.isFinite(mailboxId) && mailboxId > 0 ? mailboxId : 1,
      subject: input.subject,
      customer,
      status: 'active',
      threads: [
        {
          type: 'customer',
          text: input.body,
          customer,
        },
      ],
    }),
  })

  if (res.ok) return true
  const detail = await res.text().catch(() => '')
  console.error('FreeScout ticket failed', res.status, detail)
  return false
}

async function emailFreeScoutMailbox(input: {
  email: string
  name: string
  subject: string
  body: string
}) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return false

  const inbox = env('FREESCOUT_INBOX_EMAIL') || 'hello@coolrealestatetools.com'
  const from = process.env.RESEND_FROM || '"CoolRealEstateTools" <sam@coolrealestatetools.com>'
  const resend = new Resend(resendKey)
  const { error } = await resend.emails.send({
    from,
    to: inbox,
    replyTo: input.email,
    subject: input.subject,
    text: `From: ${input.name} <${input.email}>\n\n${input.body}`,
    html: `<p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p><pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(input.body)}</pre>`,
  })
  if (error) {
    console.error('Contact email failed', error)
    return false
  }
  return true
}

export async function submitContact(input: {
  accessToken: string
  category: ContactCategory
  subject: string
  message: string
}) {
  const user = await userFromToken(input.accessToken)
  if (!user?.email) return { error: 'Sign in to send us a note.' }

  const category = input.category
  if (!(category in SUBJECTS)) return { error: 'Pick what you need help with.' }

  const message = (input.message || '').trim()
  if (message.length < 3) return { error: 'Tell us a little more so we can help.' }
  if (message.length > 8000) return { error: 'Keep it under a few pages and we will take it from there.' }

  const subject = ((input.subject || '').trim() || SUBJECTS[category]).slice(0, 180)
  const { data: profile } = await admin()
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  const name = (profile?.full_name || user.user_metadata?.full_name || '').trim() || user.email
  const email = profile?.email || user.email
  const firstName = firstNameFrom(name)
  const ticketSubject = `[${SUBJECTS[category]}] ${subject}`
  const ticketBody = message

  const viaApi = await createFreeScoutTicket({
    email,
    firstName,
    subject: ticketSubject,
    body: ticketBody,
  })
  if (viaApi) return { ok: true as const }

  const viaEmail = await emailFreeScoutMailbox({
    email,
    name,
    subject: ticketSubject,
    body: ticketBody,
  })
  if (viaEmail) return { ok: true as const }

  return { error: 'Could not send that just now. Try again in a minute.' }
}

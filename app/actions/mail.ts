'use server'

import { letterHtml, normalizeAddress, addressError, type MailAddress, type MailKind } from '@/app/lib/lobMail'
import { createClient } from '@supabase/supabase-js'

function lobKey() {
  const name = ['LOB', 'API', 'KEY'].join('_')
  return String(process.env[name] || '').trim().replace(/^['"]|['"]$/g, '')
}

export async function mailStatus() {
  const key = lobKey()
  if (!key) return { configured: false, test: false }
  return { configured: true, test: key.startsWith('test_') }
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

export async function sendOneMail(input: {
  accessToken: string
  kind: MailKind
  from: MailAddress
  to: MailAddress
  headline: string
  message: string
}) {
  const key = lobKey()
  if (!key) return { error: 'Mail is not connected yet. Add LOB_API_KEY.' }

  const user = await userFromToken(input.accessToken)
  if (!user) return { error: 'Sign in first.' }

  if (input.kind === 'postcard') return { error: 'Pick a 6×9 postcard, look at the proof, and pay before it mails.' }
  const fromError = addressError(input.from)
  if (fromError) return { error: `Return address: ${fromError}` }
  const toError = addressError(input.to)
  if (toError) return { error: toError }

  const message = input.message.trim()
  if (!message) return { error: 'Write the letter.' }
  if (message.length > 4000) return { error: 'Keep the letter under 4000 characters.' }

  const from = lobAddress(input.from)
  const to = lobAddress(input.to)
  const body = {
    description: 'Agent letter',
    to,
    from,
    file: letterHtml({ message, fromName: from.name }),
    color: true,
    double_sided: false,
    address_placement: 'top_first_page',
    mail_type: 'usps_first_class',
    use_type: 'marketing',
    metadata: { profile_id: user.id },
  }

  const auth = Buffer.from(`${key}:`).toString('base64')
  const res = await fetch('https://api.lob.com/v1/letters', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const payload = await res.json().catch(() => null) as {
    id?: string
    url?: string
    expected_delivery_date?: string
    error?: { message?: string }
  } | null
  if (!res.ok) {
    return { error: payload?.error?.message || 'Lob could not send that piece.' }
  }
  return {
    id: payload?.id || '',
    url: payload?.url || '',
    expectedDelivery: payload?.expected_delivery_date || '',
    test: key.startsWith('test_'),
  }
}

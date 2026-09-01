'use server'

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { welcomeEmailHtml } from '@/app/lib/welcomeEmail'
import { appTrialFields } from '@/app/lib/billing'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

function firstNameFrom(fullName?: string | null) {
  return (fullName || '').trim().split(/\s+/)[0] || ''
}

async function firstNameForEmail(email: string) {
  const { data } = await admin()
    .from('profiles')
    .select('full_name')
    .ilike('email', email)
    .limit(1)
    .maybeSingle()
  return firstNameFrom(data?.full_name)
}

async function sendWelcomeEmail(email: string, redirectTo?: string) {
  const db = admin()
  const { data, error } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: redirectTo ? { redirectTo } : undefined,
  })
  const actionLink = data?.properties?.action_link
  if (error || !actionLink) {
    console.error('Could not generate welcome link', error)
    return
  }

  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const resend = new Resend(resendKey)
    const from = process.env.RESEND_FROM || '"CoolRealEstateTools" <sam@coolrealestatetools.com>'
    const { error: sendError } = await resend.emails.send({
      from,
      to: email,
      subject: 'Verify your email address - Cool Real Estate Tools',
      html: welcomeEmailHtml(actionLink),
    })
    if (!sendError) return
    console.error('Resend welcome email failed', sendError)
  }

  const { error: otpError } = await db.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
  })
  if (otpError) console.error('Supabase welcome email fallback failed', otpError)
}

export async function registerWithoutVerify(email: string, redirectTo?: string) {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return { error: 'Enter your email.' }

  const password = `${crypto.randomUUID()}${crypto.randomUUID()}`
  const { data, error } = await admin().auth.admin.createUser({
    email: trimmed,
    password,
    email_confirm: true,
  })

  if (error) {
    const msg = (error.message || '').toLowerCase()
    if (
      error.status === 422
      || msg.includes('already')
      || msg.includes('registered')
      || msg.includes('exists')
    ) {
      const firstName = await firstNameForEmail(trimmed)
      return { exists: true as const, firstName }
    }
    return { error: error.message }
  }

  if (!data.user?.id) return { error: 'Could not create your account.' }
  const trial = appTrialFields()
  const { error: profileError } = await admin().from('profiles').upsert({
    id: data.user.id,
    email: trimmed,
    ...trial,
    workspace_version: 2,
    updated_at: new Date().toISOString(),
  })
  if (profileError) {
    const retry = await admin().from('profiles').upsert({
      id: data.user.id,
      email: trimmed,
      ...trial,
      updated_at: new Date().toISOString(),
    })
    if (retry.error) console.error('Could not start trial on new profile:', retry.error)
  }
  try {
    await sendWelcomeEmail(trimmed, redirectTo)
  } catch (err) {
    console.error('Welcome email failed', err)
  }
  return { exists: false as const, password, userId: data.user.id }
}

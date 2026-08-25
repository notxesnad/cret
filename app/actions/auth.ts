'use server'

import { createClient } from '@supabase/supabase-js'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function registerWithoutVerify(email: string) {
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
      return { exists: true as const }
    }
    return { error: error.message }
  }

  if (!data.user?.id) return { error: 'Could not create your account.' }
  return { exists: false as const, password, userId: data.user.id }
}

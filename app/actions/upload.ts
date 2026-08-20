'use server'

import { createClient } from '@supabase/supabase-js'

export async function ensurePdfUploadsAllowed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { error: 'Missing Supabase credentials.' }

  const supabase = createClient(url, key)
  const { data: bucket, error } = await supabase.storage.getBucket('profiles')
  if (error) return { error: error.message }
  if (!bucket) return { error: 'Storage bucket not found.' }

  const existing = bucket.allowed_mime_types
  if (!existing || existing.length === 0 || existing.includes('application/pdf')) {
    return { ok: true }
  }

  const { error: updateError } = await supabase.storage.updateBucket('profiles', {
    public: bucket.public,
    allowedMimeTypes: [...existing, 'application/pdf', 'application/octet-stream'],
  })

  if (updateError) return { error: updateError.message }
  return { ok: true }
}

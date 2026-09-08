import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { recordAppVisit, recordVisit } from '@/app/lib/trackVisit'

export const runtime = 'nodejs'

function asString(value: unknown) {
  return typeof value === 'string' ? value : null
}

async function userFromToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(url, anon)
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) return null
  return data.user
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const path = asString(body.path) || '/'
  const referrer = asString(body.referrer) || req.headers.get('referer')
  const userAgent = req.headers.get('user-agent')

  if (body.tool === 'app') {
    const token = asString(body.accessToken)
    if (!token) return NextResponse.json({ ok: true })
    const user = await userFromToken(token)
    if (!user) return NextResponse.json({ ok: true })
    await recordAppVisit({
      profileId: user.id,
      path,
      referrer,
      userAgent,
    })
    return NextResponse.json({ ok: true })
  }

  if (body.tool !== 'site') {
    return NextResponse.json({ ok: true })
  }

  await recordVisit({
    tool: 'site',
    path,
    utmSource: asString(body.utm_source),
    utmMedium: asString(body.utm_medium),
    utmCampaign: asString(body.utm_campaign),
    referrer,
    userAgent,
  })

  return NextResponse.json({ ok: true })
}

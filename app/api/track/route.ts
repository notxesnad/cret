import { NextResponse } from 'next/server'
import { recordVisit } from '@/app/lib/trackVisit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  if (body.tool !== 'site') {
    return NextResponse.json({ ok: true })
  }

  const asString = (value: unknown) => (typeof value === 'string' ? value : null)

  await recordVisit({
    tool: 'site',
    path: asString(body.path) || '/',
    utmSource: asString(body.utm_source),
    utmMedium: asString(body.utm_medium),
    utmCampaign: asString(body.utm_campaign),
    referrer: asString(body.referrer) || req.headers.get('referer'),
    userAgent: req.headers.get('user-agent'),
  })

  return NextResponse.json({ ok: true })
}

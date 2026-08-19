import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is missing on the Vercel server. Add it in Settings → Environment Variables, then Redeploy.' },
      { status: 500 }
    )
  }

  let payload: { email?: string; listingAddress?: string; reportUrl?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const to = (payload.email || '').trim()
  const listingAddress = payload.listingAddress || 'your listing'
  const reportUrl = payload.reportUrl || ''

  if (!to || !to.includes('@')) {
    return NextResponse.json({ error: 'You must be logged in so we know which email to send to.' }, { status: 400 })
  }

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#0f172a;color:#f8fafc;margin:0;padding:40px 20px;">
      <div style="max-width:600px;margin:0 auto;background-color:#1e293b;border:1px solid #334155;border-radius:24px;padding:40px;text-align:center;">
        <div style="font-size:32px;margin-bottom:24px;">🏠✨</div>
        <div style="font-size:18px;font-weight:900;letter-spacing:-0.05em;margin-bottom:24px;">
          <span style="color:#94a3b8;">COOL</span><span style="color:#10b981;">REALESTATE</span><span style="color:#94a3b8;">TOOLS</span>
        </div>
        <h1 style="font-size:24px;font-weight:800;margin:0 0 16px;color:#f8fafc;">Your property report is ready</h1>
        <p style="font-size:16px;line-height:1.6;color:#94a3b8;margin:0 0 8px;">Here is the seller tracking report for</p>
        <p style="font-size:18px;font-weight:800;color:#f8fafc;margin:0 0 32px;">${listingAddress}</p>
        <a href="${reportUrl}" style="display:inline-block;background-color:#10b981;color:#020617;font-weight:900;font-size:16px;text-decoration:none;padding:16px 32px;border-radius:12px;">View Report</a>
        <p style="font-size:14px;line-height:1.6;color:#64748b;margin:32px 0 0;">Open the report, then tap Print if you want to save a PDF.</p>
        <p style="font-size:13px;color:#64748b;margin:16px 0 0;word-break:break-all;">
          <a href="${reportUrl}" style="color:#10b981;">${reportUrl}</a>
        </p>
      </div>
    </div>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Cool Real Estate Tools <hello@coolrealestatetools.com>',
        to: [to],
        subject: `Property Report: ${listingAddress}`,
        html,
        text: `Your property report for ${listingAddress} is ready: ${reportUrl}`
      })
    })

    const body = await res.json()
    if (!res.ok) {
      console.error('Resend error:', body)
      return NextResponse.json(
        { error: body?.message || JSON.stringify(body) },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: body.id, to })
  } catch (err: any) {
    console.error('Email send failed:', err)
    return NextResponse.json({ error: err?.message || 'Failed to send email.' }, { status: 500 })
  }
}

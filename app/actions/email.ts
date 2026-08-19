'use server'

import { Resend } from 'resend'

export async function sendPdfEmail(userEmail: string, listingAddress: string, reportUrl: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { error: 'RESEND_API_KEY is not set in Vercel environment variables.' }
  }

  const to = (userEmail || '').trim()
  if (!to || !to.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: 'Cool Real Estate Tools <hello@coolrealestatetools.com>',
      to: [to],
      subject: `Property Report: ${listingAddress}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#0f172a;color:#f8fafc;margin:0;padding:40px 20px;">
          <div style="max-width:600px;margin:0 auto;background-color:#1e293b;border:1px solid #334155;border-radius:24px;padding:40px;text-align:center;">
            <div style="font-size:32px;margin-bottom:24px;">🏠✨</div>
            <h1 style="font-size:24px;font-weight:800;margin:0 0 16px;color:#f8fafc;">Your property report is ready</h1>
            <p style="font-size:16px;line-height:1.6;color:#94a3b8;margin:0 0 8px;">
              Here is the seller tracking report for
            </p>
            <p style="font-size:18px;font-weight:800;color:#f8fafc;margin:0 0 32px;">${listingAddress}</p>
            <a href="${reportUrl}" style="display:inline-block;background-color:#10b981;color:#020617;font-weight:900;font-size:16px;text-decoration:none;padding:16px 32px;border-radius:12px;">
              View Report
            </a>
            <p style="font-size:14px;line-height:1.6;color:#64748b;margin:32px 0 0;">
              Open the report, then tap Print if you want to save a PDF.
            </p>
            <p style="font-size:13px;color:#64748b;margin:16px 0 0;word-break:break-all;">
              <a href="${reportUrl}" style="color:#10b981;">${reportUrl}</a>
            </p>
          </div>
        </div>
      `
    })

    if (error) {
      const message = error.message || JSON.stringify(error)
      return { error: message }
    }

    return { success: true, id: data?.id, to }
  } catch (err: any) {
    return { error: err?.message || 'Failed to send email.' }
  }
}

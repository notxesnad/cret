import { Resend } from 'resend'
import { publicOrigin } from '@/app/lib/editorLink'
import { showingAgentFromAnswers } from '@/app/lib/showingFeedback'
import type { Question } from '@/app/components/Questionnaire'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function firstNameFrom(name?: string | null) {
  return (name || '').trim().split(/\s+/)[0] || ''
}

function wrapEmail(title: string, inner: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0f172a;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:560px;max-width:100%;">
          <tr>
            <td style="padding:0 0 20px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#94a3b8;">
              Cool<span style="color:#34d399;">RealEstate</span>Tools.com
            </td>
          </tr>
          <tr>
            <td style="background-color:#1e293b;border:1px solid #334155;border-radius:24px;padding:32px 28px;">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 8px;font-size:13px;line-height:1.6;color:#64748b;">
              Sent by Parker ·
              <a href="https://coolrealestatetools.com" style="color:#34d399;text-decoration:underline;">coolrealestatetools.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 8px;">
    <tr>
      <td align="center" style="background-color:#34d399;border-radius:12px;">
        <a href="${escapeHtml(href)}" style="display:block;background-color:#34d399;border-radius:12px;padding:16px 28px;font-size:16px;font-weight:900;color:#0f172a;text-decoration:none;letter-spacing:0.01em;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`
}

async function sendMail(to: string, subject: string, html: string, text: string) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.error('Showing feedback email skipped: no RESEND_API_KEY')
    return
  }
  const resend = new Resend(resendKey)
  const from = process.env.RESEND_FROM || '"CoolRealEstateTools" <sam@coolrealestatetools.com>'
  const { error } = await resend.emails.send({ from, to, subject, html, text })
  if (error) console.error('Showing feedback email failed', error)
}

export async function sendShowingFeedbackEmails(input: {
  profile: { full_name?: string | null; email?: string | null }
  campaign: { title?: string; listingAddress?: string; questions?: Question[] }
  profileId: string
  campaignId: string
  responseId: string
  answers: Record<string, unknown>
}) {
  const address = (input.campaign.listingAddress || input.campaign.title || 'your listing').trim()
  const listingFirst = firstNameFrom(input.profile.full_name)
  const listingEmail = String(input.profile.email || '').trim()
  const showing = showingAgentFromAnswers(input.answers)
  const origin = publicOrigin()
  const reportUrl = `${origin}/showing-feedback/${input.profileId}/${input.campaignId}/report`
  const answersUrl = `${origin}/showing-feedback/${input.profileId}/${input.campaignId}/r/${input.responseId}`

  if (listingEmail) {
    const subject = `Showing feedback for ${address}`
    const hello = listingFirst ? `Hey ${listingFirst} —` : 'Hey —'
    const text = `${hello} an agent left notes on ${address}.

Read the feedback:
${reportUrl}

Parker`
    const html = wrapEmail(subject, `
      <p style="margin:0 0 8px;font-size:16px;line-height:1.5;color:#e2e8f0;">${escapeHtml(hello)}</p>
      <p style="margin:0 0 14px;font-size:28px;line-height:1.15;font-weight:900;letter-spacing:-0.03em;color:#f8fafc;">Showing feedback for ${escapeHtml(address)}</p>
      <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#94a3b8;">An agent left notes on this listing.</p>
      ${ctaButton(reportUrl, 'Read the feedback')}
    `)
    await sendMail(listingEmail, subject, html, text)
  }

  if (showing.email) {
    const subject = `Your notes on ${address}`
    const hello = showing.name ? `Hey ${firstNameFrom(showing.name)} —` : 'Hey —'
    const text = `${hello} here’s a copy of what you sent the listing agent for ${address}.

See your answers:
${answersUrl}

If you tour buyers all week, CoolRealEstateTools.com has a driving itinerary that lines up the stops so you’re not criss-crossing town. Free to try.

Parker`
    const html = wrapEmail(subject, `
      <p style="margin:0 0 8px;font-size:16px;line-height:1.5;color:#e2e8f0;">${escapeHtml(hello)}</p>
      <p style="margin:0 0 14px;font-size:28px;line-height:1.15;font-weight:900;letter-spacing:-0.03em;color:#f8fafc;">Your notes on ${escapeHtml(address)}</p>
      <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#94a3b8;">Here’s a copy of what you sent the listing agent.</p>
      ${ctaButton(answersUrl, 'See your answers')}
      <p style="margin:22px 0 0;font-size:16px;line-height:1.6;color:#94a3b8;">
        If you tour buyers all week, <a href="https://coolrealestatetools.com" style="color:#34d399;font-weight:700;">CoolRealEstateTools.com</a> has a driving itinerary that lines up the stops so you’re not criss-crossing town. Free to try.
      </p>
    `)
    await sendMail(showing.email, subject, html, text)
  }
}

function firstNameFrom(name: string) {
  return name.trim().split(/\s+/)[0] || ''
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function madeEmailSubject(address: string) {
  const trimmed = address.trim() || 'your listing'
  return `your seller at ${trimmed}`
}

export function madeEmailPlain(input: {
  name: string
  address: string
  reportUrl: string
  editorUrl: string
}) {
  const hi = firstNameFrom(input.name)
  const address = input.address.trim() || 'your listing'
  return `Hey${hi ? ` ${hi}` : ''} — ${address} just went live. That first quiet week is when sellers start asking what you’ve actually done.

There’s a simple report you can text them. Inspection, MLS, Zillow, then photos and showings as they happen — dated, in order, with your name on it. Takes about a minute. Free to try.

Peek at one for ${address}:
${input.reportUrl}

Open it and add the next update:
${input.editorUrl}

If it’s useful, send your seller the first link tonight. If not, ignore this.

Parker`
}

export function madeEmailHtml(input: {
  name: string
  address: string
  reportUrl: string
  editorUrl: string
}) {
  const address = escapeHtml(input.address.trim() || 'your listing')
  const reportUrl = escapeHtml(input.reportUrl)
  const editorUrl = escapeHtml(input.editorUrl)
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>your seller at ${address}</title>
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
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fbbf24;">${address}</p>
              <p style="margin:0 0 16px;font-size:28px;line-height:1.15;font-weight:900;letter-spacing:-0.03em;color:#f8fafc;">Keep your seller from wondering what’s happening.</p>
              <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#94a3b8;">
                The listing is live. The first quiet days feel like nothing. A dated report — inspection, MLS, Zillow already on it — is something you can text them tonight. Add photos and showings as they happen. About a minute. Free to try.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
                <tr>
                  <td align="center" style="background-color:#f59e0b;border-radius:12px;">
                    <a href="${reportUrl}" style="display:block;background-color:#f59e0b;border-radius:12px;padding:16px 28px;font-size:16px;font-weight:900;color:#0f172a;text-decoration:none;letter-spacing:0.01em;">See what they’d get</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 8px;">
                <tr>
                  <td align="center" style="background-color:#334155;border-radius:12px;">
                    <a href="${editorUrl}" style="display:block;background-color:#334155;border-radius:12px;padding:16px 28px;font-size:16px;font-weight:900;color:#f8fafc;text-decoration:none;letter-spacing:0.01em;">Try it on this listing</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#94a3b8;">
                The second button signs you in. No password. If you like it, send your seller the report tonight.
              </p>
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

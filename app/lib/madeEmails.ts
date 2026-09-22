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
  return `Your seller at ${trimmed} only sees the listing`
}

export function madeEmailPlain(input: {
  name: string
  address: string
  editorUrl: string
}) {
  const hi = firstNameFrom(input.name)
  const address = input.address.trim() || 'your listing'
  return `Hey${hi ? ` ${hi}` : ''} — your seller at ${address} only sees the listing. Not the work behind it.

Sellers want that information. I started a report you can text them so they see it.

Preview the seller report:
${input.editorUrl}

Takes a minute. Free to try. If not, ignore this.

Parker`
}

export function madeEmailHtml(input: {
  name: string
  address: string
  editorUrl: string
}) {
  const hi = firstNameFrom(input.name)
  const hello = hi ? `Hey ${escapeHtml(hi)} —` : 'Hey —'
  const address = escapeHtml(input.address.trim() || 'your listing')
  const editorUrl = escapeHtml(input.editorUrl)
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your seller at ${address} only sees the listing</title>
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
              <p style="margin:0 0 8px;font-size:16px;line-height:1.5;color:#e2e8f0;">${hello}</p>
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#e8ec00;">${address}</p>
              <p style="margin:0 0 14px;font-size:28px;line-height:1.15;font-weight:900;letter-spacing:-0.03em;color:#f8fafc;">Your seller only sees the listing.</p>
              <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#94a3b8;">
                Not the work behind it. Sellers want that information. I started a report you can text them so they see it.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 8px;">
                <tr>
                  <td align="center" style="background-color:#34d399;border-radius:12px;">
                    <a href="${editorUrl}" style="display:block;background-color:#34d399;border-radius:12px;padding:16px 28px;font-size:16px;font-weight:900;color:#0f172a;text-decoration:none;letter-spacing:0.01em;">Preview the seller report</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#94a3b8;">
                Takes a minute. Free to try.
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

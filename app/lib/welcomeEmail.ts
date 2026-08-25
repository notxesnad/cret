export function welcomeEmailHtml(confirmationUrl: string) {
  const safeUrl = confirmationUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address - Cool Real Estate Tools</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .content {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 24px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .logo { font-size: 32px; margin-bottom: 24px; line-height: 1; }
    h1 {
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 16px;
      color: #f8fafc;
      letter-spacing: -0.025em;
    }
    p { font-size: 16px; line-height: 1.6; color: #94a3b8; margin: 0 0 32px; }
    .button-container { margin-bottom: 32px; }
    .button {
      display: inline-block;
      background-color: #10b981;
      color: #020617 !important;
      font-weight: 900;
      font-size: 16px;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 12px;
    }
    .footer {
      font-size: 14px;
      color: #64748b;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #334155;
    }
    .footer p { font-size: 14px; margin: 0 0 8px; }
    .raw-link { color: #10b981; word-break: break-all; font-size: 14px; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="logo">🏠✨</div>
      <h1>Verify your email address</h1>
      <p>Welcome to <span style="font-weight: 900; letter-spacing: -0.05em;"><span style="color: #94a3b8;">COOL</span><span style="color: #10b981;">REALESTATE</span><span style="color: #94a3b8;">TOOLS</span></span>! Play around for now, then confirm your email so you stay signed in on this device.</p>
      <div class="button-container">
        <a href="${safeUrl}" class="button">Verify Email</a>
      </div>
      <div class="footer">
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Having trouble with the button? Copy and paste this URL into your browser:</p>
        <a href="${safeUrl}" class="raw-link">${safeUrl}</a>
      </div>
    </div>
  </div>
</body>
</html>`
}

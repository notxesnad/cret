export function isTwilioConfigured() {
  return Boolean(twilioAccountSid() && twilioAuthToken() && (twilioFromNumber() || twilioMessagingServiceSid()))
}

function twilioAccountSid() {
  return (process.env.TWILIO_ACCOUNT_SID || '').trim()
}

function twilioAuthToken() {
  return (process.env.TWILIO_AUTH_TOKEN || '').trim()
}

function twilioFromNumber() {
  return (process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER || '').trim()
}

function twilioMessagingServiceSid() {
  return (process.env.TWILIO_MESSAGING_SERVICE_SID || '').trim()
}

export function toE164(phone: string) {
  const trimmed = phone.trim()
  if (!trimmed) return ''
  const digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+') && digits.length >= 10 && digits.length <= 15) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return ''
}

export async function sendTwilioSms(input: { to: string; body: string }) {
  if (!isTwilioConfigured()) {
    return { error: 'Twilio is not set up yet. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.' }
  }
  const to = toE164(input.to)
  if (!to) return { error: 'That phone number is not valid.' }
  const body = input.body.trim()
  if (!body) return { error: 'The text is empty.' }

  const sid = twilioAccountSid()
  const params = new URLSearchParams()
  params.set('To', to)
  params.set('Body', body)
  const messagingSid = twilioMessagingServiceSid()
  if (messagingSid) params.set('MessagingServiceSid', messagingSid)
  else params.set('From', twilioFromNumber())

  const auth = Buffer.from(`${sid}:${twilioAuthToken()}`).toString('base64')
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  const payload = (await res.json().catch(() => null)) as { sid?: string; message?: string; code?: number } | null
  if (!res.ok) {
    return { error: payload?.message || 'Twilio could not send that text.' }
  }
  return { sid: payload?.sid || '' }
}

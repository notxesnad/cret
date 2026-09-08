const DEFAULT_ADMIN_EMAILS = ['notxesnad@gmail.com']

export function isAdminEmail(email?: string | null) {
  if (!email) return false
  const lower = email.trim().toLowerCase()
  const listed = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  if (listed.includes(lower) || DEFAULT_ADMIN_EMAILS.includes(lower)) return true
  return lower.endsWith('@coolrealestatetools.com')
}

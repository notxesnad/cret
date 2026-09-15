import { redirect } from 'next/navigation'

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function redirectWithEmailUtm(
  pathname: string,
  extra: Record<string, string>,
  searchParams: Record<string, string | string[] | undefined>,
  defaults: Record<string, string>
) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...defaults, ...extra })) {
    if (value) params.set(key, value)
  }
  for (const [key, value] of Object.entries(searchParams)) {
    const next = first(value)
    if (next && key !== 'view') params.set(key, next)
  }
  const qs = params.toString()
  redirect(qs ? `${pathname}?${qs}` : pathname)
}

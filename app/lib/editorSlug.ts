import { randomBytes } from 'node:crypto'
import { editorHref, publicOrigin } from '@/app/lib/editorLink'
import { isMissingRelation } from '@/app/lib/workspace'

const CODE_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'
const CODE_LENGTH = 4
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]{4}$/

type Db = { from: (table: string) => any }

export function slugifyAddress(address: string) {
  const slug = address
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
    .replace(/-+$/g, '')
  return slug || 'listing'
}

function randomCode() {
  const bytes = randomBytes(CODE_LENGTH)
  let code = ''
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length]
  return code
}

export function makeEditorSlug(address: string) {
  return `${slugifyAddress(address)}-${randomCode()}`
}

export function isEditorSlug(value: string) {
  return SLUG_PATTERN.test(value.trim().toLowerCase())
}

export function fallbackEditorSlug(address: string, listingId: string) {
  return `${slugifyAddress(address)}-${listingId}`
}

export function listingIdFromFallbackSlug(slug: string) {
  const last = slug.trim().toLowerCase().split('-').pop() || ''
  return /^[a-f0-9]{10}$/.test(last) ? last : null
}

export function prettyEditorHref(slug: string, opts?: { bare?: boolean }) {
  const href = `${publicOrigin()}/${slug}`
  return opts?.bare ? href.replace(/^https?:\/\//, '') : href
}

export function outreachEditorHref(input: {
  profileId: string
  listingId: string
  address?: string
  slug?: string | null
  via?: string
  bare?: boolean
}) {
  if (input.slug) return prettyEditorHref(input.slug, { bare: input.bare })
  if (input.address) return prettyEditorHref(fallbackEditorSlug(input.address, input.listingId), { bare: input.bare })
  return editorHref(input.profileId, input.listingId, input.via ? { via: input.via } : undefined)
}

export async function ensureEditorSlug(
  db: Db,
  listingId: string,
  address: string,
  existing?: string | null
) {
  const current = existing?.trim().toLowerCase()
  if (current && isEditorSlug(current)) return current

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = makeEditorSlug(address)
    const updated = await db.from('listings').update({ editor_slug: slug }).eq('id', listingId)
    if (!updated.error) return slug
    if (isMissingRelation(updated.error)) return null
    if (updated.error.code !== '23505' && !/duplicate|unique/i.test(updated.error.message || '')) {
      console.error('ensureEditorSlug', updated.error)
      return null
    }
  }
  return null
}

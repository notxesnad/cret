import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const AUTH_KEY = 'crt-auth'
const PERSIST_KEY = 'crt-auth-persist'
const PENDING_KEY = 'crt-auth-persist-pending'
const SESSION_ONLY_KEY = 'crt-session-only'
const AWAITING_KEY = 'crt_awaiting_magic'

function isMagicLinkReturn() {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash || ''
  const search = window.location.search || ''
  return hash.includes('access_token') || search.includes('code=')
}

function shouldPersistAuth() {
  if (typeof window === 'undefined') return false
  return (
    localStorage.getItem(PERSIST_KEY) === '1'
    || localStorage.getItem(PENDING_KEY) === '1'
    || isMagicLinkReturn()
  )
}

export function markAuthSessionOnly() {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SESSION_ONLY_KEY, '1')
  localStorage.removeItem(PERSIST_KEY)
  localStorage.removeItem(PENDING_KEY)
  const persisted = localStorage.getItem(AUTH_KEY)
  if (persisted && !sessionStorage.getItem(AUTH_KEY)) {
    sessionStorage.setItem(AUTH_KEY, persisted)
  }
  localStorage.removeItem(AUTH_KEY)
}

export function markAuthPersistPending() {
  if (typeof window === 'undefined') return
  localStorage.setItem(PENDING_KEY, '1')
}

export function markAuthPersisted() {
  if (typeof window === 'undefined') return
  localStorage.setItem(PERSIST_KEY, '1')
  localStorage.removeItem(PENDING_KEY)
  sessionStorage.removeItem(SESSION_ONLY_KEY)
  const session = sessionStorage.getItem(AUTH_KEY)
  if (session) {
    localStorage.setItem(AUTH_KEY, session)
    sessionStorage.removeItem(AUTH_KEY)
  }
}

export function clearAuthPersistFlags() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PERSIST_KEY)
  localStorage.removeItem(PENDING_KEY)
  sessionStorage.removeItem(SESSION_ONLY_KEY)
}

export function setAwaitingMagicLink({ email, firstName }) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(AWAITING_KEY, JSON.stringify({
    email: email || '',
    firstName: firstName || ''
  }))
}

export function getAwaitingMagicLink() {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(AWAITING_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearAwaitingMagicLink() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(AWAITING_KEY)
}

function createAuthStorage() {
  if (typeof window === 'undefined') return undefined
  return {
    getItem: (key) => window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key),
    setItem: (key, value) => {
      if (shouldPersistAuth()) {
        window.localStorage.setItem(key, value)
        window.sessionStorage.removeItem(key)
      } else {
        window.sessionStorage.setItem(key, value)
        window.localStorage.removeItem(key)
      }
    },
    removeItem: (key) => {
      window.localStorage.removeItem(key)
      window.sessionStorage.removeItem(key)
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: supabaseAnonKey ? { headers: { apikey: supabaseAnonKey } } : undefined,
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    storage: createAuthStorage(),
    storageKey: AUTH_KEY,
  }
})

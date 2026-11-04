import { useSyncExternalStore } from 'react'
import { api, tokens, setUnauthorizedHandler } from './client.js'

// Session is kept in module state and mirrored to localStorage via client.js.
// `me` is re-fetched on boot so a stale/expired token cannot leave the UI
// showing a logged-in shell it can no longer back with data.

const listeners = new Set()
let session = { user: null, ready: false }

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function emit() {
  for (const fn of listeners) fn(session)
}

export const getSession = () => session

/** React binding: re-renders when the session object changes. */
export const useSession = () => useSyncExternalStore(subscribe, getSession)

function setSession(next) {
  session = { ...session, ...next }
  emit()
}

export function isAuthenticated() {
  return Boolean(session.user && tokens.access)
}

/** Restore a session from a stored token. Called once on boot. */
export async function bootstrap() {
  if (!tokens.access) {
    setSession({ ready: true, user: null })
    return
  }
  try {
    const user = await api.get('/auth/me')
    setSession({ user, ready: true })
  } catch {
    tokens.clear()
    setSession({ user: null, ready: true })
  }
}

setUnauthorizedHandler(() => setSession({ user: null }))

/**
 * Password login. Returns `{ mfaRequired: true, challengeToken }` when the
 * account has MFA enabled — the caller must then call `loginMfa`.
 */
export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password }, { auth: false })

  if (data?.mfa_required) {
    return { mfaRequired: true, challengeToken: data.challenge_token }
  }

  tokens.set(data)
  const user = await api.get('/auth/me')
  setSession({ user })
  return { mfaRequired: false, user }
}

export async function loginMfa(challengeToken, code) {
  const data = await api.post('/auth/login/mfa', { challenge_token: challengeToken, code }, { auth: false })
  tokens.set(data)
  const user = await api.get('/auth/me')
  setSession({ user })
  return user
}

export async function signup(fullName, email, password) {
  const data = await api.post('/auth/signup', { full_name: fullName, email, password }, { auth: false })
  tokens.set(data.tokens)
  setSession({ user: data.user })
  return data.user
}

export async function logout() {
  try { await api.post('/auth/logout') } catch { /* best effort */ }
  tokens.clear()
  setSession({ user: null })
}

/** Whether the signed-in user belongs to a lender organisation. */
export function hasOrg(user) {
  return Boolean(user && (user.tenant_id || user.member_role))
}

// Minimal API client for the Krane backend.
//
// Deliberately not the published SDK: this app talks to a thin proxy of our
// own, needs to shape payloads anyway, and half the console surface (team,
// KYB, demo) is not covered by the SDK yet.
//
// Auth: JWT bearer only. The X-API-Key routes (scoring, identity) are not used
// by these pages and must never be called from the browser with a tenant key.

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8001').replace(/\/$/, '')
const PREFIX = '/api/v1'

const ACCESS_KEY = 'kk-access-token'
const REFRESH_KEY = 'kk-refresh-token'

export class ApiError extends Error {
  constructor(status, code, detail, requestId) {
    super(detail || `Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.detail = detail
    this.requestId = requestId
  }
}

export const tokens = {
  get access() { try { return localStorage.getItem(ACCESS_KEY) } catch { return null } },
  get refresh() { try { return localStorage.getItem(REFRESH_KEY) } catch { return null } },
  set({ access_token, refresh_token }) {
    try {
      if (access_token) localStorage.setItem(ACCESS_KEY, access_token)
      if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token)
    } catch { /* storage unavailable */ }
  },
  clear() {
    try { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY) } catch { /* ignore */ }
  },
}

let onUnauthorized = null
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

async function parse(res) {
  const text = await res.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return text }
}

function toError(status, body) {
  // Backend error shape: { error: { code, type, detail, request_id } }
  if (body && typeof body === 'object' && body.error) {
    const e = body.error
    return new ApiError(status, e.code, e.detail, e.request_id)
  }
  if (body && typeof body === 'object' && body.detail) {
    const detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    return new ApiError(status, null, detail)
  }
  return new ApiError(status, null, typeof body === 'string' ? body : null)
}

async function send(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  // FormData must go out untouched: the browser sets the multipart boundary.
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const headers = { Accept: 'application/json' }
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  if (auth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`

  const res = await fetch(`${API_BASE}${PREFIX}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })

  if (res.status === 401 && auth && retry && tokens.refresh) {
    if (await refreshSession()) return send(path, { method, body, auth, retry: false })
    tokens.clear()
    onUnauthorized?.()
  }

  const payload = await parse(res)
  if (!res.ok) throw toError(res.status, payload)
  return payload
}

async function refreshSession() {
  try {
    const res = await fetch(`${API_BASE}${PREFIX}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh }),
    })
    if (!res.ok) return false
    const data = await parse(res)
    if (!data?.access_token) return false
    tokens.set(data)
    return true
  } catch {
    return false
  }
}

export const api = {
  get: (path, opts) => send(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => send(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => send(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => send(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => send(path, { ...opts, method: 'DELETE' }),
  upload: (path, file) => {
    const form = new FormData()
    form.append('file', file)
    return send(path, { method: 'POST', body: form })
  },
}

export { API_BASE }

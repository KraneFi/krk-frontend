// Scoring, identity and the per-browser check index.
//
// Two auth models meet here:
//   * identity / bank statements / credit reports / demo — console JWT (api client)
//   * /scores/*                                         — X-API-Key
//
// The key never goes into the bundle. A browser session mints its own sandbox key
// (shown once by the API) and keeps it in sessionStorage, so it dies with the tab and
// can be revoked from API & Docs. This is a deliberate trade-off for the console demo;
// production should proxy these calls instead of shipping a tenant key to a browser.

import { api, API_BASE, ApiError } from './client.js'
import { tenant } from './resources.js'

const KEY_STORAGE = 'kk-scoring-key'
const KEY_ID_STORAGE = 'kk-scoring-key-id'

export const getScoringKey = () => {
  try { return sessionStorage.getItem(KEY_STORAGE) } catch { return null }
}

export const clearScoringKey = () => {
  try { sessionStorage.removeItem(KEY_STORAGE); sessionStorage.removeItem(KEY_ID_STORAGE) } catch { /* ignore */ }
}

/** Reuse this session's key, or mint a fresh sandbox key for the tenant. */
export async function ensureScoringKey(tenantId) {
  const existing = getScoringKey()
  if (existing) return existing
  if (!tenantId) throw new ApiError(400, 'no_tenant', 'This account has no organisation yet.')
  const created = await tenant.createKey(tenantId, `Console session ${new Date().toISOString().slice(0, 16)}`, 'test')
  try {
    sessionStorage.setItem(KEY_STORAGE, created.raw_key)
    sessionStorage.setItem(KEY_ID_STORAGE, created.id)
  } catch { /* storage unavailable */ }
  return created.raw_key
}

async function scored(path, { method = 'GET', body } = {}) {
  const key = getScoringKey()
  if (!key) throw new ApiError(401, 'no_api_key', 'No scoring key for this browser session.')
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'X-API-Key': key,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let payload = null
  try { payload = text ? JSON.parse(text) : null } catch { payload = text }
  if (!res.ok) {
    if (res.status === 401) clearScoringKey()
    const e = payload?.error
    throw new ApiError(res.status, e?.code, e?.detail || payload?.detail, e?.request_id)
  }
  return payload
}

export const identity = {
  create: (body) => scored('/identity/individuals', { method: 'POST', body }),
}

export const bankStatements = {
  /** Provider is a query param; individual_id and extract are form fields. */
  upload: (individualId, file, provider = 'GTBANK') => api.upload(
    '/bank-statements/upload',
    file,
    { fields: { individual_id: individualId, extract: 'true' }, query: `?provider=${provider}` },
  ),
  get: (sourceId) => api.get(`/bank-statements/${sourceId}`),
  analyse: (documentIds, individualId) => api.post('/bank-statements/analyse', {
    document_ids: documentIds,
    individual_id: individualId,
  }),
}

export const creditReports = {
  upload: (individualId, file, provider = 'custom_pdf') => api.upload(
    '/credit-reports/upload',
    file,
    { fields: { individual_id: individualId, extract: 'true' }, query: `?provider=${provider}` },
  ),
  get: (reportId) => api.get(`/credit-reports/${reportId}`),
}

export const scores = {
  /** Explicit references work even when auto-discovery cannot see the rows. */
  fromSources: (payload) => scored('/scores/composite/from-sources', { method: 'POST', body: payload }),
  composite: (individualId) => scored(`/scores/individuals/${individualId}/composite`, { method: 'POST' }),
}

export const demo = {
  seedSample: (profileType) => api.post('/demo/seed-sample', { profile_type: profileType }),
}

// ── Check index ─────────────────────────────────────────────────────────────
// There is no tenant-wide checks endpoint, so the console keeps the ids it created.
// This is a stopgap, not a source of truth: replace it when the API can list checks.

const indexKey = (tenantId) => `kk-checks:${tenantId || 'default'}`

export function listChecks(tenantId) {
  try {
    const rows = JSON.parse(localStorage.getItem(indexKey(tenantId)) || '[]')
    return Array.isArray(rows) ? rows : []
  } catch { return [] }
}

export function getCheck(tenantId, id) {
  return listChecks(tenantId).find((c) => c.id === id) || null
}

export function saveCheck(tenantId, record) {
  const rows = listChecks(tenantId)
  const next = [record, ...rows.filter((c) => c.id !== record.id)].slice(0, 200)
  try { localStorage.setItem(indexKey(tenantId), JSON.stringify(next)) } catch { /* storage full */ }
  return record
}

export function removeCheck(tenantId, id) {
  const next = listChecks(tenantId).filter((c) => c.id !== id)
  try { localStorage.setItem(indexKey(tenantId), JSON.stringify(next)) } catch { /* ignore */ }
  return next
}

/** Turn a composite response (+ the borrower we checked) into an index record. */
export function toCheckRecord(composite, borrower, extra = {}) {
  return {
    id: `chk_${(globalThis.crypto?.randomUUID?.() || `${Date.now()}`).replace(/-/g, '').slice(0, 12)}`,
    individual_id: composite.individual_id,
    name: borrower.name,
    phone: borrower.phone || null,
    bvn: borrower.bvn || null,
    created_at: new Date().toISOString(),
    score: composite.score,
    risk_code: composite.risk_code,
    debt_code: composite.debt_code,
    tier_code: composite.tier_code,
    krk_signal: composite.krk_signal,
    outcome: composite.outcome,
    confidence: composite.confidence,
    engine_contributions: composite.engine_contributions || [],
    flags: composite.flags || [],
    reason_codes: composite.reason_codes || [],
    dockets_used: composite.dockets_used || [],
    metadata: composite.metadata || {},
    recommendation: composite.recommendation || null,
    ...extra,
  }
}

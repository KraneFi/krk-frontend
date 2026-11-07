// AI helpers. Both routes are X-API-Key (tenant-scoped), not the console JWT.
// They call the configured LLM provider; when that provider is not configured
// the API answers 502 with code "LLM_PROVIDER_ERROR" and the UI says so plainly.

import { keyedForTenant } from './scoring.js'

export const ai = {
  advice: (tenantId, individualId) =>
    keyedForTenant(tenantId, '/ai/advice', { method: 'POST', body: { individual_id: individualId } }),
  explain: (tenantId, scoreId) =>
    keyedForTenant(tenantId, `/ai/explain/${scoreId}`, { method: 'POST' }),
}

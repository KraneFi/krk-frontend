// Webhook endpoints and delivery history. Guarded by X-API-Key, so these use
// the same per-browser session key as scoring (minted on demand, revocable).

import { keyedForTenant } from './scoring.js'

export const webhooks = {
  list: (tenantId) => keyedForTenant(tenantId, '/webhooks/endpoints'),
  create: (tenantId, url, events) =>
    keyedForTenant(tenantId, '/webhooks/endpoints', { method: 'POST', body: { url, events } }),
  remove: (tenantId, endpointId) =>
    keyedForTenant(tenantId, `/webhooks/endpoints/${endpointId}`, { method: 'DELETE' }),
  deliveries: (tenantId, endpointId) =>
    keyedForTenant(tenantId, `/webhooks/endpoints/${endpointId}/deliveries`),
}

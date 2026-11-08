// Billing is tenant-scoped: GET /billing/* is guarded by X-API-Key, not the
// console JWT. Uses the same per-browser session key as scoring.

import { keyedForTenant } from './scoring.js'

export const billing = {
  usage: (tenantId) => keyedForTenant(tenantId, '/billing/usage'),
  invoices: (tenantId) => keyedForTenant(tenantId, '/billing/invoices'),
  invoice: (tenantId, invoiceId) => keyedForTenant(tenantId, `/billing/invoices/${invoiceId}`),
}

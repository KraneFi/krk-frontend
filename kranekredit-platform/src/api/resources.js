import { api } from './client.js'

// Thin resource wrappers. Kept separate from page code so the response shape is
// visible in one place when the backend contract changes.

export const team = {
  members: () => api.get('/team/members'),
  invites: () => api.get('/team/invites'),
  invite: (email, role) => api.post('/team/invites', { email, role }),
  updateRole: (userId, role) => api.patch(`/team/members/${userId}`, { role }),
  remove: (userId) => api.del(`/team/members/${userId}`),
  revokeInvite: (inviteId) => api.del(`/team/invites/${inviteId}`),
  resendInvite: (inviteId) => api.post(`/team/invites/${inviteId}/resend`),
}

export const kyb = {
  /** 404 when the user has no organisation yet. */
  current: () => api.get('/orgs/current'),
  update: (patch) => api.patch('/orgs/current', patch),
  access: () => api.get('/orgs/current/access'),
  verification: () => api.get('/orgs/current/verification'),
  history: () => api.get('/orgs/current/verification/history'),
  create: (displayName) => api.post('/orgs', { display_name: displayName }),
}

export const account = {
  pendingAgreements: () => api.get('/me/agreements/pending'),
}

export const tenant = {
  get: (tenantId) => api.get(`/tenants/${tenantId}`),
  keys: (tenantId) => api.get(`/tenants/${tenantId}/keys`),
  createKey: (tenantId, label, environment = 'test') =>
    api.post(`/tenants/${tenantId}/keys`, { label, environment }),
  revokeKey: (tenantId, keyId) => api.del(`/tenants/${tenantId}/keys/${keyId}`),
}

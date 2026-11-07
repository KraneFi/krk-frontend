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

  // One verification item, including its change history.
  item: (key) => api.get(`/orgs/current/verification/${key}`),
  saveDraft: (key, fields) => api.put(`/orgs/current/verification/${key}/draft`, { fields }),
  uploadDocument: (key, file) => api.upload(`/orgs/current/verification/${key}/documents`, file),
  submitItem: (key, body = {}) => api.post(`/orgs/current/verification/${key}/submit`, body),

  directors: {
    send: (name, email) => api.post('/orgs/current/directors/links', { name, email }),
    resend: (linkId) => api.post(`/orgs/current/directors/links/${linkId}/resend`),
    revoke: (linkId) => api.del(`/orgs/current/directors/links/${linkId}`),
  },
}

export const account = {
  pendingAgreements: () => api.get('/me/agreements/pending'),
  acceptAgreements: (documentIds) => api.post('/legal/acceptances', { document_ids: documentIds }),

  // Phone and TOTP are what the KYB "phone"/"twofa" items derive their status from.
  sendPhoneCode: (phone) => api.post('/auth/phone/send-code', { phone }),
  verifyPhone: (code) => api.post('/auth/phone/verify', { code }),
  totpSetup: () => api.post('/auth/mfa/totp/setup'),
  totpEnable: (code) => api.post('/auth/mfa/totp/enable', { code }),
}

export const tenant = {
  get: (tenantId) => api.get(`/tenants/${tenantId}`),
  keys: (tenantId) => api.get(`/tenants/${tenantId}/keys`),
  createKey: (tenantId, label, environment = 'test') =>
    api.post(`/tenants/${tenantId}/keys`, { label, environment }),
  revokeKey: (tenantId, keyId) => api.del(`/tenants/${tenantId}/keys/${keyId}`),
}

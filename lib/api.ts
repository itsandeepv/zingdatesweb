const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function req<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new ApiError(res.status, err.message ?? 'Request failed')
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

/* ─── Auth ────────────────────────────────────────────────────── */
export const authApi = {
  sendOtp: (phone: string, countryCode: string) =>
    req<{ message: string; otp?: string; dev_mode?: boolean }>('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone, country_code: countryCode }) }),

  verifyOtp: (phone: string, countryCode: string, otp: string) =>
    req<{ token: string; user: any; is_new_user: boolean }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, country_code: countryCode, otp }) }),

  adminLogin: (email: string, password: string) =>
    req<{ token: string; user: any }>('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  googleLogin: (idToken: string) =>
    req<{ token: string; user: any; is_new_user: boolean }>('/auth/google', { method: 'POST', body: JSON.stringify({ token: idToken }) }),

  facebookLogin: (accessToken: string) =>
    req<{ token: string; user: any; is_new_user: boolean }>('/auth/facebook', { method: 'POST', body: JSON.stringify({ token: accessToken }) }),

  logout: (token: string) =>
    req<{ message: string }>('/auth/logout', { method: 'POST' }, token),
}

/* ─── Admin Dashboard ─────────────────────────────────────────── */
export const dashboardApi = {
  stats: (token: string) => req<any>('/admin/dashboard/stats', {}, token),
  activity: (token: string, page = 1) => req<any>(`/admin/dashboard/activity?page=${page}`, {}, token),
  recentActivity: (token: string) => req<any>('/admin/dashboard/activity?page=1', {}, token),
}

/* ─── Admin Users ─────────────────────────────────────────────── */
export const usersApi = {
  list: (token: string, params: Record<string, string> = {}) =>
    req<any>(`/admin/users?${new URLSearchParams(params)}`, {}, token),
  create: (token: string, data: Record<string, any>) =>
    req<any>('/admin/users', { method: 'POST', body: JSON.stringify(data) }, token),
  get: (token: string, id: number) => req<any>(`/admin/users/${id}`, {}, token),
  update: (token: string, id: number, data: Record<string, any>) =>
    req<any>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  suspend: (token: string, id: number, reason: string, days?: number) =>
    req<any>(`/admin/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason, duration_days: days }) }, token),
  unsuspend: (token: string, id: number) =>
    req<any>(`/admin/users/${id}/unsuspend`, { method: 'POST' }, token),
  verify: (token: string, id: number) =>
    req<any>(`/admin/users/${id}/verify`, { method: 'POST' }, token),
  delete: (token: string, id: number) =>
    req<any>(`/admin/users/${id}`, { method: 'DELETE' }, token),
  bulkAction: (token: string, action: string, ids: number[]) =>
    req<any>('/admin/users/bulk-action', { method: 'POST', body: JSON.stringify({ action, user_ids: ids }) }, token),
}

/* ─── Admin Events ────────────────────────────────────────────── */
export const eventsApi = {
  list: (token: string, params: Record<string, string> = {}) =>
    req<any>(`/admin/events?${new URLSearchParams(params)}`, {}, token),
  approve: (token: string, id: number) =>
    req<any>(`/admin/events/${id}/approve`, { method: 'POST' }, token),
  cancel: (token: string, id: number, reason: string) =>
    req<any>(`/admin/events/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }, token),
  delete: (token: string, id: number) =>
    req<any>(`/admin/events/${id}`, { method: 'DELETE' }, token),
  // Public
  publicList: (params: Record<string, string> = {}) =>
    req<any>(`/events?${new URLSearchParams(params)}`),
}

/* ─── Admin Payments ──────────────────────────────────────────── */
export const paymentsApi = {
  list: (token: string, params: Record<string, string> = {}) =>
    req<any>(`/admin/payments?${new URLSearchParams(params)}`, {}, token),
  get: (token: string, id: number) => req<any>(`/admin/payments/${id}`, {}, token),
  refund: (token: string, id: number, reason: string, amount?: number) =>
    req<any>(`/admin/payments/${id}/refund`, { method: 'POST', body: JSON.stringify({ reason, amount }) }, token),
  export: (token: string) => req<any>('/admin/payments/export', {}, token),
  transactions: (token: string, params: Record<string, string> = {}) =>
    req<any>(`/admin/transactions?${new URLSearchParams(params)}`, {}, token),
  stats: (token: string) => req<any>('/admin/payments/stats', {}, token),
}

/* ─── Admin Subscriptions ─────────────────────────────────────── */
export const subscriptionsApi = {
  list: (token: string, params: Record<string, string> = {}) =>
    req<any>(`/admin/subscriptions?${new URLSearchParams(params)}`, {}, token),
  cancel: (token: string, id: number, reason?: string) =>
    req<any>(`/admin/subscriptions/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }, token),
  // Plans
  listPlans: (token: string) => req<any>('/admin/plans', {}, token),
  createPlan: (token: string, data: Record<string, any>) =>
    req<any>('/admin/plans', { method: 'POST', body: JSON.stringify(data) }, token),
  updatePlan: (token: string, id: number, data: Record<string, any>) =>
    req<any>(`/admin/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  deletePlan: (token: string, id: number) =>
    req<any>(`/admin/plans/${id}`, { method: 'DELETE' }, token),
}

/* ─── Admin Staff ─────────────────────────────────────────────── */
export const staffApi = {
  list: (token: string, params: Record<string, string> = {}) =>
    req<any>(`/admin/staff?${new URLSearchParams(params)}`, {}, token),
  invite: (token: string, data: Record<string, any>) =>
    req<any>('/admin/staff', { method: 'POST', body: JSON.stringify(data) }, token),
  update: (token: string, id: number, data: Record<string, any>) =>
    req<any>(`/admin/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  suspend: (token: string, id: string | number) =>
    req<any>(`/admin/staff/${id}/suspend`, { method: 'POST' }, token),
  remove: (token: string, id: string | number) =>
    req<any>(`/admin/staff/${id}`, { method: 'DELETE' }, token),
  auditLogs: (token: string, params: Record<string, string> = {}) =>
    req<any>(`/admin/audit-logs?${new URLSearchParams(params)}`, {}, token),
}

/* ─── Admin Support ───────────────────────────────────────────── */
export const supportApi = {
  list: (token: string, params: Record<string, string> = {}) =>
    req<any>(`/admin/tickets?${new URLSearchParams(params)}`, {}, token),
  get: (token: string, id: number) => req<any>(`/admin/tickets/${id}`, {}, token),
  reply: (token: string, id: number, body: string) =>
    req<any>(`/admin/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) }, token),
  resolve: (token: string, id: number) =>
    req<any>(`/admin/tickets/${id}/resolve`, { method: 'POST' }, token),
  escalate: (token: string, id: number) =>
    req<any>(`/admin/tickets/${id}/escalate`, { method: 'POST' }, token),
  assign: (token: string, id: number, agentId: number) =>
    req<any>(`/admin/tickets/${id}/assign`, { method: 'POST', body: JSON.stringify({ agent_id: agentId }) }, token),
}

/* ─── Admin SEO ───────────────────────────────────────────────── */
export const seoApi = {
  pages: (token: string) => req<any>('/admin/seo/pages', {}, token),
  updatePage: (token: string, id: number, data: Record<string, any>) =>
    req<any>(`/admin/seo/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  generateSitemap: (token: string) =>
    req<any>('/admin/seo/sitemap/generate', { method: 'POST' }, token),
  redirects: (token: string) => req<any>('/admin/seo/redirects', {}, token),
  addRedirect: (token: string, data: Record<string, any>) =>
    req<any>('/admin/seo/redirects', { method: 'POST', body: JSON.stringify(data) }, token),
  deleteRedirect: (token: string, id: number) =>
    req<any>(`/admin/seo/redirects/${id}`, { method: 'DELETE' }, token),
}

/* ─── Admin Marketing ─────────────────────────────────────────── */
export const marketingApi = {
  campaigns: (token: string) => req<any>('/admin/campaigns', {}, token),
  createCampaign: (token: string, data: Record<string, any>) =>
    req<any>('/admin/campaigns', { method: 'POST', body: JSON.stringify(data) }, token),
  updateCampaign: (token: string, id: number, data: Record<string, any>) =>
    req<any>(`/admin/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  sendCampaign: (token: string, id: number) =>
    req<any>(`/admin/campaigns/${id}/send`, { method: 'POST' }, token),
  deleteCampaign: (token: string, id: number) =>
    req<any>(`/admin/campaigns/${id}`, { method: 'DELETE' }, token),
  coupons: (token: string) => req<any>('/admin/coupons', {}, token),
  createCoupon: (token: string, data: Record<string, any>) =>
    req<any>('/admin/coupons', { method: 'POST', body: JSON.stringify(data) }, token),
  deleteCoupon: (token: string, id: number) =>
    req<any>(`/admin/coupons/${id}`, { method: 'DELETE' }, token),
  toggleCoupon: (token: string, id: number, isActive: boolean) =>
    req<any>(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify({ is_active: isActive }) }, token),
}

/* ─── Admin Analytics ─────────────────────────────────────────── */
export const analyticsApi = {
  overview: (token: string, period = '30d') => req<any>(`/admin/analytics/overview?period=${period}`, {}, token),
  users: (token: string) => req<any>('/admin/analytics/users', {}, token),
  revenue: (token: string) => req<any>('/admin/analytics/revenue', {}, token),
  events: (token: string) => req<any>('/admin/analytics/events', {}, token),
  export: (token: string, type: string) =>
    req<any>('/admin/analytics/export', { method: 'POST', body: JSON.stringify({ type }) }, token),
}

/* ─── Admin Settings ──────────────────────────────────────────── */
export const settingsApi = {
  get: (token: string) => req<any>('/admin/settings', {}, token),
  update: (token: string, settings: Record<string, any>) =>
    req<any>('/admin/settings', { method: 'PUT', body: JSON.stringify({ settings }) }, token),
  toggleMaintenance: (token: string) =>
    req<any>('/admin/settings/maintenance', { method: 'POST' }, token),
  updateSecurity: (token: string, data: Record<string, any>) =>
    req<any>('/admin/settings/security', { method: 'PUT', body: JSON.stringify(data) }, token),
}

/* ─── Admin Mobile ────────────────────────────────────────────── */
export const mobileApi = {
  versions: (token: string) => req<any>('/admin/mobile/versions', {}, token),
  createVersion: (token: string, data: Record<string, any>) =>
    req<any>('/admin/mobile/versions', { method: 'POST', body: JSON.stringify(data) }, token),
  updateVersion: (token: string, id: number, data: Record<string, any>) =>
    req<any>(`/admin/mobile/versions/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  flags: (token: string) => req<any>('/admin/mobile/flags', {}, token),
  updateFlag: (token: string, id: number, enabled: boolean) =>
    req<any>(`/admin/mobile/flags/${id}`, { method: 'PUT', body: JSON.stringify({ is_enabled: enabled }) }, token),
  config: (token: string) => req<any>('/admin/mobile/config', {}, token),
  updateConfig: (token: string, config: Record<string, any>) =>
    req<any>('/admin/mobile/config', { method: 'PUT', body: JSON.stringify({ config }) }, token),
}

/* ─── Admin API Keys ──────────────────────────────────────────── */
export const apiKeysApi = {
  list: (token: string) => req<any>('/admin/api-keys', {}, token),
  create: (token: string, data: Record<string, any>) =>
    req<any>('/admin/api-keys', { method: 'POST', body: JSON.stringify(data) }, token),
  rotate: (token: string, id: number) =>
    req<any>(`/admin/api-keys/${id}/rotate`, { method: 'POST' }, token),
  revoke: (token: string, id: number) =>
    req<any>(`/admin/api-keys/${id}`, { method: 'DELETE' }, token),
  webhooks: (token: string) => req<any>('/admin/webhooks', {}, token),
  createWebhook: (token: string, data: Record<string, any>) =>
    req<any>('/admin/webhooks', { method: 'POST', body: JSON.stringify(data) }, token),
  toggleWebhook: (token: string, id: number, isActive: boolean) =>
    req<any>(`/admin/webhooks/${id}`, { method: 'PUT', body: JSON.stringify({ is_active: isActive }) }, token),
  testWebhook: (token: string, id: number) =>
    req<any>(`/admin/webhooks/${id}/test`, { method: 'POST' }, token),
  deleteWebhook: (token: string, id: number) =>
    req<any>(`/admin/webhooks/${id}`, { method: 'DELETE' }, token),
}

/* ─── Admin Content ───────────────────────────────────────────── */
export const contentApi = {
  pages: (token: string) => req<any>('/admin/content/pages', {}, token),
  updatePage: (token: string, id: number, data: Record<string, any>) =>
    req<any>(`/admin/content/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  blog: (token: string) => req<any>('/admin/content/blog', {}, token),
  createPost: (token: string, data: Record<string, any>) =>
    req<any>('/admin/content/blog', { method: 'POST', body: JSON.stringify(data) }, token),
  updatePost: (token: string, id: number, data: Record<string, any>) =>
    req<any>(`/admin/content/blog/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  deletePost: (token: string, id: number) =>
    req<any>(`/admin/content/blog/${id}`, { method: 'DELETE' }, token),
  media: (token: string) => req<any>('/admin/content/media', {}, token),
  uploadMedia: async (token: string, formData: FormData) => {
    const res = await fetch(`${BASE}/admin/content/media`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new ApiError(res.status, err.message ?? 'Upload failed')
    }
    return res.json()
  },
  deleteMedia: (token: string, id: number) =>
    req<any>(`/admin/content/media/${id}`, { method: 'DELETE' }, token),
}

/* ─── Admin Social ────────────────────────────────────────────── */
export const socialApi = {
  connections: (token: string, params: Record<string, string> = {}) =>
    req<any>(`/admin/social/connections?${new URLSearchParams(params)}`, {}, token),
  groups: (token: string) => req<any>('/admin/social/groups', {}, token),
  reports: (token: string, params: Record<string, string> = {}) =>
    req<any>(`/admin/social/reports?${new URLSearchParams(params)}`, {}, token),
  handleReport: (token: string, id: number, action: string, notes?: string) =>
    req<any>(`/admin/social/reports/${id}/action`, { method: 'POST', body: JSON.stringify({ action, admin_notes: notes }) }, token),
}

/* ─── Admin Messaging ─────────────────────────────────────────── */
export const messagingApi = {
  sendPush: (token: string, data: Record<string, any>) =>
    req<any>('/admin/messaging/push', { method: 'POST', body: JSON.stringify(data) }, token),
}

/* ─── Public Plans ────────────────────────────────────────────── */
export const plansApi = {
  list: () => req<any[]>('/plans'),
}

/* ─── Me (Current User) ───────────────────────────────── */
export const meApi = {
  profile: (token: string) => req<any>('/profile', {}, token),
  update: (token: string, data: Record<string, any>) =>
    req<any>('/profile', { method: 'PUT', body: JSON.stringify(data) }, token),
  uploadPhoto: async (token: string, formData: FormData) => {
    const res = await fetch(`${BASE}/profile/photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new ApiError(res.status, err.message ?? 'Upload failed')
    }
    return res.json()
  },
}

/* ─── Discovery ───────────────────────────────────────── */
export const discoverApi = {
  list: (token: string) => req<any[]>('/users/nearby', {}, token),
  like: (token: string, userId: number) =>
    req<{ matched: boolean; chat_id?: number }>(`/users/${userId}/like`, { method: 'POST' }, token),
  block: (token: string, userId: number) =>
    req<any>(`/users/${userId}/block`, { method: 'POST' }, token),
}

/* ─── Matches ─────────────────────────────────────────── */
export const matchApi = {
  list: (token: string) => req<any[]>('/likes', {}, token),
  likedMe: (token: string) => req<any[]>('/likes/received', {}, token),
}

/* ─── Chats (User) ────────────────────────────────────── */
export const chatApi = {
  list: (token: string) => req<any[]>('/chats', {}, token),
  messages: (token: string, chatId: number, page = 1) =>
    req<any>(`/chats/${chatId}/messages?page=${page}`, {}, token),
  send: (token: string, chatId: number, data: { message?: string; type?: string; file_url?: string }) =>
    req<any>(`/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify(data) }, token),
  startWith: (token: string, userId: number) =>
    req<any>(`/chats/start/${userId}`, { method: 'POST' }, token),
  markRead: (token: string, chatId: number) =>
    req<any>(`/chats/${chatId}/read`, { method: 'POST' }, token),
}

/* ─── Calls (WebRTC) ──────────────────────────────────── */
export const callApi = {
  initiate: (token: string, receiverId: number, type: 'audio' | 'video', offerSdp: string) =>
    req<any>(`/calls/${type}/${receiverId}`, {
      method: 'POST',
      body: JSON.stringify({ offer_sdp: offerSdp }),
    }, token),
  incoming: (token: string) => req<any>('/calls/incoming', {}, token),
  history: (token: string) => req<any[]>('/calls/history', {}, token),
  status: (token: string, callId: number) => req<any>(`/calls/${callId}/status`, {}, token),
  answer: (token: string, callId: number) =>
    req<any>(`/calls/${callId}/answer`, { method: 'POST' }, token),
  answerSdp: (token: string, callId: number, answerSdp: string) =>
    req<any>(`/calls/${callId}/answer-sdp`, { method: 'POST', body: JSON.stringify({ answer_sdp: answerSdp }) }, token),
  decline: (token: string, callId: number) =>
    req<any>(`/calls/${callId}/decline`, { method: 'POST' }, token),
  end: (token: string, callId: number) =>
    req<any>(`/calls/${callId}/end`, { method: 'POST' }, token),
  sendOffer: (token: string, callId: number, offerSdp: string) =>
    req<any>(`/calls/${callId}/offer`, { method: 'POST', body: JSON.stringify({ offer_sdp: offerSdp }) }, token),
  addIceCandidate: (token: string, callId: number, candidate: any) =>
    req<any>(`/calls/${callId}/ice-candidate`, { method: 'POST', body: JSON.stringify({ candidate }) }, token),
  signaling: (token: string, callId: number) => req<any>(`/calls/${callId}/signaling`, {}, token),
  mute: (token: string, callId: number) =>
    req<any>(`/calls/${callId}/mute`, { method: 'POST' }, token),
  camera: (token: string, callId: number) =>
    req<any>(`/calls/${callId}/camera`, { method: 'POST' }, token),
}

/* ─── Notifications (User) ────────────────────────────── */
export const notifApi = {
  list: (token: string) => req<any[]>('/notifications', {}, token),
  markRead: (token: string, id: number) =>
    req<any>(`/notifications/${id}/read`, { method: 'POST' }, token),
  markAllRead: (token: string) =>
    req<any>('/notifications/read', { method: 'POST' }, token),
}

/* ─── Orders / Razorpay ───────────────────────────────── */
export const orderApi = {
  create: (token: string, plan: string) =>
    req<{ order_id: string; amount: number; currency: string; key: string }>('/wallet/create-order', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }, token),
  verify: (token: string, data: { order_id: string; payment_id: string; signature: string; plan: string }) =>
    req<{ message: string; user: any }>('/wallet/verify-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token),
  transactions: (token: string) => req<any[]>('/wallet/transactions', {}, token),
  orders: (token: string) => req<any[]>('/wallet/orders', {}, token),
  paymentStatus: (token: string, orderId: string) =>
    req<any>(`/wallet/payment-status/${orderId}`, {}, token),
}

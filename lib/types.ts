/* ─── User ─────────────────────────────────────────── */
export type UserStatus = 'active' | 'suspended' | 'deleted' | 'pending'
export type UserRole   = 'user' | 'premium' | 'vip' | 'corporate'
export type Gender     = 'male' | 'female' | 'non-binary' | 'other' | 'prefer_not_to_say'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

export interface UserLocation { city: string; country: string; lat?: number; lng?: number }
export interface LoginEntry   { at: string; ip: string; device: string }

export interface User {
  id: string
  name: string
  email: string
  phone: string
  gender: Gender
  dob: string
  profilePhoto?: string
  bio?: string
  profession?: string
  company?: string
  location: UserLocation
  interests: string[]
  socialLinks: { platform: string; url: string }[]
  membershipStatus: UserRole
  subscriptionPlan?: string
  subscriptionExpiry?: string
  verificationStatus: VerificationStatus
  kycStatus: VerificationStatus
  status: UserStatus
  createdAt: string
  lastLoginAt: string
  deviceInfo?: { os: string; browser: string; ip: string }
  loginHistory: LoginEntry[]
  notes: string[]
  tags: string[]
  eventAttendanceCount: number
  coinsBalance: number
  followersCount: number
  followingCount: number
}

/* ─── Subscription ─────────────────────────────────── */
export type PlanType    = 'free' | 'premium' | 'vip' | 'corporate' | 'custom'
export type BillingCycle = 'monthly' | 'yearly'

export interface Plan {
  id: string
  name: string
  type: PlanType
  price: { monthly: number; yearly: number }
  currency: string
  features: string[]
  coinsIncluded: number
  callMinutes: number
  isPopular: boolean
  isActive: boolean
  trialDays: number
  subscriberCount: number
  createdAt: string
}

export interface Subscription {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhoto?: string
  planId: string
  planName: string
  planType: PlanType
  billingCycle: BillingCycle
  amount: number
  currency: string
  startDate: string
  endDate: string
  autoRenew: boolean
  status: 'active' | 'expired' | 'cancelled' | 'trial' | 'paused'
  couponCode?: string
  discountAmount: number
  nextBillingDate: string
  createdAt: string
}

/* ─── Payment ──────────────────────────────────────── */
export type PaymentStatus = 'success' | 'failed' | 'pending' | 'refunded' | 'disputed'
export type PaymentMethod = 'stripe' | 'razorpay' | 'paypal' | 'apple_pay' | 'google_pay' | 'upi'
export type TxType        = 'subscription' | 'coins' | 'event_ticket' | 'refund'

export interface Transaction {
  id: string
  transactionId: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  tax: number
  currency: string
  paymentMethod: PaymentMethod
  gateway: string
  status: PaymentStatus
  type: TxType
  description: string
  invoiceUrl?: string
  refundAmount?: number
  refundReason?: string
  createdAt: string
}

/* ─── Event ────────────────────────────────────────── */
export type EventStatus = 'draft' | 'pending_approval' | 'published' | 'cancelled' | 'completed'

export interface Event {
  id: string
  name: string
  description: string
  category: string
  organizerId: string
  organizerName: string
  organizerPhoto?: string
  date: string
  time: string
  duration: number
  venue: { name: string; address: string; city: string; country: string }
  capacity: number
  registrationCount: number
  checkInCount: number
  pricing: { type: 'free' | 'paid'; amount: number; currency: string }
  status: EventStatus
  coverImage?: string
  tags: string[]
  rating: number
  reviewCount: number
  revenue: number
  ticketsSold: number
  createdAt: string
}

/* ─── Support ──────────────────────────────────────── */
export type TicketStatus   = 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface TicketMessage { from: string; message: string; at: string; isAdmin: boolean }

export interface SupportTicket {
  id: string
  ticketNumber: string
  userId: string
  userName: string
  userEmail: string
  userPhoto?: string
  subject: string
  description: string
  category: string
  status: TicketStatus
  priority: TicketPriority
  assignedTo?: string
  messages: TicketMessage[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

/* ─── Analytics ────────────────────────────────────── */
export interface ChartPoint { label: string; value: number }

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisMonth: number
  totalRevenue: number
  revenueThisMonth: number
  revenueGrowth: number
  totalEvents: number
  activeEvents: number
  totalTransactions: number
  pendingTickets: number
  userGrowthData: ChartPoint[]
  revenueData: ChartPoint[]
  topCountries: { country: string; count: number; flag: string; pct: number }[]
  eventCategories: ChartPoint[]
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'new_user' | 'new_payment' | 'new_event' | 'new_ticket' | 'subscription'
  message: string
  user?: string
  amount?: number
  at: string
}

/* ─── SEO ──────────────────────────────────────────── */
export interface SEOPage {
  id: string
  page: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
  ogImage?: string
  canonicalUrl: string
  robotsIndex: boolean
  robotsFollow: boolean
  seoScore: number
  updatedAt: string
}

export interface Redirect {
  id: string
  from: string
  to: string
  type: 301 | 302
  isActive: boolean
  hits: number
  createdAt: string
}

/* ─── Admin Staff ──────────────────────────────────── */
export type AdminRole =
  | 'super_admin' | 'admin' | 'moderator'
  | 'event_manager' | 'support_agent'
  | 'marketing_manager' | 'finance_manager'

export interface StaffMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: AdminRole
  permissions: string[]
  is2FAEnabled: boolean
  status: 'active' | 'inactive' | 'suspended'
  lastLoginAt: string
  createdAt: string
}

export interface AuditLog {
  id: string
  adminId: string
  adminName: string
  action: string
  target: string
  targetId: string
  ipAddress: string
  userAgent: string
  at: string
}

/* ─── Marketing ────────────────────────────────────── */
export interface Campaign {
  id: string
  name: string
  type: 'email' | 'push' | 'sms' | 'in_app'
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'cancelled'
  targetAudience: string
  sentCount: number
  openRate: number
  clickRate: number
  conversionRate: number
  scheduledAt?: string
  createdAt: string
}

export interface CouponCode {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxUses: number
  usedCount: number
  validFrom: string
  validTo: string
  applicablePlans: string[]
  isActive: boolean
  createdAt: string
}

/* ─── Mobile App ───────────────────────────────────── */
export interface AppVersion {
  id: string
  version: string
  platform: 'ios' | 'android'
  releaseNotes: string
  isForceUpdate: boolean
  isActive: boolean
  downloadCount: number
  crashRate: number
  releasedAt: string
}

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string
  isEnabled: boolean
  rolloutPct: number
  targetAudience: string
  updatedAt: string
}

/* ─── API Management ───────────────────────────────── */
export interface ApiKey {
  id: string
  name: string
  key: string
  userId?: string
  userName?: string
  permissions: string[]
  rateLimit: number
  usageCount: number
  lastUsedAt?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  successCount: number
  failureCount: number
  lastTriggeredAt?: string
  createdAt: string
}

/* ─── App (User-facing DB types) ───────────────────────── */
export interface AppUser {
  id: number
  name: string
  phone: string | null
  email: string | null
  photo: string | null
  photo_path?: string | null
  bio: string | null
  about: string | null
  languages: string
  lat: number | null
  lng: number | null
  city?: string | null
  state?: string | null
  is_online: boolean
  last_seen: string | null
  wallet_balance: number
  call_rate: number
  dnd: boolean
  gender: 'male' | 'female' | 'other' | null
  age: number | null
  is_premium: boolean
  premium_expiry: string | null
  dob: string | null
  plan_type: 'trial' | 'monthly' | 'vip' | null
  plan_expires_at: string | null
}

// Chat list item — the backend `/chats` returns a FLAT row per conversation.
// The thread view reuses this shape with a nested `other_user`.
export interface Chat {
  id: number
  user_id?: number        // the OTHER participant's id (list rows)
  name?: string
  photo?: string | null
  gender?: 'male' | 'female' | 'other' | null
  is_online?: boolean
  last_seen?: string | null
  last_message?: string    // preview text (list rows)
  last_time?: string       // humanised time (list rows)
  unread?: number
  is_typing?: boolean
  other_user?: AppUser     // present in the thread view
}

export interface ChatMessage {
  id: number
  chat_id: number
  sender_id: number
  message: string | null
  type: 'text' | 'image' | 'audio' | 'video' | 'file' | 'voice_note'
  file_url: string | null
  duration?: number
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
  sender?: AppUser
}

export interface Call {
  id: number
  caller_id: number
  receiver_id: number
  type: 'audio' | 'video'
  status: 'initiated' | 'answered' | 'completed' | 'missed' | 'declined'
  duration: number
  cost: number
  channel_name: string
  offer_sdp: string | null
  answer_sdp: string | null
  ice_candidates: string | null
  created_at: string
  caller?: AppUser
  receiver?: AppUser
}

export interface AppNotification {
  id: number
  user_id: number
  from_id: number
  type: string
  message: string | null
  is_read: boolean | number
  msg_count?: number | null
  from?: AppUser          // backend eager-loads the sender as `from`
  from_user?: AppUser     // legacy alias
  created_at: string
}

export interface Order {
  id: number
  user_id: number
  order_id: string
  plan: string
  amount: number
  status: 'pending' | 'paid' | 'failed'
  payment_id: string | null
  created_at: string
}

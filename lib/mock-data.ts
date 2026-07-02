import type {
  User, Plan, Subscription, Transaction, Event, SupportTicket,
  DashboardStats, StaffMember, AuditLog, Campaign, CouponCode,
  AppVersion, FeatureFlag, ApiKey, Webhook, SEOPage, Redirect,
} from './types'

/* ─── Dashboard Stats ─────────────────────────────── */
export const dashboardStats: DashboardStats = {
  totalUsers: 4_821_340,
  activeUsers: 1_234_567,
  newUsersToday: 2_841,
  newUsersThisMonth: 84_320,
  totalRevenue: 2_847_320,
  revenueThisMonth: 284_730,
  revenueGrowth: 18.4,
  totalEvents: 12_430,
  activeEvents: 342,
  totalTransactions: 389_210,
  pendingTickets: 23,
  userGrowthData: [
    { label: 'Jan', value: 3_200_000 }, { label: 'Feb', value: 3_450_000 },
    { label: 'Mar', value: 3_700_000 }, { label: 'Apr', value: 3_980_000 },
    { label: 'May', value: 4_150_000 }, { label: 'Jun', value: 4_380_000 },
    { label: 'Jul', value: 4_520_000 }, { label: 'Aug', value: 4_680_000 },
    { label: 'Sep', value: 4_720_000 }, { label: 'Oct', value: 4_780_000 },
    { label: 'Nov', value: 4_800_000 }, { label: 'Dec', value: 4_821_340 },
  ],
  revenueData: [
    { label: 'Jan', value: 195_000 }, { label: 'Feb', value: 210_000 },
    { label: 'Mar', value: 228_000 }, { label: 'Apr', value: 245_000 },
    { label: 'May', value: 260_000 }, { label: 'Jun', value: 278_000 },
    { label: 'Jul', value: 265_000 }, { label: 'Aug', value: 272_000 },
    { label: 'Sep', value: 258_000 }, { label: 'Oct', value: 270_000 },
    { label: 'Nov', value: 281_000 }, { label: 'Dec', value: 284_730 },
  ],
  topCountries: [
    { country: 'India', count: 1_240_000, flag: '🇮🇳', pct: 25.7 },
    { country: 'USA', count: 980_000, flag: '🇺🇸', pct: 20.3 },
    { country: 'Brazil', count: 560_000, flag: '🇧🇷', pct: 11.6 },
    { country: 'UK', count: 420_000, flag: '🇬🇧', pct: 8.7 },
    { country: 'Germany', count: 380_000, flag: '🇩🇪', pct: 7.9 },
  ],
  eventCategories: [
    { label: 'Networking', value: 3_420 }, { label: 'Parties', value: 2_810 },
    { label: 'Sports', value: 2_100 }, { label: 'Arts', value: 1_890 },
    { label: 'Tech', value: 1_540 }, { label: 'Others', value: 670 },
  ],
  recentActivity: [
    { id: '1', type: 'new_user', message: 'Priya Sharma joined from Mumbai', user: 'Priya Sharma', at: '2 min ago' },
    { id: '2', type: 'new_payment', message: 'Premium subscription purchased', user: 'James W.', amount: 29, at: '5 min ago' },
    { id: '3', type: 'new_event', message: 'New meetup created in New York', user: 'Alex T.', at: '12 min ago' },
    { id: '4', type: 'subscription', message: 'VIP plan upgrade completed', user: 'Sofia R.', amount: 99, at: '18 min ago' },
    { id: '5', type: 'new_ticket', message: 'Support ticket #TK-2891 opened', user: 'Ahmed K.', at: '25 min ago' },
    { id: '6', type: 'new_user', message: 'Lucas M. joined from São Paulo', user: 'Lucas M.', at: '31 min ago' },
    { id: '7', type: 'new_payment', message: 'Coins pack purchased (500 coins)', user: 'Mei L.', amount: 15, at: '40 min ago' },
  ],
}

/* ─── Users ───────────────────────────────────────── */
export const mockUsers: User[] = [
  {
    id: 'u1', name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '+91 98765 43210',
    gender: 'female', dob: '1997-03-15', bio: 'Travel lover & foodie. Looking for genuine connections.',
    profession: 'Software Engineer', company: 'TechCorp', membershipStatus: 'premium',
    subscriptionPlan: 'Premium Monthly', subscriptionExpiry: '2026-07-25',
    location: { city: 'Mumbai', country: 'India' }, interests: ['Travel', 'Music', 'Photography'],
    socialLinks: [], verificationStatus: 'verified', kycStatus: 'verified',
    status: 'active', createdAt: '2025-01-12', lastLoginAt: '2026-06-25',
    notes: [], tags: ['verified', 'premium'], eventAttendanceCount: 12,
    coinsBalance: 450, followersCount: 234, followingCount: 187, loginHistory: [],
  },
  {
    id: 'u2', name: 'James Wilson', email: 'james.w@email.com', phone: '+1 555 234 5678',
    gender: 'male', dob: '1993-07-22', bio: 'Entrepreneur, coffee addict, weekend hiker.',
    profession: 'Founder', company: 'StartupXYZ', membershipStatus: 'vip',
    subscriptionPlan: 'VIP Yearly', subscriptionExpiry: '2027-01-10',
    location: { city: 'New York', country: 'USA' }, interests: ['Hiking', 'Tech', 'Coffee'],
    socialLinks: [], verificationStatus: 'verified', kycStatus: 'verified',
    status: 'active', createdAt: '2024-08-05', lastLoginAt: '2026-06-24',
    notes: [], tags: ['vip', 'verified', 'top_user'], eventAttendanceCount: 28,
    coinsBalance: 2100, followersCount: 1240, followingCount: 320, loginHistory: [],
  },
  {
    id: 'u3', name: 'Sofia Rodriguez', email: 'sofia.r@email.com', phone: '+34 612 345 678',
    gender: 'female', dob: '1999-11-08', bio: 'Artist & dreamer. Passionate about connections.',
    profession: 'Graphic Designer', company: 'Freelance', membershipStatus: 'premium',
    subscriptionPlan: 'Premium Monthly', subscriptionExpiry: '2026-07-01',
    location: { city: 'Barcelona', country: 'Spain' }, interests: ['Art', 'Music', 'Travel'],
    socialLinks: [], verificationStatus: 'pending', kycStatus: 'unverified',
    status: 'active', createdAt: '2025-09-20', lastLoginAt: '2026-06-22',
    notes: [], tags: ['premium'], eventAttendanceCount: 6,
    coinsBalance: 120, followersCount: 89, followingCount: 112, loginHistory: [],
  },
  {
    id: 'u4', name: 'Ahmed Khan', email: 'ahmed.k@email.com', phone: '+971 50 345 6789',
    gender: 'male', dob: '1990-04-30', bio: 'Business consultant & sports enthusiast.',
    profession: 'Consultant', company: 'Khan Associates', membershipStatus: 'user',
    location: { city: 'Dubai', country: 'UAE' }, interests: ['Sports', 'Business', 'Cars'],
    socialLinks: [], verificationStatus: 'unverified', kycStatus: 'unverified',
    status: 'suspended', createdAt: '2025-11-14', lastLoginAt: '2026-05-10',
    notes: ['Reported for spam'], tags: ['suspended', 'reported'], eventAttendanceCount: 2,
    coinsBalance: 0, followersCount: 45, followingCount: 78, loginHistory: [],
  },
  {
    id: 'u5', name: 'Mei Lin', email: 'mei.lin@email.com', phone: '+86 138 0013 8000',
    gender: 'female', dob: '2000-01-19', bio: 'Student & yoga practitioner. Here to make friends.',
    profession: 'Student', company: 'Peking University', membershipStatus: 'user',
    location: { city: 'Beijing', country: 'China' }, interests: ['Yoga', 'Cooking', 'Reading'],
    socialLinks: [], verificationStatus: 'verified', kycStatus: 'pending',
    status: 'active', createdAt: '2026-02-28', lastLoginAt: '2026-06-25',
    notes: [], tags: ['new_user'], eventAttendanceCount: 1,
    coinsBalance: 50, followersCount: 18, followingCount: 31, loginHistory: [],
  },
]

/* ─── Plans ───────────────────────────────────────── */
export const mockPlans: Plan[] = [
  {
    id: 'p0', name: 'Free', type: 'free', price: { monthly: 0, yearly: 0 },
    currency: 'USD', features: ['Basic profile', 'Limited swipes (20/day)', 'Text chat only', '5 km radius'],
    coinsIncluded: 0, callMinutes: 0, isPopular: false, isActive: true,
    trialDays: 0, subscriberCount: 3_420_000, createdAt: '2024-01-01',
  },
  {
    id: 'p1', name: 'Premium', type: 'premium', price: { monthly: 29, yearly: 249 },
    currency: 'USD', features: ['Unlimited swipes', 'See who liked you', 'Advanced filters', 'Voice calls', '100 coins/mo', 'No ads'],
    coinsIncluded: 100, callMinutes: 120, isPopular: true, isActive: true,
    trialDays: 7, subscriberCount: 1_180_000, createdAt: '2024-01-01',
  },
  {
    id: 'p2', name: 'VIP', type: 'vip', price: { monthly: 69, yearly: 599 },
    currency: 'USD', features: ['All Premium', 'Profile boost daily', 'Priority support', 'Video calls unlimited', '500 coins/mo', 'Verified badge', 'Exclusive events'],
    coinsIncluded: 500, callMinutes: 9999, isPopular: false, isActive: true,
    trialDays: 3, subscriberCount: 185_000, createdAt: '2024-01-01',
  },
  {
    id: 'p3', name: 'Corporate', type: 'corporate', price: { monthly: 199, yearly: 1799 },
    currency: 'USD', features: ['All VIP', 'Team accounts (10)', 'API access', 'Dedicated account manager', '2000 coins/mo', 'Custom branding'],
    coinsIncluded: 2000, callMinutes: 9999, isPopular: false, isActive: true,
    trialDays: 14, subscriberCount: 3_200, createdAt: '2024-06-01',
  },
]

/* ─── Subscriptions ───────────────────────────────── */
export const mockSubscriptions: Subscription[] = [
  { id: 's1', userId: 'u1', userName: 'Priya Sharma', userEmail: 'priya.sharma@email.com', planId: 'p1', planName: 'Premium', planType: 'premium', billingCycle: 'monthly', amount: 29, currency: 'USD', startDate: '2026-06-25', endDate: '2026-07-25', autoRenew: true, status: 'active', discountAmount: 0, nextBillingDate: '2026-07-25', createdAt: '2026-06-25' },
  { id: 's2', userId: 'u2', userName: 'James Wilson', userEmail: 'james.w@email.com', planId: 'p2', planName: 'VIP', planType: 'vip', billingCycle: 'yearly', amount: 599, currency: 'USD', startDate: '2026-01-10', endDate: '2027-01-10', autoRenew: true, status: 'active', discountAmount: 0, nextBillingDate: '2027-01-10', createdAt: '2026-01-10' },
  { id: 's3', userId: 'u3', userName: 'Sofia Rodriguez', userEmail: 'sofia.r@email.com', planId: 'p1', planName: 'Premium', planType: 'premium', billingCycle: 'monthly', amount: 24.65, currency: 'USD', startDate: '2026-06-01', endDate: '2026-07-01', autoRenew: false, status: 'active', couponCode: 'FIRST15', discountAmount: 4.35, nextBillingDate: '2026-07-01', createdAt: '2026-06-01' },
  { id: 's4', userId: 'u5', userName: 'Mei Lin', userEmail: 'mei.lin@email.com', planId: 'p1', planName: 'Premium', planType: 'premium', billingCycle: 'monthly', amount: 29, currency: 'USD', startDate: '2026-06-28', endDate: '2026-07-28', autoRenew: true, status: 'trial', discountAmount: 0, nextBillingDate: '2026-07-05', createdAt: '2026-06-28' },
]

/* ─── Transactions ────────────────────────────────── */
export const mockTransactions: Transaction[] = [
  { id: 't1', transactionId: 'TXN-8821-ABCD', userId: 'u2', userName: 'James Wilson', userEmail: 'james.w@email.com', amount: 599, tax: 71.88, currency: 'USD', paymentMethod: 'stripe', gateway: 'Stripe', status: 'success', type: 'subscription', description: 'VIP Yearly Plan', createdAt: '2026-01-10' },
  { id: 't2', transactionId: 'TXN-8822-EFGH', userId: 'u1', userName: 'Priya Sharma', userEmail: 'priya.sharma@email.com', amount: 29, tax: 5.22, currency: 'USD', paymentMethod: 'razorpay', gateway: 'Razorpay', status: 'success', type: 'subscription', description: 'Premium Monthly Plan', createdAt: '2026-06-25' },
  { id: 't3', transactionId: 'TXN-8823-IJKL', userId: 'u3', userName: 'Sofia Rodriguez', userEmail: 'sofia.r@email.com', amount: 24.65, tax: 4.44, currency: 'USD', paymentMethod: 'paypal', gateway: 'PayPal', status: 'success', type: 'subscription', description: 'Premium Monthly (15% off)', createdAt: '2026-06-01' },
  { id: 't4', transactionId: 'TXN-8824-MNOP', userId: 'u4', userName: 'Ahmed Khan', userEmail: 'ahmed.k@email.com', amount: 15, tax: 2.7, currency: 'USD', paymentMethod: 'google_pay', gateway: 'Stripe', status: 'failed', type: 'coins', description: '500 Coins Pack', createdAt: '2026-05-08' },
  { id: 't5', transactionId: 'TXN-8825-QRST', userId: 'u5', userName: 'Mei Lin', userEmail: 'mei.lin@email.com', amount: 5, tax: 0.9, currency: 'USD', paymentMethod: 'apple_pay', gateway: 'Stripe', status: 'success', type: 'coins', description: '100 Coins Pack', createdAt: '2026-06-20' },
  { id: 't6', transactionId: 'TXN-8826-UVWX', userId: 'u1', userName: 'Priya Sharma', userEmail: 'priya.sharma@email.com', amount: -29, tax: 0, currency: 'USD', paymentMethod: 'stripe', gateway: 'Stripe', status: 'refunded', type: 'refund', description: 'Refund for TXN-8800', refundAmount: 29, refundReason: 'User request', createdAt: '2026-04-15' },
]

/* ─── Events ──────────────────────────────────────── */
export const mockEvents: Event[] = [
  { id: 'e1', name: 'Summer Networking Gala 2026', description: 'An exclusive evening networking event for professionals.', category: 'Networking', organizerId: 'u2', organizerName: 'James Wilson', date: '2026-07-15', time: '18:00', duration: 180, venue: { name: 'The Grand Ballroom', address: '123 Park Ave', city: 'New York', country: 'USA' }, capacity: 500, registrationCount: 423, checkInCount: 0, pricing: { type: 'paid', amount: 49, currency: 'USD' }, status: 'published', tags: ['networking', 'professional', 'exclusive'], rating: 4.8, reviewCount: 0, revenue: 20727, ticketsSold: 423, createdAt: '2026-06-01' },
  { id: 'e2', name: 'Mumbai Singles Meetup', description: 'A fun casual meetup for singles in Mumbai to connect.', category: 'Social', organizerId: 'u1', organizerName: 'Priya Sharma', date: '2026-07-08', time: '17:00', duration: 120, venue: { name: 'Cafe Noir', address: '45 Linking Road', city: 'Mumbai', country: 'India' }, capacity: 60, registrationCount: 58, checkInCount: 0, pricing: { type: 'free', amount: 0, currency: 'INR' }, status: 'published', tags: ['singles', 'casual', 'mumbai'], rating: 4.6, reviewCount: 0, revenue: 0, ticketsSold: 58, createdAt: '2026-06-15' },
  { id: 'e3', name: 'Tech & Connect Barcelona', description: 'Tech professionals meeting and connecting over drinks.', category: 'Tech', organizerId: 'u3', organizerName: 'Sofia Rodriguez', date: '2026-06-30', time: '19:00', duration: 150, venue: { name: 'Hub Coworking', address: 'Carrer de Pallars 180', city: 'Barcelona', country: 'Spain' }, capacity: 100, registrationCount: 100, checkInCount: 0, pricing: { type: 'paid', amount: 15, currency: 'EUR' }, status: 'pending_approval', tags: ['tech', 'networking', 'barcelona'], rating: 0, reviewCount: 0, revenue: 1500, ticketsSold: 100, createdAt: '2026-06-20' },
  { id: 'e4', name: 'Yoga & Wellness Morning', description: 'A peaceful morning yoga session followed by healthy breakfast.', category: 'Wellness', organizerId: 'u5', organizerName: 'Mei Lin', date: '2026-07-20', time: '07:00', duration: 90, venue: { name: 'Olympic Park', address: 'Olympic Sports Center', city: 'Beijing', country: 'China' }, capacity: 40, registrationCount: 22, checkInCount: 0, pricing: { type: 'free', amount: 0, currency: 'CNY' }, status: 'draft', tags: ['yoga', 'wellness', 'morning'], rating: 0, reviewCount: 0, revenue: 0, ticketsSold: 22, createdAt: '2026-06-24' },
]

/* ─── Support Tickets ─────────────────────────────── */
export const mockTickets: SupportTicket[] = [
  { id: 'tk1', ticketNumber: 'TK-2891', userId: 'u4', userName: 'Ahmed Khan', userEmail: 'ahmed.k@email.com', subject: 'Payment failed but coins not received', description: 'I tried to buy the 500 coins pack and the payment was deducted but coins were never added.', category: 'Billing', status: 'open', priority: 'high', messages: [{ from: 'Ahmed Khan', message: 'Payment was deducted from my card but coins not received.', at: '2026-06-25 09:12', isAdmin: false }], createdAt: '2026-06-25', updatedAt: '2026-06-25' },
  { id: 'tk2', ticketNumber: 'TK-2890', userId: 'u3', userName: 'Sofia Rodriguez', userEmail: 'sofia.r@email.com', subject: 'Profile verification taking too long', description: 'I submitted my verification documents 5 days ago and still no response.', category: 'Verification', status: 'in_progress', priority: 'medium', assignedTo: 'Support Agent 2', messages: [], createdAt: '2026-06-21', updatedAt: '2026-06-23' },
  { id: 'tk3', ticketNumber: 'TK-2885', userId: 'u1', userName: 'Priya Sharma', userEmail: 'priya.sharma@email.com', subject: 'Cannot cancel subscription', description: 'The cancel button in my profile is not working.', category: 'Account', status: 'resolved', priority: 'low', assignedTo: 'Support Agent 1', messages: [], createdAt: '2026-06-18', updatedAt: '2026-06-19', resolvedAt: '2026-06-19' },
]

/* ─── Staff ───────────────────────────────────────── */
export const mockStaff: StaffMember[] = [
  { id: 'a1', name: 'Rahul Mehta', email: 'rahul@zingdates.app', role: 'super_admin', permissions: ['*'], is2FAEnabled: true, status: 'active', lastLoginAt: '2026-06-25 08:30', createdAt: '2024-01-01' },
  { id: 'a2', name: 'Sarah Johnson', email: 'sarah@zingdates.app', role: 'admin', permissions: ['users', 'events', 'payments', 'subscriptions'], is2FAEnabled: true, status: 'active', lastLoginAt: '2026-06-25 10:15', createdAt: '2024-03-15' },
  { id: 'a3', name: 'Tom Bradley', email: 'tom@zingdates.app', role: 'event_manager', permissions: ['events'], is2FAEnabled: false, status: 'active', lastLoginAt: '2026-06-24 16:45', createdAt: '2024-06-01' },
  { id: 'a4', name: 'Aisha Patel', email: 'aisha@zingdates.app', role: 'support_agent', permissions: ['tickets', 'users_read'], is2FAEnabled: true, status: 'active', lastLoginAt: '2026-06-25 09:00', createdAt: '2024-09-10' },
  { id: 'a5', name: 'Leo Santos', email: 'leo@zingdates.app', role: 'marketing_manager', permissions: ['campaigns', 'coupons', 'seo'], is2FAEnabled: false, status: 'inactive', lastLoginAt: '2026-06-10 11:20', createdAt: '2025-01-05' },
  { id: 'a6', name: 'Fatima Al-Rashid', email: 'fatima@zingdates.app', role: 'finance_manager', permissions: ['payments', 'invoices', 'reports'], is2FAEnabled: true, status: 'active', lastLoginAt: '2026-06-25 07:50', createdAt: '2025-02-20' },
]

/* ─── Audit Logs ──────────────────────────────────── */
export const mockAuditLogs: AuditLog[] = [
  { id: 'l1', adminId: 'a1', adminName: 'Rahul Mehta', action: 'SUSPEND_USER', target: 'User', targetId: 'u4', ipAddress: '192.168.1.10', userAgent: 'Chrome/125', at: '2026-06-25 10:30' },
  { id: 'l2', adminId: 'a2', adminName: 'Sarah Johnson', action: 'APPROVE_EVENT', target: 'Event', targetId: 'e2', ipAddress: '192.168.1.15', userAgent: 'Firefox/124', at: '2026-06-25 09:45' },
  { id: 'l3', adminId: 'a6', adminName: 'Fatima Al-Rashid', action: 'PROCESS_REFUND', target: 'Transaction', targetId: 't6', ipAddress: '192.168.1.22', userAgent: 'Chrome/125', at: '2026-06-24 14:20' },
  { id: 'l4', adminId: 'a1', adminName: 'Rahul Mehta', action: 'CREATE_COUPON', target: 'Coupon', targetId: 'c1', ipAddress: '192.168.1.10', userAgent: 'Chrome/125', at: '2026-06-23 11:00' },
]

/* ─── Campaigns ───────────────────────────────────── */
export const mockCampaigns: Campaign[] = [
  { id: 'cm1', name: 'Summer Love Push Campaign', type: 'push', status: 'running', targetAudience: 'Free Users', sentCount: 1_240_000, openRate: 34.2, clickRate: 12.8, conversionRate: 3.4, createdAt: '2026-06-20' },
  { id: 'cm2', name: 'Premium Upgrade Email Blast', type: 'email', status: 'completed', targetAudience: 'Free Users (30+ days)', sentCount: 890_000, openRate: 28.5, clickRate: 8.3, conversionRate: 2.1, createdAt: '2026-06-10' },
  { id: 'cm3', name: 'VIP Re-engagement SMS', type: 'sms', status: 'scheduled', targetAudience: 'Expired VIP Users', sentCount: 0, openRate: 0, clickRate: 0, conversionRate: 0, scheduledAt: '2026-07-01', createdAt: '2026-06-24' },
  { id: 'cm4', name: 'Welcome In-App Message', type: 'in_app', status: 'running', targetAudience: 'New Users (< 7 days)', sentCount: 84_320, openRate: 72.1, clickRate: 45.3, conversionRate: 18.7, createdAt: '2026-06-01' },
]

/* ─── Coupons ─────────────────────────────────────── */
export const mockCoupons: CouponCode[] = [
  { id: 'c1', code: 'SUMMER25', discountType: 'percentage', discountValue: 25, maxUses: 10000, usedCount: 4230, validFrom: '2026-06-01', validTo: '2026-08-31', applicablePlans: ['premium', 'vip'], isActive: true, createdAt: '2026-06-01' },
  { id: 'c2', code: 'FIRST15', discountType: 'percentage', discountValue: 15, maxUses: 0, usedCount: 18940, validFrom: '2025-01-01', validTo: '2026-12-31', applicablePlans: ['premium'], isActive: true, createdAt: '2025-01-01' },
  { id: 'c3', code: 'VIP50OFF', discountType: 'fixed', discountValue: 50, maxUses: 500, usedCount: 500, validFrom: '2026-05-01', validTo: '2026-05-31', applicablePlans: ['vip'], isActive: false, createdAt: '2026-05-01' },
]

/* ─── SEO Pages ───────────────────────────────────── */
export const mockSEOPages: SEOPage[] = [
  { id: 'seo1', page: 'Home', metaTitle: 'Peppy — Find Your Perfect Match | Social Networking App', metaDescription: 'Join Peppy, the best social networking app to meet your future partner. Connect with millions of people worldwide.', keywords: ['dating app', 'social network', 'meetup', 'find partner'], ogTitle: 'Peppy — Find Your Perfect Match', ogDescription: 'Connect with millions of people worldwide.', canonicalUrl: 'https://peppy.app/', robotsIndex: true, robotsFollow: true, seoScore: 92, updatedAt: '2026-06-20' },
  { id: 'seo2', page: 'Events', metaTitle: 'Local Meetup Events Near You | Peppy', metaDescription: 'Discover local events and meetups on Peppy. Join networking events, social gatherings, and more.', keywords: ['meetup events', 'local events', 'networking events', 'social events'], ogTitle: 'Find Local Meetup Events | Peppy', ogDescription: 'Discover events and meetups happening near you.', canonicalUrl: 'https://peppy.app/events', robotsIndex: true, robotsFollow: true, seoScore: 85, updatedAt: '2026-06-18' },
  { id: 'seo3', page: 'Pricing', metaTitle: 'Peppy Pricing — Free, Premium & VIP Plans', metaDescription: 'Choose the perfect Peppy plan. Start free or unlock premium features with our affordable monthly plans.', keywords: ['peppy pricing', 'dating app plans', 'premium membership'], ogTitle: 'Peppy Plans & Pricing', ogDescription: 'Start free or unlock all features with Premium.', canonicalUrl: 'https://peppy.app/pricing', robotsIndex: true, robotsFollow: true, seoScore: 78, updatedAt: '2026-06-15' },
]

/* ─── Redirects ───────────────────────────────────── */
export const mockRedirects: Redirect[] = [
  { id: 'r1', from: '/signup', to: '/register', type: 301, isActive: true, hits: 12430, createdAt: '2025-03-01' },
  { id: 'r2', from: '/plans', to: '/pricing', type: 301, isActive: true, hits: 4820, createdAt: '2025-05-10' },
  { id: 'r3', from: '/old-about', to: '/about', type: 302, isActive: false, hits: 230, createdAt: '2025-01-15' },
]

/* ─── App Versions ────────────────────────────────── */
export const mockAppVersions: AppVersion[] = [
  { id: 'av1', version: '3.4.2', platform: 'ios', releaseNotes: 'Video call stability improvements, UI bug fixes', isForceUpdate: false, isActive: true, downloadCount: 2_840_000, crashRate: 0.12, releasedAt: '2026-06-15' },
  { id: 'av2', version: '3.4.2', platform: 'android', releaseNotes: 'Video call stability improvements, UI bug fixes', isForceUpdate: false, isActive: true, downloadCount: 1_980_000, crashRate: 0.18, releasedAt: '2026-06-15' },
  { id: 'av3', version: '3.4.1', platform: 'ios', releaseNotes: 'Performance improvements, new coin animations', isForceUpdate: false, isActive: false, downloadCount: 2_720_000, crashRate: 0.25, releasedAt: '2026-05-28' },
]

/* ─── Feature Flags ───────────────────────────────── */
export const mockFeatureFlags: FeatureFlag[] = [
  { id: 'ff1', key: 'ai_matching_v2', name: 'AI Matching V2', description: 'New ML-powered matching algorithm', isEnabled: true, rolloutPct: 50, targetAudience: 'Premium Users', updatedAt: '2026-06-20' },
  { id: 'ff2', key: 'video_stories', name: 'Video Stories', description: 'Instagram-style video stories on profiles', isEnabled: false, rolloutPct: 0, targetAudience: 'All Users', updatedAt: '2026-06-10' },
  { id: 'ff3', key: 'group_events', name: 'Group Events Feature', description: 'Create private group events with invite links', isEnabled: true, rolloutPct: 100, targetAudience: 'All Users', updatedAt: '2026-05-15' },
  { id: 'ff4', key: 'ai_chat_suggestions', name: 'AI Chat Reply Suggestions', description: 'AI-powered reply suggestions in chat', isEnabled: true, rolloutPct: 25, targetAudience: 'VIP Users', updatedAt: '2026-06-22' },
]

/* ─── API Keys ────────────────────────────────────── */
export const mockApiKeys: ApiKey[] = [
  { id: 'ak1', name: 'Mobile App iOS', key: 'pk_live_xK9...mN3', userId: undefined, permissions: ['read:users', 'write:events', 'read:events'], rateLimit: 10000, usageCount: 4_820_000, lastUsedAt: '2026-06-25', isActive: true, createdAt: '2024-01-01' },
  { id: 'ak2', name: 'Mobile App Android', key: 'pk_live_aB7...pQ8', userId: undefined, permissions: ['read:users', 'write:events', 'read:events'], rateLimit: 10000, usageCount: 3_240_000, lastUsedAt: '2026-06-25', isActive: true, createdAt: '2024-01-01' },
  { id: 'ak3', name: 'Partner Integration - ABC Corp', key: 'pk_live_cD5...rS2', userId: 'ext-001', userName: 'ABC Corp', permissions: ['read:events'], rateLimit: 1000, usageCount: 45_820, lastUsedAt: '2026-06-24', isActive: true, createdAt: '2026-03-15' },
  { id: 'ak4', name: 'Analytics Dashboard (Test)', key: 'pk_test_eF3...tU9', userId: 'a1', userName: 'Rahul Mehta', permissions: ['read:*'], rateLimit: 500, usageCount: 12_340, lastUsedAt: '2026-06-23', expiresAt: '2026-12-31', isActive: true, createdAt: '2026-05-01' },
]

/* ─── Webhooks ────────────────────────────────────── */
export const mockWebhooks: Webhook[] = [
  { id: 'wh1', url: 'https://hooks.zapier.com/hooks/catch/xxx/yyy/', events: ['payment.success', 'user.registered'], secret: 'whsec_abc...', isActive: true, successCount: 12430, failureCount: 23, lastTriggeredAt: '2026-06-25 10:28', createdAt: '2025-06-01' },
  { id: 'wh2', url: 'https://analytics.example.com/webhook', events: ['user.registered', 'subscription.created', 'event.published'], secret: 'whsec_def...', isActive: true, successCount: 38920, failureCount: 45, lastTriggeredAt: '2026-06-25 09:52', createdAt: '2025-08-15' },
]

/* ─── Helpers ─────────────────────────────────────── */
export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

export function fmtCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

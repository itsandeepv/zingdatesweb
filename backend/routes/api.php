<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Api\{
    ProfileController, EventController, PlanController,
    BlogController, PaymentController as UserPaymentController,
    SubscriptionController as UserSubscriptionController,
    ConnectionController, MessageController, NotificationController,
    SupportTicketController as UserSupportController,
    CallController
};
use App\Http\Controllers\Admin\{
    DashboardController, UserController, SubscriptionController,
    PlanController as AdminPlanController, PaymentController,
    EventController as AdminEventController, SupportController,
    StaffController, SEOController, MarketingController,
    AnalyticsController, ContentController, MobileController,
    ApiManagementController, SettingsController, AuditLogController,
    SocialController as AdminSocialController
};

/*
|--------------------------------------------------------------------------
| Public Routes (no authentication required)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/send-otp',          [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp',        [AuthController::class, 'verifyOtp']);
    Route::post('/login',             [AuthController::class, 'login']);             // sends email OTP
    Route::post('/verify-email-otp',  [AuthController::class, 'verifyEmailOtp']);   // verifies email OTP
    Route::post('/register',          [AuthController::class, 'register']);
    Route::post('/social-login',      [AuthController::class, 'socialLogin']);
    Route::post('/admin/login',       [AuthController::class, 'adminLogin']);
});

// Public content (consumed by Next.js SSR pages)
Route::get('/plans',           [PlanController::class, 'index']);
Route::get('/events',          [EventController::class, 'index']);
Route::get('/events/{slug}',   [EventController::class, 'show']);
Route::get('/users/{username}',[ProfileController::class, 'show']);
Route::get('/blog',            [BlogController::class, 'index']);
Route::get('/blog/{slug}',     [BlogController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Authenticated User Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    /* ── Auth ── */
    Route::post('/auth/logout',        [AuthController::class, 'logout']);
    Route::post('/auth/refresh',       [AuthController::class, 'refresh']);
    Route::post('/auth/enable-2fa',    [AuthController::class, 'enable2FA']);
    Route::post('/auth/verify-2fa',    [AuthController::class, 'verify2FA']);

    /* ── Profile ── */
    Route::get('/me',                  [ProfileController::class, 'me']);
    Route::put('/me',                  [ProfileController::class, 'update']);
    Route::post('/me/photo',           [ProfileController::class, 'uploadPhoto']);
    Route::delete('/me/photo/{index}', [ProfileController::class, 'deletePhoto']);
    Route::put('/me/location',         [ProfileController::class, 'updateLocation']);
    Route::get('/me/coins',            [ProfileController::class, 'coinBalance']);

    /* ── Discovery (Matching) ── */
    Route::get('/discover',            [ProfileController::class, 'discover']);
    Route::post('/matches/{id}/like',  [ConnectionController::class, 'like']);
    Route::post('/matches/{id}/pass',  [ConnectionController::class, 'pass']);

    /* ── Connections ── */
    Route::get('/connections',                   [ConnectionController::class, 'index']);
    Route::post('/connections/{userId}',         [ConnectionController::class, 'send']);
    Route::post('/connections/{userId}/accept',  [ConnectionController::class, 'accept']);
    Route::post('/connections/{userId}/reject',  [ConnectionController::class, 'reject']);
    Route::delete('/connections/{userId}',       [ConnectionController::class, 'remove']);
    Route::get('/followers',                     [ConnectionController::class, 'followers']);
    Route::get('/following',                     [ConnectionController::class, 'following']);

    /* ── Messages ── */
    Route::get('/conversations',              [MessageController::class, 'conversations']);
    Route::get('/messages/{userId}',          [MessageController::class, 'conversation']);
    Route::post('/messages/{userId}',         [MessageController::class, 'send']);
    Route::delete('/messages/{id}',           [MessageController::class, 'delete']);

    /* ── Calls ── */
    Route::post('/calls/{userId}/initiate',   [CallController::class, 'initiate']);
    Route::post('/calls/{callId}/accept',     [CallController::class, 'accept']);
    Route::post('/calls/{callId}/decline',    [CallController::class, 'decline']);
    Route::post('/calls/{callId}/end',        [CallController::class, 'end']);

    /* ── Events ── */
    Route::post('/events',                         [EventController::class, 'store']);
    Route::put('/events/{id}',                     [EventController::class, 'update']);
    Route::delete('/events/{id}',                  [EventController::class, 'destroy']);
    Route::post('/events/{id}/register',           [\App\Http\Controllers\Api\EventRegistrationController::class, 'register']);
    Route::delete('/events/{id}/register',         [\App\Http\Controllers\Api\EventRegistrationController::class, 'cancel']);
    Route::post('/events/{id}/check-in',           [\App\Http\Controllers\Api\EventRegistrationController::class, 'checkIn']);
    Route::get('/events/{id}/registrations',       [\App\Http\Controllers\Api\EventRegistrationController::class, 'list']);

    /* ── Subscriptions ── */
    Route::get('/subscriptions/current',           [UserSubscriptionController::class, 'current']);
    Route::post('/subscriptions',                  [UserSubscriptionController::class, 'subscribe']);
    Route::post('/subscriptions/{id}/cancel',      [UserSubscriptionController::class, 'cancel']);
    Route::post('/subscriptions/{id}/upgrade',     [UserSubscriptionController::class, 'upgrade']);

    /* ── Payments ── */
    Route::post('/payments/create-intent',         [UserPaymentController::class, 'createIntent']);
    Route::post('/payments/coins/recharge',        [UserPaymentController::class, 'rechargeCoins']);
    Route::post('/payments/webhook/stripe',        [UserPaymentController::class, 'stripeWebhook']);
    Route::post('/payments/webhook/razorpay',      [UserPaymentController::class, 'razorpayWebhook']);
    Route::get('/payments/history',                [UserPaymentController::class, 'history']);

    /* ── Notifications ── */
    Route::get('/notifications',                   [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read',        [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all',         [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/device-token',     [NotificationController::class, 'registerToken']);

    /* ── Support ── */
    Route::get('/support/tickets',                 [UserSupportController::class, 'index']);
    Route::post('/support/tickets',                [UserSupportController::class, 'store']);
    Route::get('/support/tickets/{id}',            [UserSupportController::class, 'show']);
    Route::post('/support/tickets/{id}/reply',     [UserSupportController::class, 'reply']);

    /* ── Groups ── */
    Route::get('/groups',                          [\App\Http\Controllers\Api\GroupController::class, 'index']);
    Route::post('/groups',                         [\App\Http\Controllers\Api\GroupController::class, 'store']);
    Route::get('/groups/{id}',                     [\App\Http\Controllers\Api\GroupController::class, 'show']);
    Route::post('/groups/{id}/join',               [\App\Http\Controllers\Api\GroupController::class, 'join']);
    Route::delete('/groups/{id}/leave',            [\App\Http\Controllers\Api\GroupController::class, 'leave']);
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'admin'])
    ->prefix('admin')
    ->group(function () {

    /* ── Dashboard ── */
    Route::get('/dashboard/stats',             [DashboardController::class, 'stats']);
    Route::get('/dashboard/activity',          [DashboardController::class, 'activity']);

    /* ── Users ── */
    Route::get('/users',                       [UserController::class, 'index']);
    Route::post('/users',                      [UserController::class, 'store']);
    Route::get('/users/{id}',                  [UserController::class, 'show']);
    Route::patch('/users/{id}',                [UserController::class, 'update']);
    Route::post('/users/{id}/suspend',         [UserController::class, 'suspend']);
    Route::post('/users/{id}/unsuspend',       [UserController::class, 'unsuspend']);
    Route::post('/users/{id}/verify',          [UserController::class, 'verify']);
    Route::post('/users/{id}/kyc-approve',     [UserController::class, 'approveKyc']);
    Route::post('/users/{id}/kyc-reject',      [UserController::class, 'rejectKyc']);
    Route::delete('/users/{id}',               [UserController::class, 'destroy']);
    Route::post('/users/bulk-action',          [UserController::class, 'bulkAction']);
    Route::post('/users/{id}/notes',           [UserController::class, 'addNote']);
    Route::post('/users/{id}/tags',            [UserController::class, 'addTag']);

    /* ── Subscriptions ── */
    Route::get('/subscriptions',               [SubscriptionController::class, 'index']);
    Route::get('/subscriptions/{id}',          [SubscriptionController::class, 'show']);
    Route::post('/subscriptions/{id}/cancel',  [SubscriptionController::class, 'cancel']);

    /* ── Plans ── */
    Route::get('/plans',                       [AdminPlanController::class, 'index']);
    Route::post('/plans',                      [AdminPlanController::class, 'store']);
    Route::put('/plans/{id}',                  [AdminPlanController::class, 'update']);
    Route::delete('/plans/{id}',               [AdminPlanController::class, 'destroy']);

    /* ── Payments ── */
    Route::get('/payments',                    [PaymentController::class, 'index']);
    Route::get('/payments/stats',              [PaymentController::class, 'stats']);
    Route::get('/payments/export',             [PaymentController::class, 'export']);
    Route::get('/payments/{id}',               [PaymentController::class, 'show']);
    Route::post('/payments/{id}/refund',       [PaymentController::class, 'refund']);

    /* ── Coin Ledger ── */
    Route::get('/transactions',                [PaymentController::class, 'transactions']);

    /* ── Events ── */
    Route::get('/events',                      [AdminEventController::class, 'index']);
    Route::get('/events/{id}',                 [AdminEventController::class, 'show']);
    Route::post('/events/{id}/approve',        [AdminEventController::class, 'approve']);
    Route::post('/events/{id}/cancel',         [AdminEventController::class, 'cancel']);
    Route::delete('/events/{id}',              [AdminEventController::class, 'destroy']);

    /* ── Social ── */
    Route::get('/social/connections',          [AdminSocialController::class, 'connections']);
    Route::get('/social/groups',               [AdminSocialController::class, 'groups']);
    Route::get('/social/reports',              [AdminSocialController::class, 'reports']);
    Route::post('/social/reports/{id}/action',[AdminSocialController::class, 'handleReport']);

    /* ── Support ── */
    Route::get('/tickets',                     [SupportController::class, 'index']);
    Route::get('/tickets/{id}',                [SupportController::class, 'show']);
    Route::post('/tickets/{id}/reply',         [SupportController::class, 'reply']);
    Route::post('/tickets/{id}/resolve',       [SupportController::class, 'resolve']);
    Route::post('/tickets/{id}/escalate',      [SupportController::class, 'escalate']);
    Route::post('/tickets/{id}/assign',        [SupportController::class, 'assign']);

    /* ── Staff ── */
    Route::get('/staff',                       [StaffController::class, 'index']);
    Route::post('/staff',                      [StaffController::class, 'store']);
    Route::put('/staff/{id}',                  [StaffController::class, 'update']);
    Route::post('/staff/{id}/suspend',         [StaffController::class, 'suspend']);
    Route::delete('/staff/{id}',              [StaffController::class, 'destroy']);

    /* ── Audit Logs ── */
    Route::get('/audit-logs',                  [AuditLogController::class, 'index']);
    Route::get('/audit-logs/export',           [AuditLogController::class, 'export']);

    /* ── SEO ── */
    Route::get('/seo/pages',                   [SEOController::class, 'index']);
    Route::get('/seo/pages/{id}',              [SEOController::class, 'show']);
    Route::put('/seo/pages/{id}',              [SEOController::class, 'update']);
    Route::post('/seo/sitemap/generate',       [SEOController::class, 'generateSitemap']);
    Route::get('/seo/redirects',               [SEOController::class, 'redirects']);
    Route::post('/seo/redirects',              [SEOController::class, 'addRedirect']);
    Route::delete('/seo/redirects/{id}',       [SEOController::class, 'deleteRedirect']);

    /* ── Marketing ── */
    Route::get('/campaigns',                   [MarketingController::class, 'campaigns']);
    Route::post('/campaigns',                  [MarketingController::class, 'createCampaign']);
    Route::put('/campaigns/{id}',              [MarketingController::class, 'updateCampaign']);
    Route::post('/campaigns/{id}/send',        [MarketingController::class, 'sendCampaign']);
    Route::delete('/campaigns/{id}',           [MarketingController::class, 'deleteCampaign']);
    Route::get('/coupons',                     [MarketingController::class, 'coupons']);
    Route::post('/coupons',                    [MarketingController::class, 'createCoupon']);
    Route::put('/coupons/{id}',                [MarketingController::class, 'updateCoupon']);
    Route::delete('/coupons/{id}',             [MarketingController::class, 'deleteCoupon']);

    /* ── Analytics ── */
    Route::get('/analytics/overview',          [AnalyticsController::class, 'overview']);
    Route::get('/analytics/users',             [AnalyticsController::class, 'users']);
    Route::get('/analytics/revenue',           [AnalyticsController::class, 'revenue']);
    Route::get('/analytics/events',            [AnalyticsController::class, 'events']);
    Route::get('/analytics/marketing',         [AnalyticsController::class, 'marketing']);
    Route::post('/analytics/export',           [AnalyticsController::class, 'export']);

    /* ── Content/CMS ── */
    Route::get('/content/pages',               [ContentController::class, 'pages']);
    Route::put('/content/pages/{id}',          [ContentController::class, 'updatePage']);
    Route::get('/content/blog',                [ContentController::class, 'blog']);
    Route::post('/content/blog',               [ContentController::class, 'createPost']);
    Route::put('/content/blog/{id}',           [ContentController::class, 'updatePost']);
    Route::delete('/content/blog/{id}',        [ContentController::class, 'deletePost']);
    Route::get('/content/media',               [ContentController::class, 'media']);
    Route::post('/content/media',              [ContentController::class, 'uploadMedia']);
    Route::delete('/content/media/{id}',       [ContentController::class, 'deleteMedia']);

    /* ── Mobile App ── */
    Route::get('/mobile/versions',             [MobileController::class, 'versions']);
    Route::post('/mobile/versions',            [MobileController::class, 'createVersion']);
    Route::put('/mobile/versions/{id}',        [MobileController::class, 'updateVersion']);
    Route::get('/mobile/flags',                [MobileController::class, 'featureFlags']);
    Route::put('/mobile/flags/{id}',           [MobileController::class, 'updateFlag']);
    Route::get('/mobile/config',               [MobileController::class, 'config']);
    Route::put('/mobile/config',               [MobileController::class, 'updateConfig']);
    Route::get('/mobile/crashes',              [MobileController::class, 'crashes']);

    /* ── API Management ── */
    Route::get('/api-keys',                    [ApiManagementController::class, 'keys']);
    Route::post('/api-keys',                   [ApiManagementController::class, 'createKey']);
    Route::post('/api-keys/{id}/rotate',       [ApiManagementController::class, 'rotateKey']);
    Route::delete('/api-keys/{id}',            [ApiManagementController::class, 'revokeKey']);
    Route::get('/api-logs',                    [ApiManagementController::class, 'logs']);
    Route::get('/webhooks',                    [ApiManagementController::class, 'webhooks']);
    Route::post('/webhooks',                   [ApiManagementController::class, 'createWebhook']);
    Route::put('/webhooks/{id}',               [ApiManagementController::class, 'updateWebhook']);
    Route::post('/webhooks/{id}/test',         [ApiManagementController::class, 'testWebhook']);
    Route::delete('/webhooks/{id}',            [ApiManagementController::class, 'deleteWebhook']);

    /* ── Settings ── */
    Route::get('/settings',                    [SettingsController::class, 'index']);
    Route::put('/settings',                    [SettingsController::class, 'update']);
    Route::post('/settings/maintenance',       [SettingsController::class, 'toggleMaintenance']);
    Route::put('/settings/security',           [SettingsController::class, 'updateSecurity']);
});

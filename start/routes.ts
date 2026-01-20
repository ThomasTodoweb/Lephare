/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const RestaurantsController = () => import('#controllers/restaurants_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const OnboardingController = () => import('#controllers/onboarding_controller')
const ProfileController = () => import('#controllers/profile_controller')
const InstagramController = () => import('#controllers/instagram_controller')
const MissionsController = () => import('#controllers/missions_controller')
const PublicationsController = () => import('#controllers/publications_controller')
const TutorialsController = () => import('#controllers/tutorials_controller')
const BadgesController = () => import('#controllers/badges_controller')
const ReportsController = () => import('#controllers/reports_controller')
const NotificationsController = () => import('#controllers/notifications_controller')
const StatisticsController = () => import('#controllers/statistics_controller')
const SubscriptionsController = () => import('#controllers/subscriptions_controller')
const AdminController = () => import('#controllers/admin_controller')
const AdminStrategiesController = () => import('#controllers/admin/strategies_controller')
const AdminTemplatesController = () => import('#controllers/admin/templates_controller')
const AdminTutorialsController = () => import('#controllers/admin/tutorials_controller')
const AdminAlertsController = () => import('#controllers/admin/alerts_controller')
const AdminReportsController = () => import('#controllers/admin/reports_controller')
const AdminSubscriptionsController = () => import('#controllers/admin/subscriptions_controller')
const AdminEmailsController = () => import('#controllers/admin/emails_controller')
const AdminEmailLogsController = () => import('#controllers/admin/email_logs_controller')
const HomeController = () => import('#controllers/home_controller')
const SocialAuthController = () => import('#controllers/social_auth_controller')

// Serve storage files (uploaded images and videos)
router.get('/storage/*', async ({ params, response }) => {
  const filePath = params['*'].join('/')
  const app = await import('@adonisjs/core/services/app')
  const fullPath = app.default.makePath('storage', filePath)

  // Security: only allow specific file types
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm']
  const ext = filePath.toLowerCase().slice(filePath.lastIndexOf('.'))

  if (!allowedExtensions.includes(ext)) {
    return response.notFound('File not found')
  }

  return response.download(fullPath)
})

// Public landing page
router.get('/', [HomeController, 'index']).as('home')

// Auth routes (guest only - redirect to dashboard if logged in)
// Rate limited to prevent brute force attacks (5 attempts per 15 min)
router.group(() => {
  router.get('/register', [AuthController, 'showRegister']).as('register')
  router.post('/register', [AuthController, 'register']).middleware(middleware.throttle())
  router.get('/login', [AuthController, 'showLogin']).as('login')
  router.post('/login', [AuthController, 'login']).middleware(middleware.throttle())

  // Email verification
  router.get('/verify-email', [AuthController, 'showVerifyEmail']).as('verify.email')
  router.post('/verify-email', [AuthController, 'verifyEmail']).middleware(middleware.throttle())
  router.post('/resend-verification', [AuthController, 'resendVerificationCode']).middleware(middleware.throttle())

  // Password reset
  router.get('/forgot-password', [AuthController, 'showForgotPassword']).as('forgot.password')
  router.post('/forgot-password', [AuthController, 'forgotPassword']).middleware(middleware.throttle())
  router.get('/reset-password', [AuthController, 'showResetPassword']).as('reset.password')
  router.post('/reset-password', [AuthController, 'resetPassword']).middleware(middleware.throttle())
}).middleware(middleware.guest())

// Social authentication routes (Google, Apple)
router.group(() => {
  router.get('/auth/google', [SocialAuthController, 'googleRedirect']).as('auth.google')
  router.get('/auth/google/callback', [SocialAuthController, 'googleCallback']).as('auth.google.callback')
  router.get('/auth/apple', [SocialAuthController, 'appleRedirect']).as('auth.apple')
  router.post('/auth/apple/callback', [SocialAuthController, 'appleCallback']).as('auth.apple.callback')
})

// Logout route (auth required)
router.post('/logout', [AuthController, 'logout']).as('logout').middleware(middleware.auth())

// Protected routes (auth required) - FREE tier (accessible without subscription)
router.group(() => {
  // Dashboard - always accessible to see subscription status
  router.get('/dashboard', [DashboardController, 'index']).as('dashboard')
  router.post('/dashboard/dismiss-notification-banner', [DashboardController, 'dismissNotificationBanner']).as('dashboard.dismissNotificationBanner')

  // Restaurant setup - part of onboarding, must be free
  router.get('/restaurant/type', [RestaurantsController, 'showTypeChoice']).as('restaurant.type')
  router.post('/restaurant/type', [RestaurantsController, 'storeType'])

  // Onboarding flow - must be free to complete setup
  router.get('/onboarding/strategy', [OnboardingController, 'showStrategy']).as('onboarding.strategy')
  router.post('/onboarding/strategy', [OnboardingController, 'storeStrategy'])
  router.get('/onboarding/rhythm', [OnboardingController, 'showRhythm']).as('onboarding.rhythm')
  router.post('/onboarding/rhythm', [OnboardingController, 'storeRhythm'])
  router.get('/onboarding/instagram', [OnboardingController, 'showInstagram']).as('onboarding.instagram')
  router.get('/onboarding/instagram/error', [OnboardingController, 'showInstagramError']).as('onboarding.instagram.error')
  router.post('/onboarding/instagram/skip', [OnboardingController, 'skipInstagram']).as('onboarding.instagram.skip')
  router.post('/onboarding/instagram/continue', [OnboardingController, 'continueFromInstagram']).as('onboarding.instagram.continue')
  router.get('/onboarding/pwa', [OnboardingController, 'showPwa']).as('onboarding.pwa')
  router.post('/onboarding/pwa/continue', [OnboardingController, 'continuePwa']).as('onboarding.pwa.continue')
  router.post('/onboarding/complete', [OnboardingController, 'complete']).as('onboarding.complete')
  router.get('/onboarding/status', [OnboardingController, 'status']).as('onboarding.status')

  // Profile - accessible to manage account
  router.get('/profile', [ProfileController, 'index']).as('profile')
  router.post('/profile/email', [ProfileController, 'updateEmail']).as('profile.updateEmail')
  router.post('/profile/restaurant/name', [ProfileController, 'updateRestaurantName']).as('profile.updateRestaurantName')
  router.post('/profile/restaurant/type', [ProfileController, 'updateRestaurantType']).as('profile.updateRestaurantType')
  router.post('/profile/restaurant/rhythm', [ProfileController, 'updatePublicationRhythm']).as('profile.updatePublicationRhythm')
  router.post('/profile/instagram/disconnect', [ProfileController, 'disconnectInstagram']).as('profile.instagram.disconnect')
  router.post('/profile/restart-onboarding', [ProfileController, 'restartOnboarding']).as('profile.restart.onboarding')

  // Instagram settings & connection - accessible to connect account
  router.get('/settings/instagram', [InstagramController, 'index']).as('instagram.settings')
  router.get('/instagram/connect', [InstagramController, 'connect']).as('instagram.connect')
  router.get('/instagram/callback', [InstagramController, 'callback']).as('instagram.callback')
  router.post('/instagram/disconnect', [InstagramController, 'disconnect']).as('instagram.disconnect')
  router.get('/instagram/accounts', [InstagramController, 'accounts']).as('instagram.accounts')
  router.get('/instagram/status', [InstagramController, 'status']).as('instagram.status')

  // Notifications API - accessible to manage notifications
  router.get('/notifications/public-key', [NotificationsController, 'publicKey']).as('notifications.publicKey')
  router.post('/notifications/subscribe', [NotificationsController, 'subscribe']).as('notifications.subscribe')
  router.post('/notifications/unsubscribe', [NotificationsController, 'unsubscribe']).as('notifications.unsubscribe')
  router.post('/notifications/settings', [NotificationsController, 'updateSettings']).as('notifications.settings')
  router.post('/notifications/test', [NotificationsController, 'test']).as('notifications.test')

  // Subscriptions - must be free to allow checkout
  router.get('/subscription', [SubscriptionsController, 'index']).as('subscription.index')
  router.post('/subscription/checkout', [SubscriptionsController, 'createCheckout']).as('subscription.checkout')
  router.get('/subscription/success', [SubscriptionsController, 'success']).as('subscription.success')
  router.post('/subscription/cancel', [SubscriptionsController, 'cancel']).as('subscription.cancel')
  router.post('/subscription/billing-portal', [SubscriptionsController, 'billingPortal']).as('subscription.billingPortal')
  router.get('/subscription/public-key', [SubscriptionsController, 'publicKey']).as('subscription.publicKey')
  router.get('/subscription/invoices', [SubscriptionsController, 'invoices']).as('subscription.invoices')
}).middleware(middleware.auth())

// Protected routes (auth + subscription required) - PREMIUM features
router.group(() => {
  // Instagram posting - premium feature
  router.post('/instagram/post', [InstagramController, 'post']).as('instagram.post')
  router.get('/instagram/post/:id', [InstagramController, 'postStatus']).as('instagram.postStatus')
  router.delete('/instagram/post/:id', [InstagramController, 'deletePost']).as('instagram.deletePost')

  // Missions - core premium feature
  router.get('/missions', [MissionsController, 'today']).as('missions.today')
  router.post('/missions/:id/accept', [MissionsController, 'accept']).as('missions.accept')
  router.post('/missions/:id/skip', [MissionsController, 'skip']).as('missions.skip')
  router.post('/missions/:id/reload', [MissionsController, 'reload']).as('missions.reload')
  router.get('/missions/history', [MissionsController, 'history']).as('missions.history')

  // Publication flow - premium feature
  router.get('/missions/:id/photo', [PublicationsController, 'photo']).as('missions.photo')
  router.post('/missions/:id/photo', [PublicationsController, 'uploadPhoto']).as('missions.photo.upload')
  router.get('/publications/:id/description', [PublicationsController, 'description']).as('publications.description')
  router.post('/publications/:id/caption', [PublicationsController, 'updateCaption']).as('publications.caption')
  router.post('/publications/:id/publish', [PublicationsController, 'publish']).as('publications.publish')
  router.get('/publications/:id/bravo', [PublicationsController, 'bravo']).as('publications.bravo')

  // Tutorials - premium feature
  router.get('/tutorials', [TutorialsController, 'index']).as('tutorials.index')
  router.get('/tutorials/search', [TutorialsController, 'search']).as('tutorials.search')
  router.get('/tutorials/:id', [TutorialsController, 'show']).as('tutorials.show')
  router.post('/tutorials/:id/complete', [TutorialsController, 'complete']).as('tutorials.complete')
  router.post('/tutorials/:id/feedback', [TutorialsController, 'feedback']).as('tutorials.feedback')
  router.get('/tutorials/:id/bravo', [TutorialsController, 'bravo']).as('tutorials.bravo')

  // Badges - premium feature
  router.get('/badges', [BadgesController, 'index']).as('badges.index')

  // Weekly Reports - premium feature
  router.get('/reports', [ReportsController, 'index']).as('reports.index')
  router.get('/reports/:id', [ReportsController, 'show']).as('reports.show')
  router.post('/reports/generate', [ReportsController, 'generate']).as('reports.generate')

  // Statistics - premium feature
  router.get('/statistics', [StatisticsController, 'index']).as('statistics.index')
  router.get('/statistics/evolution', [StatisticsController, 'evolution']).as('statistics.evolution')
  router.get('/statistics/summary', [StatisticsController, 'summary']).as('statistics.summary')
  router.get('/statistics/interpretation', [StatisticsController, 'interpretation']).as('statistics.interpretation')
  router.post('/statistics/instagram/refresh', [StatisticsController, 'refreshInstagram']).as('statistics.instagram.refresh')
}).middleware([middleware.auth(), middleware.subscription()])

// Stripe webhook (no auth, uses signature verification + rate limiting)
router
  .post('/webhooks/stripe', [SubscriptionsController, 'webhook'])
  .as('webhooks.stripe')
  .middleware([middleware.rawBody(), middleware.throttle()])

// Admin routes (FR38-FR49)
router.group(() => {
  // Dashboard
  router.get('/', [AdminController, 'dashboard']).as('admin.dashboard')

  // Users management
  router.get('/users', [AdminController, 'users']).as('admin.users')
  router.get('/users/:id', [AdminController, 'userDetail']).as('admin.users.show')

  // API endpoints
  router.get('/api/stats', [AdminController, 'stats']).as('admin.api.stats')
  router.get('/api/growth', [AdminController, 'growth']).as('admin.api.growth')
  router.get('/api/activity', [AdminController, 'activity']).as('admin.api.activity')
  router.get('/api/users/:id/stats', [AdminController, 'userStats']).as('admin.api.userStats')

  // Strategies CRUD (FR41)
  router.get('/strategies', [AdminStrategiesController, 'index']).as('admin.strategies.index')
  router.get('/strategies/create', [AdminStrategiesController, 'create']).as('admin.strategies.create')
  router.post('/strategies', [AdminStrategiesController, 'store']).as('admin.strategies.store')
  router.get('/strategies/:id/edit', [AdminStrategiesController, 'edit']).as('admin.strategies.edit')
  router.put('/strategies/:id', [AdminStrategiesController, 'update']).as('admin.strategies.update')
  router.post('/strategies/:id/toggle', [AdminStrategiesController, 'toggleActive']).as('admin.strategies.toggle')
  router.delete('/strategies/:id', [AdminStrategiesController, 'destroy']).as('admin.strategies.destroy')

  // Templates CRUD (FR44)
  router.get('/templates', [AdminTemplatesController, 'index']).as('admin.templates.index')
  router.get('/templates/create', [AdminTemplatesController, 'create']).as('admin.templates.create')
  router.post('/templates', [AdminTemplatesController, 'store']).as('admin.templates.store')
  router.get('/templates/:id/edit', [AdminTemplatesController, 'edit']).as('admin.templates.edit')
  router.put('/templates/:id', [AdminTemplatesController, 'update']).as('admin.templates.update')
  router.post('/templates/:id/toggle', [AdminTemplatesController, 'toggleActive']).as('admin.templates.toggle')
  router.delete('/templates/:id', [AdminTemplatesController, 'destroy']).as('admin.templates.destroy')

  // Tutorials CRUD (FR46)
  router.get('/tutorials', [AdminTutorialsController, 'index']).as('admin.tutorials.index')
  router.get('/tutorials/create', [AdminTutorialsController, 'create']).as('admin.tutorials.create')
  router.post('/tutorials', [AdminTutorialsController, 'store']).as('admin.tutorials.store')
  router.get('/tutorials/:id/edit', [AdminTutorialsController, 'edit']).as('admin.tutorials.edit')
  router.put('/tutorials/:id', [AdminTutorialsController, 'update']).as('admin.tutorials.update')
  router.post('/tutorials/:id/toggle', [AdminTutorialsController, 'toggleActive']).as('admin.tutorials.toggle')
  router.delete('/tutorials/:id', [AdminTutorialsController, 'destroy']).as('admin.tutorials.destroy')

  // Alerts & Re-engagement (FR47-FR48)
  router.get('/alerts', [AdminAlertsController, 'index']).as('admin.alerts.index')
  router.get('/alerts/targets', [AdminAlertsController, 'targets']).as('admin.alerts.targets')
  router.post('/alerts/send', [AdminAlertsController, 'send']).as('admin.alerts.send')
  router.post('/alerts/send-bulk', [AdminAlertsController, 'sendBulk']).as('admin.alerts.sendBulk')
  router.get('/api/alerts/stats', [AdminAlertsController, 'stats']).as('admin.api.alerts.stats')

  // Admin Reports (FR49)
  router.get('/reports', [AdminReportsController, 'index']).as('admin.reports.index')
  router.get('/reports/export', [AdminReportsController, 'export']).as('admin.reports.export')

  // Admin Subscriptions Management
  router.get('/subscriptions', [AdminSubscriptionsController, 'index']).as('admin.subscriptions.index')
  router.get('/subscriptions/:id', [AdminSubscriptionsController, 'show']).as('admin.subscriptions.show')
  router.post('/subscriptions/:id/extend-trial', [AdminSubscriptionsController, 'extendTrial']).as('admin.subscriptions.extendTrial')
  router.post('/subscriptions/:id/grant-premium', [AdminSubscriptionsController, 'grantPremium']).as('admin.subscriptions.grantPremium')
  router.post('/subscriptions/:id/revoke', [AdminSubscriptionsController, 'revoke']).as('admin.subscriptions.revoke')
  router.post('/subscriptions/:id/reactivate', [AdminSubscriptionsController, 'reactivate']).as('admin.subscriptions.reactivate')
  router.get('/api/subscriptions/stats', [AdminSubscriptionsController, 'stats']).as('admin.api.subscriptions.stats')

  // Email Configuration
  router.get('/emails', [AdminEmailsController, 'index']).as('admin.emails.index')
  router.post('/emails', [AdminEmailsController, 'update']).as('admin.emails.update')
  router.post('/emails/test', [AdminEmailsController, 'sendTest']).as('admin.emails.test')

  // Email Logs / History
  router.get('/email-logs', [AdminEmailLogsController, 'index']).as('admin.email-logs.index')
  router.get('/email-logs/:id', [AdminEmailLogsController, 'show']).as('admin.email-logs.show')
  router.post('/email-logs/:id/status', [AdminEmailLogsController, 'updateStatus']).as('admin.email-logs.updateStatus')
  router.post('/email-logs/cleanup', [AdminEmailLogsController, 'cleanup']).as('admin.email-logs.cleanup')
}).prefix('/admin').middleware([middleware.auth(), middleware.admin()])

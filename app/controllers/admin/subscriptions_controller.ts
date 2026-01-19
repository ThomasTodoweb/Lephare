import type { HttpContext } from '@adonisjs/core/http'
import Subscription from '#models/subscription'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'

// Input validation constants
const MAX_DAYS = 365
const MAX_MONTHS = 24
const MAX_SEARCH_LENGTH = 100
const MAX_REASON_LENGTH = 500

/**
 * Escape special LIKE/ILIKE pattern characters to prevent injection
 */
function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, '\\$&')
}

export default class AdminSubscriptionsController {
  /**
   * List all subscriptions with user info
   */
  async index({ inertia, request }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const status = request.input('status', 'all')
    const rawSearch = String(request.input('search', '')).trim()

    // Validate and sanitize search input
    const search = rawSearch.substring(0, MAX_SEARCH_LENGTH)

    let query = Subscription.query()
      .preload('user')
      .orderBy('created_at', 'desc')

    // Filter by status (whitelist allowed values)
    const allowedStatuses = ['active', 'trialing', 'canceled', 'past_due', 'incomplete']
    if (status !== 'all' && allowedStatuses.includes(status)) {
      query = query.where('status', status)
    }

    // Search by user email (escape special LIKE characters)
    if (search) {
      const escapedSearch = escapeLikePattern(search)
      query = query.whereHas('user', (userQuery) => {
        userQuery.where('email', 'ilike', `%${escapedSearch}%`)
      })
    }

    const subscriptions = await query.paginate(page, 20)

    // Get subscription stats
    const stats = await this.getSubscriptionStats()

    return inertia.render('admin/subscriptions/index', {
      subscriptions: subscriptions.serialize(),
      stats,
      filters: { status, search },
    })
  }

  /**
   * Show subscription details
   */
  async show({ inertia, params }: HttpContext) {
    const subscription = await Subscription.query()
      .where('id', params.id)
      .preload('user', (query) => {
        query.preload('restaurant')
      })
      .firstOrFail()

    return inertia.render('admin/subscriptions/show', {
      subscription: subscription.serialize(),
    })
  }

  /**
   * Extend trial period for a user
   */
  async extendTrial({ params, request, response, auth }: HttpContext) {
    const admin = auth.getUserOrFail()
    const subscription = await Subscription.findOrFail(params.id)

    // Validate days input
    const rawDays = request.input('days', 7)
    const days = Math.min(Math.max(1, Number(rawDays) || 7), MAX_DAYS)

    if (subscription.status !== 'trialing') {
      return response.badRequest({ error: 'User is not in trial period' })
    }

    // Extend trial
    const newTrialEnd = subscription.trialEndsAt
      ? subscription.trialEndsAt.plus({ days })
      : DateTime.utc().plus({ days })

    subscription.trialEndsAt = newTrialEnd
    subscription.currentPeriodEnd = newTrialEnd
    await subscription.save()

    // Audit log
    logger.info(
      { adminId: admin.id, userId: subscription.userId, days },
      'Admin extended trial period'
    )

    return response.json({
      success: true,
      message: `Trial extended by ${days} days`,
      newTrialEnd: newTrialEnd.toISO(),
    })
  }

  /**
   * Grant free premium access to a user
   */
  async grantPremium({ params, request, response, auth }: HttpContext) {
    const admin = auth.getUserOrFail()
    const subscription = await Subscription.findOrFail(params.id)

    // Validate inputs
    const rawMonths = request.input('months', 1)
    const months = Math.min(Math.max(1, Number(rawMonths) || 1), MAX_MONTHS)
    const rawReason = String(request.input('reason', 'Admin granted'))
    const reason = rawReason.substring(0, MAX_REASON_LENGTH)

    const periodEnd = DateTime.utc().plus({ months })

    subscription.planType = 'monthly'
    subscription.status = 'active'
    subscription.currentPeriodStart = DateTime.utc()
    subscription.currentPeriodEnd = periodEnd
    subscription.trialEndsAt = null
    subscription.canceledAt = null
    // Note: stripeSubscriptionId stays null for admin-granted subscriptions
    await subscription.save()

    // Audit log with admin ID
    logger.info(
      { adminId: admin.id, userId: subscription.userId, months, reason },
      'Admin granted premium access'
    )

    return response.json({
      success: true,
      message: `Granted ${months} months premium access`,
      periodEnd: periodEnd.toISO(),
    })
  }

  /**
   * Revoke/cancel subscription immediately
   */
  async revoke({ params, request, response, auth }: HttpContext) {
    const admin = auth.getUserOrFail()
    const subscription = await Subscription.findOrFail(params.id)

    // Validate reason
    const rawReason = String(request.input('reason', 'Admin revoked'))
    const reason = rawReason.substring(0, MAX_REASON_LENGTH)

    subscription.status = 'canceled'
    subscription.canceledAt = DateTime.utc()
    await subscription.save()

    // Audit log
    logger.info(
      { adminId: admin.id, userId: subscription.userId, reason },
      'Admin revoked subscription'
    )

    return response.json({
      success: true,
      message: 'Subscription revoked',
    })
  }

  /**
   * Reactivate a canceled subscription (for admin-managed subs only)
   */
  async reactivate({ params, request, response, auth }: HttpContext) {
    const admin = auth.getUserOrFail()
    const subscription = await Subscription.findOrFail(params.id)

    // Validate months input
    const rawMonths = request.input('months', 1)
    const months = Math.min(Math.max(1, Number(rawMonths) || 1), MAX_MONTHS)

    // Only allow reactivation of admin-managed subscriptions (no Stripe ID)
    if (subscription.stripeSubscriptionId) {
      return response.badRequest({
        error: 'Cannot reactivate Stripe-managed subscription. User must re-subscribe.',
      })
    }

    const periodEnd = DateTime.utc().plus({ months })

    subscription.status = 'active'
    subscription.currentPeriodStart = DateTime.utc()
    subscription.currentPeriodEnd = periodEnd
    subscription.canceledAt = null
    await subscription.save()

    // Audit log
    logger.info(
      { adminId: admin.id, userId: subscription.userId, months },
      'Admin reactivated subscription'
    )

    return response.json({
      success: true,
      message: `Subscription reactivated for ${months} months`,
      periodEnd: periodEnd.toISO(),
    })
  }

  /**
   * Get subscription statistics
   */
  private async getSubscriptionStats() {
    const now = DateTime.utc()
    const thirtyDaysAgo = now.minus({ days: 30 })

    // Total counts by status
    const statusCounts = await Subscription.query()
      .select('status')
      .count('* as count')
      .groupBy('status')

    const stats: Record<string, number> = {
      total: 0,
      active: 0,
      trialing: 0,
      canceled: 0,
      past_due: 0,
    }

    for (const row of statusCounts) {
      const status = row.status as string
      const count = Number(row.$extras.count)
      stats[status] = count
      stats.total += count
    }

    // New subscriptions in last 30 days
    const newSubscriptions = await Subscription.query()
      .where('created_at', '>=', thirtyDaysAgo.toSQL())
      .count('* as count')
      .first()
    stats.new30Days = Number(newSubscriptions?.$extras.count || 0)

    // Churned in last 30 days
    const churned = await Subscription.query()
      .where('canceled_at', '>=', thirtyDaysAgo.toSQL())
      .count('* as count')
      .first()
    stats.churned30Days = Number(churned?.$extras.count || 0)

    // Trial conversions (trials that became active)
    const conversions = await db
      .from('subscriptions')
      .where('plan_type', '!=', 'free_trial')
      .whereNotNull('stripe_subscription_id')
      .count('* as count')
      .first()
    stats.conversions = Number(conversions?.count || 0)

    // Revenue estimate (rough calculation)
    const monthlyCount = await Subscription.query()
      .where('status', 'active')
      .where('plan_type', 'monthly')
      .count('* as count')
      .first()
    const yearlyCount = await Subscription.query()
      .where('status', 'active')
      .where('plan_type', 'yearly')
      .count('* as count')
      .first()

    const monthlyRevenue = Number(monthlyCount?.$extras.count || 0) * 29
    const yearlyRevenue = (Number(yearlyCount?.$extras.count || 0) * 290) / 12
    stats.mrr = Math.round(monthlyRevenue + yearlyRevenue)

    return stats
  }

  /**
   * API endpoint for subscription stats (for dashboard widgets)
   */
  async stats({ response }: HttpContext) {
    const stats = await this.getSubscriptionStats()
    return response.json(stats)
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import Subscription from '#models/subscription'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class AdminSubscriptionsController {
  /**
   * List all subscriptions with user info
   */
  async index({ inertia, request }: HttpContext) {
    const page = request.input('page', 1)
    const status = request.input('status', 'all')
    const search = request.input('search', '')

    let query = Subscription.query()
      .preload('user')
      .orderBy('created_at', 'desc')

    // Filter by status
    if (status !== 'all') {
      query = query.where('status', status)
    }

    // Search by user email
    if (search) {
      query = query.whereHas('user', (userQuery) => {
        userQuery.where('email', 'ilike', `%${search}%`)
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
  async extendTrial({ params, request, response }: HttpContext) {
    const subscription = await Subscription.findOrFail(params.id)
    const days = request.input('days', 7)

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

    return response.json({
      success: true,
      message: `Trial extended by ${days} days`,
      newTrialEnd: newTrialEnd.toISO(),
    })
  }

  /**
   * Grant free premium access to a user
   */
  async grantPremium({ params, request, response }: HttpContext) {
    const subscription = await Subscription.findOrFail(params.id)
    const months = request.input('months', 1)
    const reason = request.input('reason', 'Admin granted')

    const periodEnd = DateTime.utc().plus({ months })

    subscription.planType = 'monthly'
    subscription.status = 'active'
    subscription.currentPeriodStart = DateTime.utc()
    subscription.currentPeriodEnd = periodEnd
    subscription.trialEndsAt = null
    subscription.canceledAt = null
    // Note: stripeSubscriptionId stays null for admin-granted subscriptions
    await subscription.save()

    // Log the action (in production, you'd want a proper audit log)
    console.log(`Admin granted ${months} months premium to user ${subscription.userId}: ${reason}`)

    return response.json({
      success: true,
      message: `Granted ${months} months premium access`,
      periodEnd: periodEnd.toISO(),
    })
  }

  /**
   * Revoke/cancel subscription immediately
   */
  async revoke({ params, request, response }: HttpContext) {
    const subscription = await Subscription.findOrFail(params.id)
    const reason = request.input('reason', 'Admin revoked')

    subscription.status = 'canceled'
    subscription.canceledAt = DateTime.utc()
    await subscription.save()

    // Log the action
    console.log(`Admin revoked subscription for user ${subscription.userId}: ${reason}`)

    return response.json({
      success: true,
      message: 'Subscription revoked',
    })
  }

  /**
   * Reactivate a canceled subscription (for admin-managed subs only)
   */
  async reactivate({ params, request, response }: HttpContext) {
    const subscription = await Subscription.findOrFail(params.id)
    const months = request.input('months', 1)

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

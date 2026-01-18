import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/user'
import Mission from '#models/mission'
import Subscription from '#models/subscription'
import TutorialCompletion from '#models/tutorial_completion'

interface PeriodStats {
  newUsers: number
  completedMissions: number
  tutorialsViewed: number
  activeSubscriptions: number
  newSubscriptions: number
  canceledSubscriptions: number
  revenue: number
}

export default class ReportsController {
  /**
   * Show reports dashboard (FR49)
   */
  async index({ inertia, request }: HttpContext) {
    const period = request.input('period', '7') as '7' | '30' | '90'
    const daysAgo = Number(period)

    const startDate = DateTime.utc().minus({ days: daysAgo }).startOf('day')
    const previousStartDate = startDate.minus({ days: daysAgo })

    // Current period stats
    const currentStats = await this.getPeriodStats(startDate, DateTime.utc())
    const previousStats = await this.getPeriodStats(previousStartDate, startDate)

    // Daily breakdown for chart
    const dailyStats = await this.getDailyBreakdown(daysAgo)

    // Top performers
    const topUsers = await this.getTopPerformers(startDate, 5)

    return inertia.render('admin/reports/index', {
      period,
      currentStats,
      previousStats,
      dailyStats,
      topUsers,
    })
  }

  /**
   * Export report data as JSON
   */
  async export({ request, response }: HttpContext) {
    const period = Number(request.input('period', 30))
    const startDate = DateTime.utc().minus({ days: period }).startOf('day')

    const stats = await this.getPeriodStats(startDate, DateTime.utc())
    const dailyStats = await this.getDailyBreakdown(period)
    const topUsers = await this.getTopPerformers(startDate, 10)

    const report = {
      generatedAt: DateTime.utc().toISO(),
      period: `${period} days`,
      startDate: startDate.toISO(),
      endDate: DateTime.utc().toISO(),
      summary: stats,
      dailyBreakdown: dailyStats,
      topPerformers: topUsers,
    }

    response.header('Content-Type', 'application/json')
    response.header(
      'Content-Disposition',
      `attachment; filename="lephare-report-${DateTime.utc().toFormat('yyyy-MM-dd')}.json"`
    )

    return response.json(report)
  }

  /**
   * Get stats for a specific period
   */
  private async getPeriodStats(startDate: DateTime, endDate: DateTime): Promise<PeriodStats> {
    const startSQL = startDate.toSQL()!
    const endSQL = endDate.toSQL()!

    // New users
    const newUsersResult = await User.query()
      .where('role', 'user')
      .where('created_at', '>=', startSQL)
      .where('created_at', '<', endSQL)
      .count('* as total')
      .first()

    // Completed missions
    const missionsResult = await Mission.query()
      .where('status', 'completed')
      .where('completed_at', '>=', startSQL)
      .where('completed_at', '<', endSQL)
      .count('* as total')
      .first()

    // Tutorials viewed
    const tutorialsResult = await TutorialCompletion.query()
      .where('completed_at', '>=', startSQL)
      .where('completed_at', '<', endSQL)
      .count('* as total')
      .first()

    // Subscription stats
    const activeSubsResult = await Subscription.query()
      .where('status', 'active')
      .count('* as total')
      .first()

    const newSubsResult = await Subscription.query()
      .where('created_at', '>=', startSQL)
      .where('created_at', '<', endSQL)
      .count('* as total')
      .first()

    const canceledSubsResult = await Subscription.query()
      .whereNotNull('canceled_at')
      .where('canceled_at', '>=', startSQL)
      .where('canceled_at', '<', endSQL)
      .count('* as total')
      .first()

    // Revenue estimation (29€/month or 290€/year)
    const monthlyCount = await Subscription.query()
      .where('status', 'active')
      .where('plan_type', 'monthly')
      .count('* as total')
      .first()

    const yearlyCount = await Subscription.query()
      .where('status', 'active')
      .where('plan_type', 'yearly')
      .count('* as total')
      .first()

    const monthlyRevenue = Number(monthlyCount?.$extras.total || 0) * 29
    const yearlyRevenue = Number(yearlyCount?.$extras.total || 0) * 290 / 12 // Monthly equivalent

    return {
      newUsers: Number(newUsersResult?.$extras.total || 0),
      completedMissions: Number(missionsResult?.$extras.total || 0),
      tutorialsViewed: Number(tutorialsResult?.$extras.total || 0),
      activeSubscriptions: Number(activeSubsResult?.$extras.total || 0),
      newSubscriptions: Number(newSubsResult?.$extras.total || 0),
      canceledSubscriptions: Number(canceledSubsResult?.$extras.total || 0),
      revenue: Math.round(monthlyRevenue + yearlyRevenue),
    }
  }

  /**
   * Get daily breakdown for charts
   */
  private async getDailyBreakdown(days: number): Promise<Array<{
    date: string
    users: number
    missions: number
  }>> {
    const result: Array<{ date: string; users: number; missions: number }> = []

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = DateTime.utc().minus({ days: i }).startOf('day')
      const dayEnd = dayStart.plus({ days: 1 })
      const dayStartSQL = dayStart.toSQL()!
      const dayEndSQL = dayEnd.toSQL()!

      const users = await User.query()
        .where('role', 'user')
        .where('created_at', '>=', dayStartSQL)
        .where('created_at', '<', dayEndSQL)
        .count('* as total')
        .first()

      const missions = await Mission.query()
        .where('status', 'completed')
        .where('completed_at', '>=', dayStartSQL)
        .where('completed_at', '<', dayEndSQL)
        .count('* as total')
        .first()

      result.push({
        date: dayStart.toISODate() || '',
        users: Number(users?.$extras.total || 0),
        missions: Number(missions?.$extras.total || 0),
      })
    }

    return result
  }

  /**
   * Get top performing users
   */
  private async getTopPerformers(
    startDate: DateTime,
    limit: number
  ): Promise<Array<{
    id: number
    name: string
    email: string
    completedMissions: number
  }>> {
    const startSQL = startDate.toSQL()!

    // Get users with most completed missions in period
    const topMissions = await Mission.query()
      .select('user_id')
      .where('status', 'completed')
      .where('completed_at', '>=', startSQL)
      .groupBy('user_id')
      .count('* as missions_count')
      .orderBy('missions_count', 'desc')
      .limit(limit)

    const result: Array<{
      id: number
      name: string
      email: string
      completedMissions: number
    }> = []

    for (const row of topMissions) {
      const user = await User.find(row.userId)
      if (user) {
        result.push({
          id: user.id,
          name: user.fullName || user.email,
          email: user.email,
          completedMissions: Number(row.$extras.missions_count || 0),
        })
      }
    }

    return result
  }
}

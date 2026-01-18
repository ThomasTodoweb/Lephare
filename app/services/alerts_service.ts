import { DateTime } from 'luxon'
import User from '#models/user'
import Mission from '#models/mission'
import Streak from '#models/streak'

export interface AlertTarget {
  id: number
  fullName: string | null
  email: string
  lastActivity: string | null
  daysInactive: number
  streakLost: boolean
  missionsCompleted: number
  alertType: 'inactive' | 'streak_lost' | 'trial_ending' | 'subscription_expired'
}

export interface AlertStats {
  inactiveUsers: number
  streakLostUsers: number
  trialEndingUsers: number
}

export default class AlertsService {
  /**
   * Get users who need re-engagement alerts
   */
  async getAlertTargets(options: {
    type?: 'inactive' | 'streak_lost' | 'all'
    inactiveDays?: number
    limit?: number
  }): Promise<AlertTarget[]> {
    const { type = 'all', inactiveDays = 7, limit = 50 } = options
    const targets: AlertTarget[] = []

    const cutoffDate = DateTime.utc().minus({ days: inactiveDays })

    if (type === 'all' || type === 'inactive') {
      // Find inactive users (no activity for X days)
      const inactiveUsers = await User.query()
        .where('role', 'user')
        .where('updated_at', '<', cutoffDate.toSQL())
        .orderBy('updated_at', 'asc')
        .limit(limit)

      for (const user of inactiveUsers) {
        const missionsCount = await Mission.query()
          .where('user_id', user.id)
          .where('status', 'completed')
          .count('* as total')
          .first()

        const daysInactive = Math.floor(
          DateTime.utc().diff(user.updatedAt || user.createdAt, 'days').days
        )

        targets.push({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          lastActivity: user.updatedAt?.toISO() || null,
          daysInactive,
          streakLost: false,
          missionsCompleted: Number(missionsCount?.$extras.total || 0),
          alertType: 'inactive',
        })
      }
    }

    if (type === 'all' || type === 'streak_lost') {
      // Find users who lost their streak recently
      const yesterday = DateTime.utc().minus({ days: 1 }).startOf('day')

      const lostStreaks = await Streak.query()
        .where('current_streak', 0)
        .where('longest_streak', '>', 0)
        .where('last_activity_date', '<', yesterday.toSQL())
        .preload('user')
        .limit(limit)

      for (const streak of lostStreaks) {
        if (!streak.user) continue

        // Avoid duplicates
        if (targets.some((t) => t.id === streak.userId)) continue

        const missionsCount = await Mission.query()
          .where('user_id', streak.userId)
          .where('status', 'completed')
          .count('* as total')
          .first()

        const daysInactive = streak.lastActivityDate
          ? Math.floor(DateTime.utc().diff(streak.lastActivityDate, 'days').days)
          : 0

        targets.push({
          id: streak.userId,
          fullName: streak.user.fullName,
          email: streak.user.email,
          lastActivity: streak.lastActivityDate?.toISO() || null,
          daysInactive,
          streakLost: true,
          missionsCompleted: Number(missionsCount?.$extras.total || 0),
          alertType: 'streak_lost',
        })
      }
    }

    return targets.slice(0, limit)
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<AlertStats> {
    const sevenDaysAgo = DateTime.utc().minus({ days: 7 })
    const yesterday = DateTime.utc().minus({ days: 1 }).startOf('day')

    const inactiveCount = await User.query()
      .where('role', 'user')
      .where('updated_at', '<', sevenDaysAgo.toSQL())
      .count('* as total')
      .first()

    const streakLostCount = await Streak.query()
      .where('current_streak', 0)
      .where('longest_streak', '>', 0)
      .where('last_activity_date', '<', yesterday.toSQL())
      .count('* as total')
      .first()

    // TODO: Add trial ending count when subscription system is fully implemented
    const trialEndingCount = 0

    return {
      inactiveUsers: Number(inactiveCount?.$extras.total || 0),
      streakLostUsers: Number(streakLostCount?.$extras.total || 0),
      trialEndingUsers: trialEndingCount,
    }
  }

  /**
   * Send re-engagement notification (placeholder - would integrate with email/push service)
   */
  async sendReengagementAlert(
    userId: number,
    alertType: 'inactive' | 'streak_lost'
  ): Promise<boolean> {
    const user = await User.find(userId)
    if (!user) return false

    // In production, this would:
    // 1. Queue an email via email service (SendGrid, Mailgun, etc.)
    // 2. Send a push notification if enabled
    // 3. Log the alert in an alerts_log table

    console.log(`📧 AlertsService: Would send ${alertType} alert to ${user.email}`)

    return true
  }

  /**
   * Bulk send alerts (for scheduled jobs)
   */
  async sendBulkAlerts(
    userIds: number[],
    alertType: 'inactive' | 'streak_lost'
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0
    let failed = 0

    for (const userId of userIds) {
      const success = await this.sendReengagementAlert(userId, alertType)
      if (success) {
        sent++
      } else {
        failed++
      }
    }

    return { sent, failed }
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import MissionService from '#services/mission_service'
import GamificationService from '#services/gamification_service'
import PushService from '#services/push_service'
import PushSubscription from '#models/push_subscription'
import Mission from '#models/mission'

export default class DashboardController {
  async index({ inertia, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    // Get today's mission
    const missionService = new MissionService()
    const mission = await missionService.getTodayMission(user.id)

    // Get streak info
    const gamificationService = new GamificationService()
    const streakInfo = await gamificationService.getStreakInfo(user.id)
    const streakMessage = gamificationService.getStreakEncouragement(
      streakInfo.currentStreak,
      streakInfo.isAtRisk
    )

    // Check if user has push notifications enabled
    const hasActiveSubscription = await PushSubscription.query()
      .where('user_id', user.id)
      .where('is_active', true)
      .first()

    // Push notifications configuration
    const pushService = new PushService()
    const notificationsConfigured = pushService.isConfigured()

    // Get missions for calendar (current month + previous and next month for navigation)
    const now = DateTime.now().setZone('Europe/Paris')
    const startOfPrevMonth = now.minus({ months: 1 }).startOf('month')
    const endOfNextMonth = now.plus({ months: 1 }).endOf('month')

    const calendarMissions = await Mission.query()
      .where('user_id', user.id)
      .where('assigned_at', '>=', startOfPrevMonth.toJSDate())
      .where('assigned_at', '<=', endOfNextMonth.toJSDate())
      .preload('missionTemplate')
      .orderBy('assigned_at', 'asc')

    return inertia.render('dashboard', {
      user: {
        ...user.serialize(),
        notificationBannerDismissed: user.notificationBannerDismissed,
      },
      restaurant: restaurant.serialize(),
      mission: mission
        ? {
            id: mission.id,
            status: mission.status,
            canUseAction: mission.canUsePassOrReload(),
            usedPass: mission.usedPass,
            usedReload: mission.usedReload,
            template: {
              type: mission.missionTemplate.type,
              title: mission.missionTemplate.title,
              contentIdea: mission.missionTemplate.contentIdea,
            },
          }
        : null,
      streak: {
        current: streakInfo.currentStreak,
        longest: streakInfo.longestStreak,
        isAtRisk: streakInfo.isAtRisk,
        message: streakMessage,
      },
      notifications: {
        hasSubscription: !!hasActiveSubscription,
        isConfigured: notificationsConfigured,
      },
      calendarMissions: calendarMissions.map((m) => ({
        id: m.id,
        date: m.assignedAt.setZone('Europe/Paris').toISODate(),
        status: m.status,
        type: m.missionTemplate?.type || 'post',
        title: m.missionTemplate?.title || 'Mission',
      })),
    })
  }

  /**
   * Dismiss the notification banner
   */
  async dismissNotificationBanner({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    user.notificationBannerDismissed = true
    await user.save()
    return response.json({ success: true })
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import MissionService from '#services/mission_service'
import GamificationService from '#services/gamification_service'
import LevelService from '#services/level_service'
import PushService from '#services/push_service'
import PushSubscription from '#models/push_subscription'
import Mission from '#models/mission'

export default class DashboardController {
  /**
   * Get a cover image URL based on mission template
   * Uses template's custom cover image if available, otherwise falls back to default
   */
  private getCoverImage(type: string, coverImagePath: string | null): string {
    // Use template's custom cover image if available
    if (coverImagePath) {
      return `/${coverImagePath}`
    }

    // Fallback to default placeholder images
    const images: Record<string, string> = {
      post: 'https://picsum.photos/seed/post/400/500',
      story: 'https://picsum.photos/seed/story/400/500',
      reel: 'https://picsum.photos/seed/reel/400/500',
      tuto: 'https://picsum.photos/seed/tuto/400/500',
      engagement: 'https://picsum.photos/seed/engagement/400/500',
      carousel: 'https://picsum.photos/seed/carousel/400/500',
    }
    return images[type] || images.post
  }

  async index({ inertia, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    // Get today's missions (3 missions per day)
    const missionService = new MissionService()
    const todayMissions = await missionService.getTodayMissions(user.id)

    // Get streak info
    const gamificationService = new GamificationService()
    const streakInfo = await gamificationService.getStreakInfo(user.id)
    const streakMessage = gamificationService.getStreakEncouragement(
      streakInfo.currentStreak,
      streakInfo.isAtRisk
    )

    // Get level info
    const levelService = new LevelService()
    const levelInfo = await levelService.getLevelInfo(user.id)

    // Check if user has push notifications enabled
    const hasActiveSubscription = await PushSubscription.query()
      .where('user_id', user.id)
      .where('is_active', true)
      .first()

    // Push notifications configuration
    const pushService = new PushService()
    const notificationsConfigured = pushService.isConfigured()

    // Calendar date range configuration
    // Note: MissionCalendar component exists but is not currently imported in dashboard.tsx
    // Keeping this query for future calendar feature activation - data is sent to frontend
    const CALENDAR_RANGE_DAYS = 60
    const calendarStartDate = DateTime.utc().startOf('day')
    const calendarRangeStart = calendarStartDate.minus({ days: CALENDAR_RANGE_DAYS })
    const calendarRangeEnd = calendarStartDate.plus({ days: CALENDAR_RANGE_DAYS })

    const calendarMissions = await Mission.query()
      .where('user_id', user.id)
      .where('assigned_at', '>=', calendarRangeStart.toSQL())
      .where('assigned_at', '<=', calendarRangeEnd.toSQL())
      .preload('missionTemplate')
      .orderBy('assigned_at', 'asc')
      .limit(CALENDAR_RANGE_DAYS * 2)

    // Get planned future mission days based on rhythm
    const plannedFutureDays = missionService.getPlannedMissionDays(restaurant.publicationRhythm, 60)

    // Format today's missions for the carousel
    const formattedTodayMissions = todayMissions.map((m) => ({
      id: m.id,
      title: m.missionTemplate.title,
      description: m.missionTemplate.contentIdea,
      coverImageUrl: this.getCoverImage(m.missionTemplate.type, m.missionTemplate.coverImagePath),
      type: m.missionTemplate.type,
      status: m.status,
      isRecommended: m.isRecommended,
    }))

    // Legacy mission prop (for backward compatibility with today.tsx page)
    const recommendedMission = todayMissions.find((m) => m.isRecommended) || todayMissions[0]

    return inertia.render('dashboard', {
      user: {
        ...user.serialize(),
        notificationBannerDismissed: user.notificationBannerDismissed,
      },
      restaurant: restaurant.serialize(),
      mission: recommendedMission
        ? {
            id: recommendedMission.id,
            status: recommendedMission.status,
            canUseAction: recommendedMission.canUsePassOrReload(),
            usedPass: recommendedMission.usedPass,
            usedReload: recommendedMission.usedReload,
            template: {
              type: recommendedMission.missionTemplate.type,
              title: recommendedMission.missionTemplate.title,
              contentIdea: recommendedMission.missionTemplate.contentIdea,
            },
          }
        : null,
      todayMissions: formattedTodayMissions,
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
      plannedFutureDays: plannedFutureDays.map((d) => d.setZone('Europe/Paris').toISODate()),
      level: levelInfo,
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

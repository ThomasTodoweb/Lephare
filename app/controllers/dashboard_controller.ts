import type { HttpContext } from '@adonisjs/core/http'
import MissionService from '#services/mission_service'
import GamificationService from '#services/gamification_service'
import PushService from '#services/push_service'
import PushSubscription from '#models/push_subscription'
import Mission from '#models/mission'

export default class DashboardController {
  /**
   * Get a cover image URL based on mission type
   */
  private getCoverImage(type: string): string {
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

    // Check if user has push notifications enabled
    const hasActiveSubscription = await PushSubscription.query()
      .where('user_id', user.id)
      .where('is_active', true)
      .first()

    // Push notifications configuration
    const pushService = new PushService()
    const notificationsConfigured = pushService.isConfigured()

    // Get all missions for calendar (no date filter - show all user missions)
    const calendarMissions = await Mission.query()
      .where('user_id', user.id)
      .preload('missionTemplate')
      .orderBy('assigned_at', 'asc')

    // Get planned future mission days based on rhythm
    const plannedFutureDays = missionService.getPlannedMissionDays(restaurant.publicationRhythm, 60)

    // Format today's missions for the carousel
    const formattedTodayMissions = todayMissions.map((m) => ({
      id: m.id,
      title: m.missionTemplate.title,
      description: m.missionTemplate.contentIdea,
      coverImageUrl: this.getCoverImage(m.missionTemplate.type),
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

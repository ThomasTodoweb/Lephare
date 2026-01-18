import type { HttpContext } from '@adonisjs/core/http'
import MissionService from '#services/mission_service'
import GamificationService from '#services/gamification_service'

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

    return inertia.render('dashboard', {
      user: user.serialize(),
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
    })
  }
}

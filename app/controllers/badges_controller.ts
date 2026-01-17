import type { HttpContext } from '@adonisjs/core/http'
import GamificationService from '#services/gamification_service'

export default class BadgesController {
  /**
   * Show user's badge collection
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.user!
    const gamificationService = new GamificationService()

    const userBadges = await gamificationService.getUserBadges(user.id)
    const streakInfo = await gamificationService.getStreakInfo(user.id)

    // Count unlocked badges
    const unlockedCount = userBadges.filter((b) => b.unlocked).length
    const totalCount = userBadges.length

    return inertia.render('badges/index', {
      badges: userBadges.map((b) => ({
        id: b.badge.id,
        name: b.badge.name,
        slug: b.badge.slug,
        description: b.badge.description,
        icon: b.badge.icon,
        criteriaType: b.badge.criteriaType,
        criteriaValue: b.badge.criteriaValue,
        unlocked: b.unlocked,
        unlockedAt: b.unlockedAt?.toISO() || null,
      })),
      stats: {
        unlockedCount,
        totalCount,
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
      },
    })
  }
}

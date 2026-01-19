import { DateTime } from 'luxon'
import Mission from '#models/mission'
import MissionTemplate from '#models/mission_template'
import User from '#models/user'
import GamificationService from '#services/gamification_service'

export default class MissionService {
  /**
   * Get or create today's mission for a user
   * Uses UTC for consistent date handling across timezones
   */
  async getTodayMission(userId: number): Promise<Mission | null> {
    const today = DateTime.utc().startOf('day')
    const tomorrow = today.plus({ days: 1 })

    // Check if user already has a mission for today
    let mission = await Mission.query()
      .where('user_id', userId)
      .where('assigned_at', '>=', today.toSQL())
      .where('assigned_at', '<', tomorrow.toSQL())
      .preload('missionTemplate')
      .first()

    if (mission) {
      return mission
    }

    // No mission for today, prescribe one (with race condition protection via try/catch)
    try {
      return await this.prescribeDailyMission(userId)
    } catch (error) {
      // If duplicate mission created due to race condition, fetch existing one
      return Mission.query()
        .where('user_id', userId)
        .where('assigned_at', '>=', today.toSQL())
        .where('assigned_at', '<', tomorrow.toSQL())
        .preload('missionTemplate')
        .first()
    }
  }

  /**
   * Prescribe a daily mission based on user's strategy and progress
   * Always creates a mission - publication missions on rhythm days, engagement/tuto missions otherwise
   */
  async prescribeDailyMission(userId: number): Promise<Mission | null> {
    const user = await User.query()
      .where('id', userId)
      .preload('restaurant')
      .first()

    if (!user?.restaurant?.strategyId) {
      return null
    }

    const strategyId = user.restaurant.strategyId
    const publicationRhythm = user.restaurant.publicationRhythm

    // Check if today is a publication day based on rhythm
    const isPublicationDay = this.isPublicationDay(publicationRhythm)

    // Get completed mission template IDs for this user
    const completedMissions = await Mission.query()
      .where('user_id', userId)
      .where('status', 'completed')
      .select('mission_template_id')

    const completedTemplateIds = completedMissions.map((m) => m.missionTemplateId)

    let template: MissionTemplate | null = null

    if (isPublicationDay) {
      // On publication days: get post/story/reel missions
      template = await MissionTemplate.query()
        .where('strategy_id', strategyId)
        .where('is_active', true)
        .whereIn('type', ['post', 'story', 'reel'])
        .whereNotIn('id', completedTemplateIds.length > 0 ? completedTemplateIds : [0])
        .orderBy('order', 'asc')
        .first()

      // If all publication missions completed, cycle back
      if (!template) {
        template = await MissionTemplate.query()
          .where('strategy_id', strategyId)
          .where('is_active', true)
          .whereIn('type', ['post', 'story', 'reel'])
          .orderBy('order', 'asc')
          .first()
      }
    } else {
      // On non-publication days: get engagement or tuto missions
      template = await MissionTemplate.query()
        .where('strategy_id', strategyId)
        .where('is_active', true)
        .whereIn('type', ['engagement', 'tuto'])
        .whereNotIn('id', completedTemplateIds.length > 0 ? completedTemplateIds : [0])
        .orderByRaw('RANDOM()')
        .first()

      // If none found, try any engagement/tuto mission
      if (!template) {
        template = await MissionTemplate.query()
          .where('strategy_id', strategyId)
          .where('is_active', true)
          .whereIn('type', ['engagement', 'tuto'])
          .orderByRaw('RANDOM()')
          .first()
      }

      // Fallback: if no engagement missions exist, get a regular mission
      if (!template) {
        template = await MissionTemplate.query()
          .where('strategy_id', strategyId)
          .where('is_active', true)
          .orderByRaw('RANDOM()')
          .first()
      }
    }

    if (!template) {
      return null
    }

    // Create the mission (use UTC for consistent date handling)
    const mission = await Mission.create({
      userId,
      missionTemplateId: template.id,
      status: 'pending',
      assignedAt: DateTime.utc(),
      usedPass: false,
      usedReload: false,
    })

    await mission.load('missionTemplate')
    return mission
  }

  /**
   * Check if today is a publication day based on rhythm preference
   * Uses UTC for consistency
   */
  private isPublicationDay(rhythm: string | null): boolean {
    if (!rhythm) return true

    const dayOfWeek = DateTime.utc().weekday // 1 = Monday, 7 = Sunday

    switch (rhythm) {
      case 'daily':
        return true
      case 'five_week':
        // Monday to Friday
        return dayOfWeek <= 5
      case 'three_week':
        // Monday, Wednesday, Friday
        return [1, 3, 5].includes(dayOfWeek)
      case 'once_week':
        // Monday only
        return dayOfWeek === 1
      default:
        return true
    }
  }

  /**
   * Skip today's mission (mark as skipped, no new mission)
   */
  async skipMission(missionId: number, userId: number): Promise<{ success: boolean; error?: string }> {
    const mission = await Mission.query()
      .where('id', missionId)
      .where('user_id', userId)
      .first()

    if (!mission) {
      return { success: false, error: 'Mission introuvable' }
    }

    if (!mission.canUsePassOrReload()) {
      return { success: false, error: 'Vous avez déjà utilisé votre action du jour' }
    }

    mission.status = 'skipped'
    mission.usedPass = true
    await mission.save()

    return { success: true }
  }

  /**
   * Reload mission (get a different one)
   */
  async reloadMission(missionId: number, userId: number): Promise<{ success: boolean; mission?: Mission; error?: string }> {
    const currentMission = await Mission.query()
      .where('id', missionId)
      .where('user_id', userId)
      .first()

    if (!currentMission) {
      return { success: false, error: 'Mission introuvable' }
    }

    if (!currentMission.canUsePassOrReload()) {
      return { success: false, error: 'Vous avez déjà utilisé votre action du jour' }
    }

    const user = await User.query()
      .where('id', userId)
      .preload('restaurant')
      .first()

    if (!user?.restaurant?.strategyId) {
      return { success: false, error: 'Configuration manquante' }
    }

    // Find a different template
    const newTemplate = await MissionTemplate.query()
      .where('strategy_id', user.restaurant.strategyId)
      .where('is_active', true)
      .whereNot('id', currentMission.missionTemplateId)
      .orderByRaw('RANDOM()')
      .first()

    if (!newTemplate) {
      return { success: false, error: 'Aucune autre mission disponible' }
    }

    // Update current mission with new template
    currentMission.missionTemplateId = newTemplate.id
    currentMission.usedReload = true
    await currentMission.save()
    await currentMission.load('missionTemplate')

    return { success: true, mission: currentMission }
  }

  /**
   * Complete a mission
   */
  async completeMission(missionId: number, userId: number): Promise<{ success: boolean; error?: string }> {
    const mission = await Mission.query()
      .where('id', missionId)
      .where('user_id', userId)
      .first()

    if (!mission) {
      return { success: false, error: 'Mission introuvable' }
    }

    if (mission.status !== 'pending') {
      return { success: false, error: 'Cette mission a déjà été traitée' }
    }

    mission.status = 'completed'
    mission.completedAt = DateTime.utc()
    await mission.save()

    // Update user's streak and check badges
    const gamificationService = new GamificationService()
    await gamificationService.updateStreak(userId)
    await gamificationService.checkBadgeUnlocks(userId)

    return { success: true }
  }

  /**
   * Get mission history for a user
   */
  async getMissionHistory(userId: number, limit: number = 20): Promise<Mission[]> {
    return Mission.query()
      .where('user_id', userId)
      .preload('missionTemplate')
      .preload('publication')
      .orderBy('assigned_at', 'desc')
      .limit(limit)
  }

  /**
   * Complete a tuto mission when a tutorial is completed
   * Called from TutorialsController when a tutorial is marked as complete
   */
  async completeTutoMission(userId: number, tutorialId: number): Promise<{ success: boolean; missionId?: number }> {
    const today = DateTime.utc().startOf('day')
    const tomorrow = today.plus({ days: 1 })

    // Find today's pending mission that is a tuto mission linked to this tutorial
    const mission = await Mission.query()
      .where('user_id', userId)
      .where('status', 'pending')
      .where('assigned_at', '>=', today.toSQL())
      .where('assigned_at', '<', tomorrow.toSQL())
      .preload('missionTemplate')
      .first()

    if (!mission) {
      return { success: false }
    }

    // Check if this mission is a tuto mission linked to this tutorial
    // Ensure tutorialId is not null/undefined before comparing
    if (
      mission.missionTemplate.type === 'tuto' &&
      mission.missionTemplate.tutorialId !== null &&
      mission.missionTemplate.tutorialId === tutorialId
    ) {
      mission.status = 'completed'
      mission.completedAt = DateTime.utc()
      await mission.save()

      // Update user's streak and check badges
      const gamificationService = new GamificationService()
      await gamificationService.updateStreak(userId)
      await gamificationService.checkBadgeUnlocks(userId)

      return { success: true, missionId: mission.id }
    }

    return { success: false }
  }
}

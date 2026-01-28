import { DateTime } from 'luxon'
import Mission from '#models/mission'
import MissionTemplate from '#models/mission_template'
import TutorialCompletion from '#models/tutorial_completion'
import User from '#models/user'
import GamificationService from '#services/gamification_service'
import StatisticsService from '#services/statistics_service'
import LevelService from '#services/level_service'

export default class MissionService {
  /**
   * Get or create today's missions for a user (3 missions per day)
   * Uses UTC for consistent date handling across timezones
   */
  async getTodayMissions(userId: number): Promise<Mission[]> {
    const today = DateTime.utc().startOf('day')
    const tomorrow = today.plus({ days: 1 })

    // Check if user already has missions for today
    let missions = await Mission.query()
      .where('user_id', userId)
      .where('assigned_at', '>=', today.toSQL())
      .where('assigned_at', '<', tomorrow.toSQL())
      .preload('missionTemplate')
      .orderBy('slot_number', 'asc')

    if (missions.length > 0) {
      return missions
    }

    // No missions for today, prescribe 3 (with race condition protection)
    try {
      return await this.prescribeDailyMissions(userId)
    } catch {
      // If duplicate missions created due to race condition, fetch existing ones
      return Mission.query()
        .where('user_id', userId)
        .where('assigned_at', '>=', today.toSQL())
        .where('assigned_at', '<', tomorrow.toSQL())
        .preload('missionTemplate')
        .orderBy('slot_number', 'asc')
    }
  }

  /**
   * Legacy method for backward compatibility - returns the recommended mission
   */
  async getTodayMission(userId: number): Promise<Mission | null> {
    const missions = await this.getTodayMissions(userId)
    // Return the recommended mission, or the first one
    return missions.find((m) => m.isRecommended) || missions[0] || null
  }

  /**
   * Prescribe 3 daily missions of different types
   * Slot 1: Publication mission (post/story/reel) - recommended on publication days
   * Slot 2: Engagement mission - recommended on non-publication days
   * Slot 3: Tuto or different publication type
   */
  async prescribeDailyMissions(userId: number): Promise<Mission[]> {
    const user = await User.query()
      .where('id', userId)
      .preload('restaurant')
      .first()

    if (!user?.restaurant?.strategyId) {
      return []
    }

    const strategyId = user.restaurant.strategyId
    const publicationRhythm = user.restaurant.publicationRhythm
    const isPublicationDay = this.isPublicationDay(publicationRhythm)

    // Get completed mission template IDs
    const completedMissions = await Mission.query()
      .where('user_id', userId)
      .where('status', 'completed')
      .select('mission_template_id')

    const completedTemplateIds = completedMissions.map((m) => m.missionTemplateId)

    // Get completed tutorial IDs for filtering missions with prerequisites
    const completedTutorials = await TutorialCompletion.query()
      .where('user_id', userId)
      .select('tutorial_id')

    const completedTutorialIds = completedTutorials.map((tc) => tc.tutorialId)

    const usedTemplateIds: number[] = []
    const usedTypes: string[] = []
    const missions: Mission[] = []
    const now = DateTime.utc()

    // Slot 1: Publication mission (post/story/reel)
    const publicationTemplate = await this.selectTemplate(
      strategyId,
      ['post', 'story', 'reel'],
      completedTemplateIds,
      usedTemplateIds,
      usedTypes,
      completedTutorialIds
    )
    if (publicationTemplate) {
      const mission = await Mission.create({
        userId,
        missionTemplateId: publicationTemplate.id,
        status: 'pending',
        assignedAt: now,
        usedPass: false,
        usedReload: false,
        slotNumber: 1,
        isRecommended: isPublicationDay, // Recommended on publication days
      })
      await mission.load('missionTemplate')
      missions.push(mission)
      usedTemplateIds.push(publicationTemplate.id)
      usedTypes.push(publicationTemplate.type)
    }

    // Slot 2: Engagement mission
    const engagementTemplate = await this.selectTemplate(
      strategyId,
      ['engagement'],
      completedTemplateIds,
      usedTemplateIds,
      usedTypes,
      completedTutorialIds
    )
    if (engagementTemplate) {
      const mission = await Mission.create({
        userId,
        missionTemplateId: engagementTemplate.id,
        status: 'pending',
        assignedAt: now,
        usedPass: false,
        usedReload: false,
        slotNumber: 2,
        isRecommended: !isPublicationDay, // Recommended on non-publication days
      })
      await mission.load('missionTemplate')
      missions.push(mission)
      usedTemplateIds.push(engagementTemplate.id)
      usedTypes.push(engagementTemplate.type)
    }

    // Slot 3: Tuto or different publication type
    const thirdTemplate = await this.selectTemplate(
      strategyId,
      ['tuto', 'post', 'story', 'reel'], // Tuto preferred, fallback to other publication types
      completedTemplateIds,
      usedTemplateIds,
      usedTypes,
      completedTutorialIds
    )
    if (thirdTemplate) {
      const mission = await Mission.create({
        userId,
        missionTemplateId: thirdTemplate.id,
        status: 'pending',
        assignedAt: now,
        usedPass: false,
        usedReload: false,
        slotNumber: 3,
        isRecommended: false, // Never recommended
      })
      await mission.load('missionTemplate')
      missions.push(mission)
    }

    return missions
  }

  /**
   * Select a template from preferred types, avoiding already used templates and types
   * Also filters out templates whose required tutorial has not been completed
   */
  private async selectTemplate(
    strategyId: number,
    preferredTypes: string[],
    completedTemplateIds: number[],
    usedTemplateIds: number[],
    usedTypes: string[],
    completedTutorialIds: number[]
  ): Promise<MissionTemplate | null> {
    // Filter out types already used today
    const availableTypes = preferredTypes.filter((t) => !usedTypes.includes(t))

    if (availableTypes.length === 0) {
      return null
    }

    // First try: get a template of available types that hasn't been completed or used today
    const excludeIds = [...completedTemplateIds, ...usedTemplateIds].filter((id) => id > 0)

    let template = await MissionTemplate.query()
      .where('strategy_id', strategyId)
      .where('is_active', true)
      .whereIn('type', availableTypes)
      // Only include templates without prerequisites OR with completed prerequisites
      .where((query) => {
        query.whereNull('required_tutorial_id')
        if (completedTutorialIds.length > 0) {
          query.orWhereIn('required_tutorial_id', completedTutorialIds)
        }
      })
      .if(excludeIds.length > 0, (query) => query.whereNotIn('id', excludeIds))
      .orderByRaw('RANDOM()')
      .first()

    // Fallback: if all templates completed, allow cycling back (but avoid today's used)
    if (!template) {
      template = await MissionTemplate.query()
        .where('strategy_id', strategyId)
        .where('is_active', true)
        .whereIn('type', availableTypes)
        // Still apply prerequisite filter in fallback
        .where((query) => {
          query.whereNull('required_tutorial_id')
          if (completedTutorialIds.length > 0) {
            query.orWhereIn('required_tutorial_id', completedTutorialIds)
          }
        })
        .if(usedTemplateIds.length > 0, (query) => query.whereNotIn('id', usedTemplateIds))
        .orderByRaw('RANDOM()')
        .first()
    }

    return template
  }

  /**
   * Legacy method - create a single mission (for backward compatibility)
   */
  async prescribeDailyMission(userId: number): Promise<Mission | null> {
    const missions = await this.prescribeDailyMissions(userId)
    return missions[0] || null
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
      .preload('missionTemplate')
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
    const streakResult = await gamificationService.updateStreak(userId)
    const newBadges = await gamificationService.checkBadgeUnlocks(userId)

    // Create in-app notification for mission completed
    const InAppNotificationService = (await import('#services/in_app_notification_service')).default
    const inAppService = new InAppNotificationService()

    await inAppService.create({
      userId,
      title: 'Mission accomplie ! 🎉',
      body: `Bravo ! Tu as terminé la mission "${mission.missionTemplate?.title || 'du jour'}"`,
      type: 'mission_completed',
      data: { missionId: mission.id, url: '/missions' },
    })

    // Create streak milestone notification if applicable (every 7 days)
    if (streakResult && streakResult.currentStreak > 0 && streakResult.currentStreak % 7 === 0) {
      await inAppService.create({
        userId,
        title: `${streakResult.currentStreak} jours de suite ! 🔥`,
        body: `Incroyable ! Tu as maintenu ta série pendant ${streakResult.currentStreak} jours consécutifs.`,
        type: 'streak_milestone',
        data: { streak: streakResult.currentStreak },
      })
    }

    // Create notification for each newly unlocked badge
    for (const badge of newBadges) {
      await inAppService.create({
        userId,
        title: `Badge débloqué : ${badge.name} 🏆`,
        body: badge.description || `Tu as débloqué le badge "${badge.name}" !`,
        type: 'badge_earned',
        data: { badgeId: badge.id, badgeSlug: badge.slug },
      })
    }

    // Update daily statistics for evolution tracking
    const statisticsService = new StatisticsService()
    await statisticsService.calculateDailyStats(userId)

    // Add XP for mission completion
    const levelService = new LevelService()
    await levelService.addXp(userId, 'mission_completed')

    // Award extra XP for streak milestones
    if (streakResult && streakResult.currentStreak > 0) {
      await levelService.addXp(userId, 'streak_day')
      if (streakResult.currentStreak % 7 === 0) {
        await levelService.addXp(userId, 'weekly_streak')
      }
    }

    // Award XP for badges earned
    for (const _badge of newBadges) {
      await levelService.addXp(userId, 'badge_earned')
    }

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
   * Get planned future publication days based on rhythm
   * Returns dates for the next N days where missions would be assigned
   */
  getPlannedMissionDays(rhythm: string | null, daysAhead: number = 30): DateTime[] {
    const plannedDays: DateTime[] = []
    const today = DateTime.utc().startOf('day')

    for (let i = 1; i <= daysAhead; i++) {
      const futureDay = today.plus({ days: i })
      if (this.wouldHaveMissionOn(rhythm, futureDay)) {
        plannedDays.push(futureDay)
      }
    }

    return plannedDays
  }

  /**
   * Check if a specific date would have a mission based on rhythm
   */
  private wouldHaveMissionOn(rhythm: string | null, date: DateTime): boolean {
    if (!rhythm) return true

    const dayOfWeek = date.weekday // 1 = Monday, 7 = Sunday

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

      // Update daily statistics for evolution tracking
      const statisticsService = new StatisticsService()
      await statisticsService.calculateDailyStats(userId)

      return { success: true, missionId: mission.id }
    }

    return { success: false }
  }
}

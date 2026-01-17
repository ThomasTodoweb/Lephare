import { DateTime } from 'luxon'
import Streak from '#models/streak'
import Badge from '#models/badge'
import BadgeUnlock from '#models/badge_unlock'
import Mission from '#models/mission'
import TutorialCompletion from '#models/tutorial_completion'

export default class GamificationService {
  /**
   * Update streak when user completes activity (mission/tutorial)
   * Increments streak if activity is on same day or consecutive day
   * Resets streak if more than one day has passed
   */
  async updateStreak(userId: number): Promise<Streak> {
    const today = DateTime.utc().startOf('day')

    let streak = await Streak.query().where('user_id', userId).first()

    if (!streak) {
      // Create new streak record
      streak = await Streak.create({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      })
      return streak
    }

    const lastActivity = streak.lastActivityDate
      ? DateTime.fromJSDate(streak.lastActivityDate.toJSDate()).startOf('day')
      : null

    if (!lastActivity) {
      // First activity ever
      streak.currentStreak = 1
      streak.longestStreak = Math.max(streak.longestStreak, 1)
      streak.lastActivityDate = today
    } else {
      const daysDiff = Math.floor(today.diff(lastActivity, 'days').days)

      if (daysDiff === 0) {
        // Same day - no streak change
        // Already counted for today
      } else if (daysDiff === 1) {
        // Consecutive day - increment streak
        streak.currentStreak += 1
        streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak)
        streak.lastActivityDate = today
      } else {
        // Streak broken - reset to 1
        streak.currentStreak = 1
        streak.lastActivityDate = today
      }
    }

    await streak.save()
    return streak
  }

  /**
   * Check if streak should be reset due to inactivity
   * Called daily to update broken streaks
   */
  async checkStreakReset(userId: number): Promise<boolean> {
    const streak = await Streak.query().where('user_id', userId).first()

    if (!streak || !streak.lastActivityDate) {
      return false
    }

    const today = DateTime.utc().startOf('day')
    const lastActivity = DateTime.fromJSDate(streak.lastActivityDate.toJSDate()).startOf('day')
    const daysDiff = Math.floor(today.diff(lastActivity, 'days').days)

    if (daysDiff > 1 && streak.currentStreak > 0) {
      // More than one day has passed - streak is broken
      streak.currentStreak = 0
      await streak.save()
      return true
    }

    return false
  }

  /**
   * Get streak information for a user
   */
  async getStreakInfo(
    userId: number
  ): Promise<{ currentStreak: number; longestStreak: number; isAtRisk: boolean }> {
    const streak = await Streak.query().where('user_id', userId).first()

    if (!streak) {
      return { currentStreak: 0, longestStreak: 0, isAtRisk: false }
    }

    // Check if streak is at risk (no activity today and has active streak)
    const today = DateTime.utc().startOf('day')
    const lastActivity = streak.lastActivityDate
      ? DateTime.fromJSDate(streak.lastActivityDate.toJSDate()).startOf('day')
      : null

    const isAtRisk =
      streak.currentStreak > 0 && lastActivity !== null && !lastActivity.equals(today)

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      isAtRisk,
    }
  }

  /**
   * Get encouragement message based on streak
   */
  getStreakEncouragement(currentStreak: number, isAtRisk: boolean): string {
    if (isAtRisk) {
      return 'Fais ta mission pour garder ton streak ! 🔥'
    }

    if (currentStreak === 0) {
      return 'Commence ta série dès maintenant !'
    }

    if (currentStreak === 1) {
      return 'Premier jour, c\'est parti ! 💪'
    }

    if (currentStreak <= 3) {
      return `${currentStreak} jours de suite, continue comme ça !`
    }

    if (currentStreak <= 7) {
      return `${currentStreak} jours de suite, tu es en feu ! 🔥`
    }

    if (currentStreak <= 14) {
      return `${currentStreak} jours, tu es un chef ! 👨‍🍳`
    }

    if (currentStreak <= 30) {
      return `${currentStreak} jours, incroyable régularité ! ⭐`
    }

    return `${currentStreak} jours, tu es une légende ! 🏆`
  }

  /**
   * Check and unlock badges for a user based on their current stats
   * Returns array of newly unlocked badges
   */
  async checkBadgeUnlocks(userId: number): Promise<Badge[]> {
    const newlyUnlocked: Badge[] = []

    // Get all active badges
    const badges = await Badge.query().where('is_active', true).orderBy('order', 'asc')

    // Get user's already unlocked badges
    const unlockedBadgeIds = (await BadgeUnlock.query().where('user_id', userId).select('badge_id')).map(
      (u) => u.badgeId
    )

    // Get user stats
    const stats = await this.getUserStats(userId)

    for (const badge of badges) {
      // Skip if already unlocked
      if (unlockedBadgeIds.includes(badge.id)) {
        continue
      }

      // Check if user meets the criteria
      let meetsCondition = false

      switch (badge.criteriaType) {
        case 'missions_completed':
          meetsCondition = stats.missionsCompleted >= badge.criteriaValue
          break
        case 'streak_days':
          meetsCondition = stats.longestStreak >= badge.criteriaValue
          break
        case 'tutorials_viewed':
          meetsCondition = stats.tutorialsViewed >= badge.criteriaValue
          break
      }

      if (meetsCondition) {
        // Unlock the badge
        await BadgeUnlock.create({
          userId,
          badgeId: badge.id,
          unlockedAt: DateTime.utc(),
        })
        newlyUnlocked.push(badge)
      }
    }

    return newlyUnlocked
  }

  /**
   * Get user's statistics for badge evaluation
   */
  private async getUserStats(
    userId: number
  ): Promise<{ missionsCompleted: number; longestStreak: number; tutorialsViewed: number }> {
    // Count completed missions
    const missionsCompleted = await Mission.query()
      .where('user_id', userId)
      .where('status', 'completed')
      .count('* as total')
      .first()

    // Get longest streak
    const streak = await Streak.query().where('user_id', userId).first()

    // Count tutorials viewed
    const tutorialsViewed = await TutorialCompletion.query()
      .where('user_id', userId)
      .count('* as total')
      .first()

    return {
      missionsCompleted: Number(missionsCompleted?.$extras.total || 0),
      longestStreak: streak?.longestStreak || 0,
      tutorialsViewed: Number(tutorialsViewed?.$extras.total || 0),
    }
  }

  /**
   * Get all badges with unlock status for a user
   */
  async getUserBadges(
    userId: number
  ): Promise<Array<{ badge: Badge; unlocked: boolean; unlockedAt: DateTime | null }>> {
    const badges = await Badge.query().where('is_active', true).orderBy('order', 'asc')

    const unlocks = await BadgeUnlock.query().where('user_id', userId)
    const unlocksMap = new Map(unlocks.map((u) => [u.badgeId, u.unlockedAt]))

    return badges.map((badge) => ({
      badge,
      unlocked: unlocksMap.has(badge.id),
      unlockedAt: unlocksMap.get(badge.id) || null,
    }))
  }
}

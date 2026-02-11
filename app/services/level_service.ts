import User from '#models/user'
import LevelThreshold from '#models/level_threshold'
import XpAction, { type XpActionType } from '#models/xp_action'
import InAppNotification from '#models/in_app_notification'
import PushService from '#services/push_service'

export interface LevelInfo {
  xpTotal: number
  currentLevel: number
  levelName: string
  levelIcon: string
  xpForNextLevel: number
  xpProgressInLevel: number
  progressPercent: number
  isMaxLevel: boolean
}

export interface LevelUpResult {
  leveledUp: boolean
  newLevel: number | null
  newLevelName: string | null
  newLevelIcon: string | null
}

export default class LevelService {
  /**
   * Add XP to user for a specific action
   */
  async addXp(userId: number, actionType: XpActionType): Promise<{ xpAdded: number; levelUp: LevelUpResult }> {
    const xpAction = await XpAction.query()
      .where('action_type', actionType)
      .where('is_active', true)
      .first()

    if (!xpAction) {
      return { xpAdded: 0, levelUp: { leveledUp: false, newLevel: null, newLevelName: null, newLevelIcon: null } }
    }

    const user = await User.find(userId)
    if (!user) {
      return { xpAdded: 0, levelUp: { leveledUp: false, newLevel: null, newLevelName: null, newLevelIcon: null } }
    }

    // Add XP
    user.xpTotal = (user.xpTotal || 0) + xpAction.xpAmount
    await user.save()

    // Check for level up
    const levelUp = await this.checkLevelUp(userId)

    return { xpAdded: xpAction.xpAmount, levelUp }
  }

  /**
   * Check if user should level up and apply if needed
   */
  async checkLevelUp(userId: number): Promise<LevelUpResult> {
    const user = await User.find(userId)
    if (!user) {
      return { leveledUp: false, newLevel: null, newLevelName: null, newLevelIcon: null }
    }

    // Get all level thresholds ordered by level
    const thresholds = await LevelThreshold.query().orderBy('level', 'asc')

    // Find the highest level the user qualifies for
    let newLevel = user.currentLevel || 1
    let newThreshold: LevelThreshold | null = null

    for (const threshold of thresholds) {
      if (user.xpTotal >= threshold.xpRequired) {
        newLevel = threshold.level
        newThreshold = threshold
      }
    }

    // Check if level increased
    if (newLevel > (user.currentLevel || 1)) {

      user.currentLevel = newLevel
      await user.save()

      // Send notifications
      if (newThreshold) {
        await this.sendLevelUpNotifications(userId, newLevel, newThreshold.name || `Niveau ${newLevel}`, newThreshold.icon || '⭐')
      }

      return {
        leveledUp: true,
        newLevel,
        newLevelName: newThreshold?.name || `Niveau ${newLevel}`,
        newLevelIcon: newThreshold?.icon || '⭐',
      }
    }

    return { leveledUp: false, newLevel: null, newLevelName: null, newLevelIcon: null }
  }

  /**
   * Get level info for a user
   */
  async getLevelInfo(userId: number): Promise<LevelInfo> {
    const user = await User.find(userId)
    if (!user) {
      return {
        xpTotal: 0,
        currentLevel: 1,
        levelName: 'Débutant',
        levelIcon: '🌱',
        xpForNextLevel: 50,
        xpProgressInLevel: 0,
        progressPercent: 0,
        isMaxLevel: false,
      }
    }

    const xpTotal = user.xpTotal || 0
    const currentLevel = user.currentLevel || 1

    // Get current and next level thresholds
    const currentThreshold = await LevelThreshold.query().where('level', currentLevel).first()
    const nextThreshold = await LevelThreshold.query().where('level', currentLevel + 1).first()

    const levelName = currentThreshold?.name || `Niveau ${currentLevel}`
    const levelIcon = currentThreshold?.icon || '⭐'
    const currentLevelXp = currentThreshold?.xpRequired || 0
    const isMaxLevel = !nextThreshold

    if (isMaxLevel) {
      return {
        xpTotal,
        currentLevel,
        levelName,
        levelIcon,
        xpForNextLevel: 0,
        xpProgressInLevel: 0,
        progressPercent: 100,
        isMaxLevel: true,
      }
    }

    const nextLevelXp = nextThreshold!.xpRequired
    const xpInLevel = Math.max(0, xpTotal - currentLevelXp)
    const xpNeededForNextLevel = nextLevelXp - currentLevelXp
    const progressPercent = xpNeededForNextLevel > 0
      ? Math.min(100, Math.max(0, Math.round((xpInLevel / xpNeededForNextLevel) * 100)))
      : 0

    return {
      xpTotal,
      currentLevel,
      levelName,
      levelIcon,
      xpForNextLevel: nextLevelXp - xpTotal,
      xpProgressInLevel: xpInLevel,
      progressPercent,
      isMaxLevel: false,
    }
  }

  /**
   * Send level up notifications (in-app + push)
   */
  private async sendLevelUpNotifications(userId: number, level: number, levelName: string, levelIcon: string) {
    // Create in-app notification
    await InAppNotification.create({
      userId,
      type: 'level_up',
      title: `${levelIcon} Bravo ! Tu passes au ${levelName} !`,
      body: `Tu es maintenant niveau ${level}. Continue comme ça !`,
      data: { level, levelName, levelIcon },
    })

    // Send push notification
    const pushService = new PushService()
    await pushService.sendToUser(userId, {
      title: `${levelIcon} Niveau ${level} débloqué !`,
      body: `Bravo ! Tu passes au ${levelName} !`,
      url: '/dashboard',
      type: 'level_up',
    })
  }

  /**
   * Get all level thresholds for display
   */
  async getAllLevels(): Promise<LevelThreshold[]> {
    return LevelThreshold.query().orderBy('level', 'asc')
  }

  /**
   * Get all XP actions for display
   */
  async getAllXpActions(): Promise<XpAction[]> {
    return XpAction.query().orderBy('xp_amount', 'desc')
  }
}

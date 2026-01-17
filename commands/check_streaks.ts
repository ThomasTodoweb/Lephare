import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import Streak from '#models/streak'
import GamificationService from '#services/gamification_service'

export default class CheckStreaks extends BaseCommand {
  static commandName = 'streaks:check'
  static description = 'Check and reset broken streaks for all users'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Checking for broken streaks...')

    // Get all streaks
    const streaks = await Streak.query().where('current_streak', '>', 0)

    if (streaks.length === 0) {
      this.logger.info('No active streaks found')
      return
    }

    this.logger.info(`Found ${streaks.length} active streaks to check`)

    const gamificationService = new GamificationService()
    let reset = 0

    for (const streak of streaks) {
      const wasReset = await gamificationService.checkStreakReset(streak.userId)
      if (wasReset) {
        reset++
        this.logger.info(`Reset streak for user ${streak.userId}`)
      }
    }

    this.logger.success(`Checked ${streaks.length} streaks, reset ${reset}`)
  }
}

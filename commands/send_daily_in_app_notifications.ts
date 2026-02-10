import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import User from '#models/user'
import MissionService from '#services/mission_service'
import InAppNotificationService from '#services/in_app_notification_service'

export default class SendDailyInAppNotifications extends BaseCommand {
  static commandName = 'notifications:send-daily-in-app'
  static description = 'Send daily in-app notifications based on mission template notification time or user default'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const currentTime = DateTime.now().setZone('Europe/Paris').toFormat('HH:mm')
    this.logger.info(`Checking for in-app notifications at ${currentTime} (Europe/Paris)`)

    // Get all users with completed onboarding
    const users = await User.query()
      .whereHas('restaurant', (query) => {
        query.where('onboarding_completed', true)
      })

    if (users.length === 0) {
      this.logger.info('No eligible users found')
      return
    }

    this.logger.info(`Found ${users.length} eligible users for in-app notifications`)

    const missionService = new MissionService()
    const inAppService = new InAppNotificationService()
    let created = 0
    let skipped = 0

    for (const user of users) {
      try {
        // Get/create today's missions and find the recommended pending one
        const missions = await missionService.getTodayMissions(user.id)
        const recommended = missions.find((m) => m.isRecommended && m.status === 'pending')

        if (!recommended) {
          skipped++
          continue
        }

        // Resolve effective notification time:
        // template override > user's email notification time (used as default for in-app too)
        const effectiveTime = recommended.missionTemplate.notificationTime || user.emailNotificationTime

        if (effectiveTime !== currentTime) {
          skipped++
          continue
        }

        // Create in-app notification
        await inAppService.create({
          userId: user.id,
          title: 'Mission du jour 🔔',
          body: recommended.missionTemplate.title,
          type: 'mission_reminder',
          data: { missionId: recommended.id, url: '/missions' },
        })
        created++
        this.logger.info(`Created in-app notification for user ${user.id}`)
      } catch (error) {
        this.logger.error(`Error creating in-app notification for user ${user.id}: ${error}`)
      }
    }

    this.logger.success(`In-app notifications - created: ${created}, skipped: ${skipped}`)
  }
}

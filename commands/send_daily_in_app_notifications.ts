import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import User from '#models/user'
import MissionService from '#services/mission_service'
import InAppNotificationService from '#services/in_app_notification_service'

export default class SendDailyInAppNotifications extends BaseCommand {
  static commandName = 'notifications:send-daily-in-app'
  static description = 'Send daily in-app notifications to all users with pending missions'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const currentTime = DateTime.now().setZone('Europe/Paris').toFormat('HH:mm')
    this.logger.info(`Checking for in-app notifications scheduled at ${currentTime} (Europe/Paris)`)

    // Get all users who have email notifications enabled at this time
    // This serves as the notification time for in-app notifications too
    const users = await User.query()
      .where('email_notification_time', currentTime)
      .whereHas('restaurant', (query) => {
        query.where('onboarding_completed', true)
      })

    if (users.length === 0) {
      this.logger.info('No users found for this time slot')
      return
    }

    this.logger.info(`Found ${users.length} users to check for in-app notifications`)

    const missionService = new MissionService()
    const inAppService = new InAppNotificationService()
    let created = 0
    let skipped = 0

    for (const user of users) {
      try {
        // Check if user has a pending mission today
        const mission = await missionService.getTodayMission(user.id)

        if (mission && mission.status === 'pending') {
          // Create in-app notification
          await inAppService.create({
            userId: user.id,
            title: 'Mission du jour 🔥',
            body: mission.missionTemplate.title,
            type: 'mission_reminder',
            data: { missionId: mission.id, url: '/missions' },
          })
          created++
          this.logger.info(`Created in-app notification for user ${user.id}`)
        } else {
          skipped++
        }
      } catch (error) {
        this.logger.error(`Error creating in-app notification for user ${user.id}: ${error}`)
      }
    }

    this.logger.success(`In-app notifications created: ${created}, skipped (no pending mission): ${skipped}`)
  }
}

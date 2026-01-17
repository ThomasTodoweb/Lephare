import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import PushService from '#services/push_service'
import MissionService from '#services/mission_service'

export default class SendDailyNotifications extends BaseCommand {
  static commandName = 'notifications:send-daily'
  static description = 'Send daily push notifications to users based on their reminder time'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const pushService = new PushService()

    if (!pushService.isConfigured()) {
      this.logger.warning('Push notifications not configured (missing VAPID keys)')
      return
    }

    // Get current time in HH:MM format (UTC)
    const currentTime = DateTime.utc().toFormat('HH:mm')
    this.logger.info(`Checking for notifications scheduled at ${currentTime} UTC`)

    // Get all subscriptions for this reminder time
    const subscriptions = await pushService.getSubscriptionsByReminderTime(currentTime)

    if (subscriptions.length === 0) {
      this.logger.info('No subscriptions found for this time slot')
      return
    }

    this.logger.info(`Found ${subscriptions.length} subscriptions to notify`)

    const missionService = new MissionService()
    let sent = 0
    let failed = 0

    for (const sub of subscriptions) {
      try {
        // Check if user has a pending mission today
        const mission = await missionService.getTodayMission(sub.userId)

        if (mission && mission.status === 'pending') {
          const result = await pushService.sendToUser(sub.userId, {
            title: 'Mission du jour 🔥',
            body: mission.missionTemplate.title,
            url: '/missions',
          })

          sent += result.sent
          failed += result.failed
        }
      } catch (error) {
        this.logger.error(`Error sending notification to user ${sub.userId}: ${error}`)
        failed++
      }
    }

    this.logger.success(`Notifications sent: ${sent}, failed: ${failed}`)
  }
}

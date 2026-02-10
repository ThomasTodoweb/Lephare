import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import PushService from '#services/push_service'
import MissionService from '#services/mission_service'
import PushSubscription from '#models/push_subscription'

export default class SendDailyNotifications extends BaseCommand {
  static commandName = 'notifications:send-daily'
  static description = 'Send daily push notifications based on mission template notification time or user default'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const pushService = new PushService()

    if (!pushService.isConfigured()) {
      this.logger.warning('Push notifications not configured (missing VAPID keys)')
      return
    }

    // Get current time in HH:MM format (Paris timezone - all users are in France)
    const currentTime = DateTime.now().setZone('Europe/Paris').toFormat('HH:mm')
    this.logger.info(`Checking for push notifications at ${currentTime} (Europe/Paris)`)

    // Get all active push subscriptions
    const subscriptions = await PushSubscription.query()
      .where('is_active', true)

    if (subscriptions.length === 0) {
      this.logger.info('No active subscriptions found')
      return
    }

    // Group subscriptions by userId to avoid processing same user twice
    const userSubMap = new Map<number, (typeof subscriptions)[0]>()
    for (const sub of subscriptions) {
      if (!userSubMap.has(sub.userId)) {
        userSubMap.set(sub.userId, sub)
      }
    }

    this.logger.info(`Found ${userSubMap.size} unique users with active subscriptions`)

    const missionService = new MissionService()
    let sent = 0
    let failed = 0
    let skipped = 0

    for (const [userId, sub] of userSubMap) {
      try {
        // Get/create today's missions and find the recommended pending one
        const missions = await missionService.getTodayMissions(userId)
        const recommended = missions.find((m) => m.isRecommended && m.status === 'pending')

        if (!recommended) {
          skipped++
          continue
        }

        // Resolve effective notification time:
        // template override > user's push reminder time
        const effectiveTime = recommended.missionTemplate.notificationTime || sub.reminderTime

        if (effectiveTime !== currentTime) {
          skipped++
          continue
        }

        const result = await pushService.sendToUser(userId, {
          title: 'Mission du jour 🔥',
          body: recommended.missionTemplate.title,
          url: '/missions',
          type: 'mission_reminder',
          data: { missionId: recommended.id },
          createInApp: false, // In-app handled by separate cron
        })

        sent += result.sent
        failed += result.failed
      } catch (error) {
        this.logger.error(`Error sending notification to user ${userId}: ${error}`)
        failed++
      }
    }

    this.logger.success(`Push notifications - sent: ${sent}, failed: ${failed}, skipped: ${skipped}`)
  }
}

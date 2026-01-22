import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import EmailService from '#services/email_service'
import EmailSettings from '#models/email_settings'
import MissionService from '#services/mission_service'
import User from '#models/user'

export default class SendDailyEmailNotifications extends BaseCommand {
  static commandName = 'notifications:send-daily-emails'
  static description = 'Send daily email notifications to users based on their notification time'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const emailService = new EmailService()
    const settings = await EmailSettings.getSettings()

    if (!settings.emailsEnabled || !settings.dailyMissionEmailEnabled) {
      this.logger.warning('Daily mission emails are disabled')
      return
    }

    if (!(await emailService.isConfigured())) {
      this.logger.warning('Email service not configured')
      return
    }

    // Get current time in HH:MM format (Paris timezone - all users are in France)
    const currentTime = DateTime.now().setZone('Europe/Paris').toFormat('HH:mm')
    this.logger.info(`Checking for email notifications scheduled at ${currentTime} (Europe/Paris)`)

    // Get users who want email notifications at this time
    // Check both legacy toggle and granular preference
    const users = await User.query()
      .where('email_verified', true)
      .where('email_notifications_enabled', true)
      .where('email_daily_mission_enabled', true)
      .where('email_notification_time', currentTime)
      .preload('restaurant')

    if (users.length === 0) {
      this.logger.info('No users found for this time slot')
      return
    }

    this.logger.info(`Found ${users.length} users to notify by email`)

    const missionService = new MissionService()
    let sent = 0
    let failed = 0

    for (const user of users) {
      try {
        // Get all today's missions and find a pending one
        const missions = await missionService.getTodayMissions(user.id)
        const pendingMission = missions.find((m) => m.status === 'pending')

        if (pendingMission) {
          const mission = pendingMission
          const template = mission.missionTemplate
          const success = await emailService.sendDailyMissionEmail(
            user.email,
            {
              title: template.title,
              description: template.contentIdea,
              category: template.type,
            },
            user.fullName || undefined,
            user.restaurant?.name || undefined
          )

          if (success) {
            this.logger.info(`Email sent to ${user.email} for mission: ${mission.missionTemplate.title}`)
            sent++
          } else {
            this.logger.warning(`Failed to send email to ${user.email}`)
            failed++
          }
        } else {
          this.logger.info(`User ${user.id} has no pending missions today (found ${missions.length} missions)`)
        }
      } catch (error) {
        this.logger.error(`Error sending email to user ${user.id}: ${error}`)
        failed++
      }
    }

    this.logger.success(`Email notifications sent: ${sent}, failed: ${failed}`)
  }
}

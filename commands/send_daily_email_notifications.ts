import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import EmailService from '#services/email_service'
import EmailSettings from '#models/email_settings'
import MissionService from '#services/mission_service'
import User from '#models/user'

export default class SendDailyEmailNotifications extends BaseCommand {
  static commandName = 'notifications:send-daily-emails'
  static description = 'Send daily email notifications based on mission template notification time or user default'

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
    this.logger.info(`Checking for email notifications at ${currentTime} (Europe/Paris)`)

    // Get all users eligible for email notifications
    const users = await User.query()
      .where('email_verified', true)
      .where('email_notifications_enabled', true)
      .where('email_daily_mission_enabled', true)
      .preload('restaurant')

    if (users.length === 0) {
      this.logger.info('No eligible users found')
      return
    }

    this.logger.info(`Found ${users.length} eligible users for email notifications`)

    const missionService = new MissionService()
    let sent = 0
    let failed = 0
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
        // template override > user's email notification time
        const effectiveTime = recommended.missionTemplate.notificationTime || user.emailNotificationTime

        if (effectiveTime !== currentTime) {
          skipped++
          continue
        }

        const template = recommended.missionTemplate
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
          this.logger.info(`Email sent to ${user.email} for mission: ${template.title}`)
          sent++
        } else {
          this.logger.warning(`Failed to send email to ${user.email}`)
          failed++
        }
      } catch (error) {
        this.logger.error(`Error sending email to user ${user.id}: ${error}`)
        failed++
      }
    }

    this.logger.success(`Email notifications - sent: ${sent}, failed: ${failed}, skipped: ${skipped}`)
  }
}

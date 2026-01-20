import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type EmailProvider = 'smtp' | 'resend'

export default class EmailSettings extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  // SMTP Configuration
  @column()
  declare smtpHost: string

  @column()
  declare smtpPort: number

  @column()
  declare smtpSecure: boolean

  @column()
  declare smtpUser: string

  @column({ serializeAs: null })
  declare smtpPassword: string

  @column()
  declare fromEmail: string

  @column()
  declare fromName: string

  // Resend API
  @column({ serializeAs: null })
  declare resendApiKey: string

  @column()
  declare provider: EmailProvider

  // Global settings
  @column()
  declare emailsEnabled: boolean

  @column()
  declare verificationEmailEnabled: boolean

  @column()
  declare dailyMissionEmailEnabled: boolean

  @column()
  declare dailyMissionEmailTime: string

  // Email subjects
  @column()
  declare welcomeEmailSubject: string

  @column()
  declare verificationEmailSubject: string

  @column()
  declare passwordResetEmailSubject: string

  @column()
  declare dailyMissionEmailSubject: string

  // Email template contents (editable from admin)
  @column()
  declare verificationEmailContent: string

  @column()
  declare welcomeEmailContent: string

  @column()
  declare passwordResetEmailContent: string

  @column()
  declare dailyMissionEmailContent: string

  // Account changes email
  @column()
  declare accountChangesEmailEnabled: boolean

  @column()
  declare accountChangesEmailSubject: string

  @column()
  declare accountChangesEmailContent: string

  // Weekly summary email
  @column()
  declare weeklySummaryEmailEnabled: boolean

  @column()
  declare weeklySummaryEmailSubject: string

  @column()
  declare weeklySummaryEmailContent: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Get the singleton settings instance
   */
  static async getSettings(): Promise<EmailSettings> {
    let settings = await EmailSettings.find(1)
    if (!settings) {
      settings = await EmailSettings.create({ id: 1 })
    }
    return settings
  }
}

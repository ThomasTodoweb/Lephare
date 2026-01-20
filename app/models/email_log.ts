import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export type EmailStatus = 'pending' | 'sent' | 'failed' | 'bounced' | 'complained'
export type EmailType = 'verification' | 'welcome' | 'password_reset' | 'daily_mission' | 'test'

export default class EmailLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  // Recipient info
  @column()
  declare toEmail: string

  @column()
  declare toName: string | null

  // Email details
  @column()
  declare subject: string

  @column()
  declare emailType: EmailType

  @column()
  declare provider: string

  // Status tracking
  @column()
  declare status: EmailStatus

  @column()
  declare errorMessage: string | null

  @column()
  declare errorCode: string | null

  // Provider response
  @column()
  declare providerMessageId: string | null

  @column()
  declare providerResponse: Record<string, unknown> | null

  // Related entities
  @column()
  declare userId: number | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  // Timestamps
  @column.dateTime()
  declare sentAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Get status label in French
   */
  get statusLabel(): string {
    const labels: Record<EmailStatus, string> = {
      pending: 'En attente',
      sent: 'Envoyé',
      failed: 'Échec',
      bounced: 'Rejeté',
      complained: 'Signalé spam',
    }
    return labels[this.status] || this.status
  }

  /**
   * Get email type label in French
   */
  get emailTypeLabel(): string {
    const labels: Record<EmailType, string> = {
      verification: 'Vérification email',
      welcome: 'Bienvenue',
      password_reset: 'Réinitialisation MDP',
      daily_mission: 'Mission quotidienne',
      test: 'Test',
    }
    return labels[this.emailType] || this.emailType
  }

  /**
   * Get CSS class for status badge
   */
  get statusClass(): string {
    const classes: Record<EmailStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      bounced: 'bg-orange-100 text-orange-800',
      complained: 'bg-purple-100 text-purple-800',
    }
    return classes[this.status] || 'bg-gray-100 text-gray-800'
  }
}

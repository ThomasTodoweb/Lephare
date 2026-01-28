import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export type NotificationType =
  | 'mission_reminder'
  | 'mission_completed'
  | 'streak_milestone'
  | 'badge_earned'
  | 'level_up'
  | 'weekly_summary'
  | 'general'

export default class InAppNotification extends BaseModel {
  static table = 'in_app_notifications'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare title: string

  @column()
  declare body: string

  @column()
  declare type: NotificationType

  @column({
    prepare: (value: Record<string, unknown> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | object | null) => {
      if (!value) return null
      // PostgreSQL JSONB returns object directly, string needs parsing
      if (typeof value === 'string') return JSON.parse(value)
      return value
    },
  })
  declare data: Record<string, unknown> | null

  @column.dateTime()
  declare readAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  get isRead(): boolean {
    return this.readAt !== null
  }
}

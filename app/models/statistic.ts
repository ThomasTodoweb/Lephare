import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export type MetricType =
  | 'posts_count'
  | 'stories_count'
  | 'reels_count'
  | 'tutorials_viewed'
  | 'missions_completed'
  | 'streak_max'

export default class Statistic extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare metricType: MetricType

  @column()
  declare value: number

  @column.date()
  declare recordedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

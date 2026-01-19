import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class InstagramStat extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  // Follower metrics
  @column()
  declare followersCount: number

  @column()
  declare followersGrowthDaily: number

  @column()
  declare followersGrowthWeekly: number

  @column()
  declare followersGrowthMonthly: number

  // Engagement metrics
  @column()
  declare totalImpressions: number

  @column()
  declare totalReach: number

  @column()
  declare totalLikes: number

  @column()
  declare totalComments: number

  @column()
  declare totalShares: number

  @column()
  declare totalSaves: number

  @column()
  declare averageEngagementRate: number

  // Post count
  @column()
  declare postsCount: number

  // Period tracking
  @column.date()
  declare recordedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

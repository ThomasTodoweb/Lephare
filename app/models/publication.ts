import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Mission from './mission.js'

export type PublicationStatus = 'draft' | 'pending' | 'published' | 'failed'

export default class Publication extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare missionId: number | null

  @column()
  declare imagePath: string

  @column()
  declare caption: string

  @column()
  declare aiGeneratedCaption: string | null

  @column()
  declare status: PublicationStatus

  @column()
  declare laterMediaId: string | null

  @column()
  declare instagramPostId: string | null

  @column.dateTime()
  declare publishedAt: DateTime | null

  @column()
  declare errorMessage: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Mission)
  declare mission: BelongsTo<typeof Mission>
}

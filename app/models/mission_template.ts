import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Strategy from './strategy.js'
import Mission from './mission.js'
import ContentIdea from './content_idea.js'
import Tutorial from './tutorial.js'

export type MissionType = 'post' | 'story' | 'reel' | 'tuto'

export default class MissionTemplate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare strategyId: number

  @column()
  declare type: MissionType

  @column()
  declare title: string

  @column()
  declare contentIdea: string

  @column()
  declare order: number

  @column()
  declare isActive: boolean

  @column()
  declare tutorialId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Strategy)
  declare strategy: BelongsTo<typeof Strategy>

  @hasMany(() => Mission)
  declare missions: HasMany<typeof Mission>

  @hasMany(() => ContentIdea)
  declare contentIdeas: HasMany<typeof ContentIdea>

  @belongsTo(() => Tutorial)
  declare tutorial: BelongsTo<typeof Tutorial>
}

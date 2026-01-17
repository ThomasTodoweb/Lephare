import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import MissionTemplate from './mission_template.js'

export default class ContentIdea extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare missionTemplateId: number

  @column()
  declare suggestionText: string

  @column()
  declare photoTips: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => MissionTemplate)
  declare missionTemplate: BelongsTo<typeof MissionTemplate>
}

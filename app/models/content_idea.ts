import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import MissionTemplate from './mission_template.js'
import type { RestaurantType } from './restaurant.js'

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

  /**
   * Restaurant types this idea applies to.
   * If null or empty, applies to ALL restaurant types.
   */
  @column({
    prepare: (value: RestaurantType[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare restaurantTags: RestaurantType[] | null

  /**
   * Path to example media file (image or video) for visual inspiration
   */
  @column()
  declare exampleMediaPath: string | null

  /**
   * Type of example media: 'image' or 'video'
   */
  @column()
  declare exampleMediaType: 'image' | 'video' | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => MissionTemplate)
  declare missionTemplate: BelongsTo<typeof MissionTemplate>
}

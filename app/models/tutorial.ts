import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import TutorialCategory from './tutorial_category.js'
import TutorialCompletion from './tutorial_completion.js'

export default class Tutorial extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare categoryId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare videoUrl: string | null

  @column()
  declare contentText: string | null

  @column()
  declare durationMinutes: number

  @column()
  declare order: number

  @column()
  declare isActive: boolean

  @column()
  declare requiredLevel: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => TutorialCategory, { foreignKey: 'categoryId' })
  declare category: BelongsTo<typeof TutorialCategory>

  @hasMany(() => TutorialCompletion)
  declare completions: HasMany<typeof TutorialCompletion>
}

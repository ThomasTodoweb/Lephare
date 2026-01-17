import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Tutorial from './tutorial.js'

export type TutorialFeedback = 'useful' | 'not_useful'

export default class TutorialCompletion extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare tutorialId: number

  @column.dateTime()
  declare completedAt: DateTime

  @column()
  declare feedback: TutorialFeedback | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Tutorial)
  declare tutorial: BelongsTo<typeof Tutorial>
}

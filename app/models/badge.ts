import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import BadgeUnlock from './badge_unlock.js'

export type BadgeCriteriaType = 'missions_completed' | 'streak_days' | 'tutorials_viewed'

export default class Badge extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare icon: string

  @column()
  declare criteriaType: BadgeCriteriaType

  @column()
  declare criteriaValue: number

  @column()
  declare order: number

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => BadgeUnlock)
  declare unlocks: HasMany<typeof BadgeUnlock>
}

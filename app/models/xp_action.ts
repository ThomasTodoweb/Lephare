import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type XpActionType =
  | 'mission_completed'
  | 'tutorial_completed'
  | 'streak_day'
  | 'first_mission'
  | 'first_tutorial'
  | 'weekly_streak'
  | 'badge_earned'

export default class XpAction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare actionType: XpActionType

  @column()
  declare xpAmount: number

  @column()
  declare description: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

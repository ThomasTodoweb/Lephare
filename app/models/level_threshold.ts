import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class LevelThreshold extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare level: number

  @column()
  declare xpRequired: number

  @column()
  declare name: string | null

  @column()
  declare icon: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

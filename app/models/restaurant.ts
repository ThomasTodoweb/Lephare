import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export type RestaurantType =
  | 'brasserie'
  | 'gastronomique'
  | 'fast_food'
  | 'pizzeria'
  | 'cafe_bar'
  | 'autre'

export const RESTAURANT_TYPES: Array<{ value: RestaurantType; label: string; icon: string }> = [
  { value: 'brasserie', label: 'Brasserie', icon: '🍽️' },
  { value: 'gastronomique', label: 'Gastronomique', icon: '⭐' },
  { value: 'fast_food', label: 'Fast-food', icon: '🍔' },
  { value: 'pizzeria', label: 'Pizzeria', icon: '🍕' },
  { value: 'cafe_bar', label: 'Café / Bar', icon: '☕' },
  { value: 'autre', label: 'Autre', icon: '🍴' },
]

export default class Restaurant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare name: string

  @column()
  declare type: RestaurantType

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

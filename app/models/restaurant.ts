import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Strategy from './strategy.js'

export type RestaurantType =
  | 'brasserie'
  | 'gastronomique'
  | 'fast_food'
  | 'pizzeria'
  | 'cafe_bar'
  | 'autre'

export type PublicationRhythm = 'once_week' | 'three_week' | 'five_week' | 'daily'

export const RESTAURANT_TYPES: Array<{ value: RestaurantType; label: string; icon: string }> = [
  { value: 'brasserie', label: 'Brasserie', icon: '🍽️' },
  { value: 'gastronomique', label: 'Gastronomique', icon: '⭐' },
  { value: 'fast_food', label: 'Fast-food', icon: '🍔' },
  { value: 'pizzeria', label: 'Pizzeria', icon: '🍕' },
  { value: 'cafe_bar', label: 'Café / Bar', icon: '☕' },
  { value: 'autre', label: 'Autre', icon: '🍴' },
]

export const PUBLICATION_RHYTHMS: Array<{ value: PublicationRhythm; label: string; description: string }> = [
  { value: 'once_week', label: '1x par semaine', description: 'Idéal pour commencer en douceur' },
  { value: 'three_week', label: '3x par semaine', description: 'Un bon rythme pour être visible' },
  { value: 'five_week', label: '5x par semaine', description: 'Pour les plus motivés' },
  { value: 'daily', label: 'Tous les jours', description: 'Maximum de visibilité' },
]

export default class Restaurant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare strategyId: number | null

  @column()
  declare name: string

  @column()
  declare type: RestaurantType

  @column()
  declare publicationRhythm: PublicationRhythm | null

  @column()
  declare city: string | null

  @column()
  declare onboardingCompleted: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Strategy)
  declare strategy: BelongsTo<typeof Strategy>
}

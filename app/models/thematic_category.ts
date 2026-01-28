import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import MissionTemplate from './mission_template.js'

export default class ThematicCategory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare icon: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => MissionTemplate)
  declare missionTemplates: HasMany<typeof MissionTemplate>
}

/**
 * Default thematic categories for restaurant content
 */
export const DEFAULT_THEMATIC_CATEGORIES = [
  { name: 'Plat du jour', slug: 'plat-du-jour', icon: '🍽️' },
  { name: 'Équipe', slug: 'equipe', icon: '👨‍🍳' },
  { name: 'Ambiance', slug: 'ambiance', icon: '✨' },
  { name: 'Menu', slug: 'menu', icon: '📋' },
  { name: 'Boissons', slug: 'boissons', icon: '🍷' },
  { name: 'Desserts', slug: 'desserts', icon: '🍰' },
  { name: 'Coulisses', slug: 'coulisses', icon: '🎬' },
  { name: 'Événements', slug: 'evenements', icon: '🎉' },
  { name: 'Clients', slug: 'clients', icon: '😊' },
  { name: 'Conseils', slug: 'conseils', icon: '💡' },
  { name: 'Nouveautés', slug: 'nouveautes', icon: '🆕' },
  { name: 'Promotions', slug: 'promotions', icon: '🏷️' },
]

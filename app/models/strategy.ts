import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Restaurant from './restaurant.js'

export default class Strategy extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string

  @column()
  declare icon: string

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Restaurant)
  declare restaurants: HasMany<typeof Restaurant>
}

export const STRATEGIES = [
  {
    name: 'Ouverture de resto',
    slug: 'ouverture',
    description: 'Vous ouvrez bientôt ou venez d\'ouvrir ? Ce parcours vous aide à créer le buzz et attirer vos premiers clients.',
    icon: '🚀',
  },
  {
    name: 'Faire connaître',
    slug: 'notoriete',
    description: 'Votre resto existe mais vous voulez plus de visibilité ? On va booster votre présence sur Instagram.',
    icon: '📢',
  },
  {
    name: 'Je débute sur les réseaux',
    slug: 'debutant',
    description: 'Vous ne savez pas par où commencer ? On vous guide pas à pas pour maîtriser Instagram.',
    icon: '🎓',
  },
]

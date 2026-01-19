import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasOne, hasMany } from '@adonisjs/lucid/orm'
import type { HasOne, HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import Restaurant from './restaurant.js'
import InstagramConnection from './instagram_connection.js'
import Mission from './mission.js'
import Subscription from './subscription.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export type UserRole = 'user' | 'admin'

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: UserRole

  @column()
  declare lateProfileId: string | null

  /**
   * Cached AI interpretation (text + sentiment)
   */
  @column({
    prepare: (value: { text: string; sentiment: string } | null) =>
      value ? JSON.stringify(value) : null,
    consume: (value: string | object | null) => {
      if (!value) return null
      // PostgreSQL JSONB returns object directly, string needs parsing
      if (typeof value === 'string') return JSON.parse(value)
      return value
    },
  })
  declare aiInterpretation: { text: string; sentiment: 'positive' | 'neutral' | 'negative' } | null

  @column.dateTime()
  declare aiInterpretationAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasOne(() => Restaurant)
  declare restaurant: HasOne<typeof Restaurant>

  @hasOne(() => InstagramConnection)
  declare instagramConnection: HasOne<typeof InstagramConnection>

  @hasMany(() => Mission)
  declare missions: HasMany<typeof Mission>

  @hasOne(() => Subscription)
  declare subscription: HasOne<typeof Subscription>
}

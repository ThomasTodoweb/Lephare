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

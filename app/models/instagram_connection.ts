import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeSave, beforeFind, beforeFetch } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import encryption from '@adonisjs/core/services/encryption'
import User from './user.js'

export default class InstagramConnection extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare laterAccessToken: string

  @column()
  declare laterRefreshToken: string | null

  @column()
  declare instagramUsername: string

  @column.dateTime()
  declare connectedAt: DateTime

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @beforeSave()
  static async encryptTokens(connection: InstagramConnection) {
    if (connection.$dirty.laterAccessToken) {
      connection.laterAccessToken = encryption.encrypt(connection.laterAccessToken)
    }
    if (connection.$dirty.laterRefreshToken && connection.laterRefreshToken) {
      connection.laterRefreshToken = encryption.encrypt(connection.laterRefreshToken)
    }
  }

  @beforeFind()
  static preloadForFind(query: ModelQueryBuilderContract<typeof InstagramConnection>) {
    query.preload('user')
  }

  @beforeFetch()
  static preloadForFetch(query: ModelQueryBuilderContract<typeof InstagramConnection>) {
    query.preload('user')
  }

  /**
   * Get decrypted access token
   */
  getDecryptedAccessToken(): string {
    try {
      return encryption.decrypt<string>(this.laterAccessToken) || this.laterAccessToken
    } catch {
      return this.laterAccessToken
    }
  }

  /**
   * Get decrypted refresh token
   */
  getDecryptedRefreshToken(): string | null {
    if (!this.laterRefreshToken) return null
    try {
      return encryption.decrypt<string>(this.laterRefreshToken)
    } catch {
      return this.laterRefreshToken
    }
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false
    return this.expiresAt < DateTime.now()
  }
}

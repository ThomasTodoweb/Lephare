import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Mission from './mission.js'

export type PublicationStatus = 'draft' | 'pending' | 'published' | 'failed' | 'deleted'

/**
 * Instagram content type
 * - post: Single image post
 * - carousel: Multiple images (up to 10)
 * - reel: Short video
 * - story: Ephemeral content (24h)
 */
export type ContentType = 'post' | 'carousel' | 'reel' | 'story'

/**
 * Media item stored as JSON
 */
export interface PublicationMediaItem {
  type: 'image' | 'video'
  path: string // Local storage path
  url?: string // Late API URL after upload
  thumbnail?: string // For videos
  order: number
}

export default class Publication extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare missionId: number | null

  /**
   * Content type for Instagram
   */
  @column()
  declare contentType: ContentType

  /**
   * Legacy single image path (kept for backwards compatibility)
   * For new publications, use mediaItems instead
   */
  @column()
  declare imagePath: string

  /**
   * Multiple media items for carousel/reel
   * Stored as JSON array
   */
  @column({
    prepare: (value: PublicationMediaItem[]) => JSON.stringify(value),
    consume: (value: string) => (value ? JSON.parse(value) : []),
  })
  declare mediaItems: PublicationMediaItem[]

  @column()
  declare caption: string

  @column()
  declare aiGeneratedCaption: string | null

  @column()
  declare status: PublicationStatus

  @column()
  declare laterMediaId: string | null

  @column()
  declare instagramPostId: string | null

  @column.dateTime()
  declare publishedAt: DateTime | null

  @column()
  declare errorMessage: string | null

  /**
   * For reels: share to feed option
   */
  @column()
  declare shareToFeed: boolean

  /**
   * For reels: cover image path
   */
  @column()
  declare coverImagePath: string | null

  /**
   * AI quality analysis score: green, yellow, red
   */
  @column()
  declare qualityScore: 'green' | 'yellow' | 'red' | null

  /**
   * AI feedback message about the media quality
   */
  @column()
  declare qualityFeedback: string | null

  /**
   * When the AI analysis was performed
   */
  @column.dateTime()
  declare qualityAnalyzedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Mission)
  declare mission: BelongsTo<typeof Mission>
}

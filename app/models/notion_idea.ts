import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ContentIdea from './content_idea.js'

export type NotionIdeaStatus = 'pending' | 'reviewed' | 'approved' | 'rejected' | 'converted'
export type NotionContentType = 'post' | 'story' | 'reel' | 'carousel'

export default class NotionIdea extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare notionPageId: string

  @column()
  declare originalTitle: string

  @column()
  declare aiGeneratedTitle: string | null

  @column()
  declare contentType: NotionContentType

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string | string[]) => {
      if (Array.isArray(value)) return value
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    },
  })
  declare mediaPaths: string[]

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string | string[]) => {
      if (Array.isArray(value)) return value
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    },
  })
  declare mediaTypes: string[]

  @column()
  declare clientNotionId: string | null

  @column()
  declare clientName: string | null

  @column.dateTime()
  declare notionPublicationDate: DateTime | null

  @column()
  declare status: NotionIdeaStatus

  @column()
  declare contentIdeaId: number | null

  @column()
  declare adminNotes: string | null

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | string[] | null) => {
      if (!value) return null
      if (Array.isArray(value)) return value
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    },
  })
  declare tags: string[] | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => ContentIdea)
  declare contentIdea: BelongsTo<typeof ContentIdea>

  /**
   * Get the display title (AI-generated or original)
   */
  get displayTitle(): string {
    return this.aiGeneratedTitle || this.originalTitle
  }

  /**
   * Get the first media path for thumbnail
   */
  get thumbnailPath(): string | null {
    return this.mediaPaths.length > 0 ? this.mediaPaths[0] : null
  }

  /**
   * Check if this is a carousel (multiple media)
   */
  get isCarousel(): boolean {
    return this.mediaPaths.length > 1
  }

  /**
   * Get the primary media type
   */
  get primaryMediaType(): string {
    return this.mediaTypes.length > 0 ? this.mediaTypes[0] : 'image'
  }
}
